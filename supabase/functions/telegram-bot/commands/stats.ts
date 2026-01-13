/**
 * Track Statistics Command Handler
 * Display track analytics in Telegram
 */

import { getSupabaseClient } from '../core/supabase-client.ts';
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { escapeMarkdown, formatDuration } from '../utils/index.ts';

const supabase = getSupabaseClient();

export async function handleTrackStats(
  chatId: number,
  trackId: string,
  messageId?: number
) {
  try {
    // Fetch track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, title, play_count, created_at, duration_seconds, style, tags')
      .eq('id', trackId)
      .single();

    if (trackError || !track) {
      await sendMessage(chatId, '❌ Трек не найден');
      return;
    }

    // Fetch analytics data
    const { data: analytics } = await supabase
      .from('track_analytics')
      .select('event_type')
      .eq('track_id', trackId);

    // Count events
    const plays = analytics?.filter(a => a.event_type === 'play').length || track.play_count || 0;
    const downloads = analytics?.filter(a => a.event_type === 'download').length || 0;
    const shares = analytics?.filter(a => a.event_type === 'share').length || 0;

    // Fetch likes count
    const { count: likesCount } = await supabase
      .from('track_likes')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    // Fetch versions count
    const { count: versionsCount } = await supabase
      .from('track_versions')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    // Format creation date
    const createdDate = new Date(track.created_at).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Build stats message
    const statsMessage = `📊 *Статистика трека*\n\n` +
      `🎵 *${escapeMarkdown(track.title || 'Без названия')}*\n` +
      `${track.style ? `🎸 ${escapeMarkdown(track.style.split(',')[0])}\n` : ''}` +
      `⏱️ ${formatDuration(track.duration_seconds || 0)}\n\n` +
      `📈 *Активность:*\n` +
      `▶️ Прослушиваний: ${plays}\n` +
      `⬇️ Скачиваний: ${downloads}\n` +
      `📤 Поделились: ${shares}\n` +
      `❤️ Лайков: ${likesCount || 0}\n\n` +
      `🔄 Версий: ${versionsCount || 1}\n` +
      `📅 Создан: ${createdDate}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '▶️ Играть', callback_data: `play_${trackId}` },
          { text: '📥 Скачать', callback_data: `dl_${trackId}` }
        ],
        [{ text: '⬅️ Назад к треку', callback_data: `track_details_${trackId}` }]
      ]
    };

    if (messageId) {
      await editMessageText(chatId, messageId, statsMessage, keyboard);
    } else {
      await sendMessage(chatId, statsMessage, keyboard);
    }
  } catch (error) {
    console.error('Error handling track stats:', error);
    await sendMessage(chatId, '❌ Ошибка при загрузке статистики');
  }
}
