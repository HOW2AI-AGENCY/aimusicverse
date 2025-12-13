/**
 * Track details handling for Telegram bot
 * Displays full track information with playback, share, and action options
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { sendPhoto, sendAudio, editMessageMedia, answerCallbackQuery, deleteMessage } from '../telegram-api.ts';
import { buildMessage, createKeyValue } from '../utils/message-formatter.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';
import { navigateTo } from '../core/navigation-state.ts';
import { BOT_CONFIG } from '../config.ts';
import { deleteActiveMenu, setActiveMenuMessageId } from '../core/active-menu-manager.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

interface Track {
  id: string;
  title: string | null;
  audio_url: string | null;
  local_audio_url: string | null;
  cover_url: string | null;
  local_cover_url: string | null;
  duration_seconds: number | null;
  style: string | null;
  tags: string | null;
  lyrics: string | null;
  play_count: number | null;
  likes_count: number | null;
  is_public: boolean | null;
  created_at: string;
  user_id: string;
  artist_name: string | null;
  prompt: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export async function handleTrackDetails(
  chatId: number,
  userId: number,
  trackId: string,
  messageId?: number
): Promise<void> {
  navigateTo(userId, `track_${trackId}`, messageId);

  // Fetch track details
  const { data: track, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .single();

  if (error || !track) {
    const caption = buildMessage({
      title: 'Трек не найден',
      emoji: '❌',
      description: 'Трек был удален или недоступен'
    });

    const keyboard = new ButtonBuilder()
      .addButton({
        text: 'К библиотеке',
        emoji: '📚',
        action: { type: 'callback', data: 'nav_library' }
      })
      .addButton({
        text: 'Главное меню',
        emoji: '🏠',
        action: { type: 'callback', data: 'open_main_menu' }
      })
      .build();

    if (messageId) {
      await editMessageMedia(
        chatId,
        messageId,
        {
          type: 'photo',
          media: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop&q=80',
          caption: caption,
          parse_mode: 'MarkdownV2'
        },
        keyboard
      );
    }
    return;
  }

  // Check if user has liked this track
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  let isLiked = false;
  if (profile) {
    const { data: like } = await supabase
      .from('track_likes')
      .select('id')
      .eq('track_id', trackId)
      .eq('user_id', profile.user_id)
      .single();
    isLiked = !!like;
  }

  // Build track info
  const trackInfo: Record<string, string> = {};
  
  if (track.artist_name) {
    trackInfo['Исполнитель'] = track.artist_name;
  }
  if (track.duration_seconds) {
    trackInfo['Длительность'] = formatDuration(track.duration_seconds);
  }
  if (track.style) {
    trackInfo['Стиль'] = track.style;
  }
  if (track.tags) {
    trackInfo['Теги'] = track.tags;
  }
  trackInfo['Создан'] = new Date(track.created_at).toLocaleDateString('ru-RU');

  // Stats section
  const statsInfo: Record<string, string> = {
    'Прослушивания': `▶️ ${track.play_count || 0}`,
    'Лайки': `❤️ ${track.likes_count || 0}`,
    'Статус': track.is_public ? '🌍 Публичный' : '🔒 Приватный'
  };

  const caption = buildMessage({
    title: track.title || 'Без названия',
    emoji: '🎵',
    sections: [
      {
        title: 'Информация',
        content: createKeyValue(trackInfo),
        emoji: 'ℹ️'
      },
      {
        title: 'Статистика',
        content: createKeyValue(statsInfo),
        emoji: '📊'
      }
    ]
  });

  const coverUrl = track.local_cover_url || track.cover_url || 
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop&q=80';

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Слушать',
      emoji: '▶️',
      action: { type: 'callback', data: `play_track_${trackId}` }
    })
    .addRow(
      {
        text: isLiked ? 'В избранном' : 'В избранное',
        emoji: isLiked ? '❤️' : '🤍',
        action: { type: 'callback', data: `toggle_like_${trackId}` }
      },
      {
        text: 'Скачать',
        emoji: '⬇️',
        action: { type: 'callback', data: `download_track_${trackId}` }
      }
    )
    .addRow(
      {
        text: 'Поделиться',
        emoji: '📤',
        action: { type: 'callback', data: `share_track_${trackId}` }
      },
      {
        text: 'Студия',
        emoji: '🎛️',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/studio/${trackId}` }
      }
    )
    .addRow(
      {
        text: 'Открыть в приложении',
        emoji: '📱',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` }
      }
    )
    .addButton({
      text: 'К библиотеке',
      emoji: '🔙',
      action: { type: 'callback', data: 'nav_library' }
    })
    .build();

  if (messageId) {
    await editMessageMedia(
      chatId,
      messageId,
      {
        type: 'photo',
        media: coverUrl,
        caption: caption,
        parse_mode: 'MarkdownV2'
      },
      keyboard
    );
  } else {
    const result = await sendPhoto(chatId, coverUrl, {
      caption: caption,
      replyMarkup: keyboard
    });
    
    if (result?.result?.message_id) {
      await setActiveMenuMessageId(userId, chatId, result.result.message_id, `track_${trackId}`);
    }
  }
}

export async function handlePlayTrack(
  chatId: number,
  userId: number,
  trackId: string,
  queryId: string
): Promise<void> {
  await answerCallbackQuery(queryId, '▶️ Отправляю аудио...');

  // Fetch track
  const { data: track } = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .single();

  if (!track) {
    await answerCallbackQuery(queryId, '❌ Трек не найден');
    return;
  }

  const audioUrl = track.local_audio_url || track.audio_url;
  if (!audioUrl) {
    await answerCallbackQuery(queryId, '❌ Аудио недоступно');
    return;
  }

  // Increment play count
  await supabase.rpc('increment_track_play_count', { track_id_param: trackId });

  // Send audio with action buttons (NOT menu, just content)
  const keyboard = new ButtonBuilder()
    .addRow(
      {
        text: 'Подробнее',
        emoji: 'ℹ️',
        action: { type: 'callback', data: `track_details_${trackId}` }
      },
      {
        text: 'Поделиться',
        emoji: '📤',
        action: { type: 'callback', data: `share_track_${trackId}` }
      }
    )
    .addButton({
      text: 'Меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'open_main_menu' }
    })
    .build();

  const title = track.title || 'MusicVerse Track';
  const performer = track.artist_name || 'MusicVerse AI';
  const duration = track.duration_seconds ? Math.floor(track.duration_seconds) : undefined;
  const thumbnail = track.local_cover_url || track.cover_url || undefined;

  await sendAudio(chatId, audioUrl, {
    caption: `🎵 *${escapeMarkdown(title)}*\n👤 ${escapeMarkdown(performer)}`,
    title,
    performer,
    duration,
    thumbnail,
    replyMarkup: keyboard
  });
}

export async function handleToggleLike(
  chatId: number,
  userId: number,
  trackId: string,
  queryId: string
): Promise<void> {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', userId)
    .single();

  if (!profile) {
    await answerCallbackQuery(queryId, '❌ Профиль не найден');
    return;
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('track_likes')
    .select('id')
    .eq('track_id', trackId)
    .eq('user_id', profile.user_id)
    .single();

  if (existingLike) {
    // Unlike
    await supabase
      .from('track_likes')
      .delete()
      .eq('id', existingLike.id);
    
    await answerCallbackQuery(queryId, '💔 Удалено из избранного');
  } else {
    // Like
    await supabase
      .from('track_likes')
      .insert({
        track_id: trackId,
        user_id: profile.user_id
      });
    
    await answerCallbackQuery(queryId, '❤️ Добавлено в избранное');
  }
}

export async function handleShareTrack(
  chatId: number,
  userId: number,
  trackId: string,
  messageId?: number
): Promise<void> {
  // Fetch track
  const { data: track } = await supabase
    .from('tracks')
    .select('title, artist_name')
    .eq('id', trackId)
    .single();

  const title = track?.title || 'Трек';
  const deepLink = `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}`;

  const caption = buildMessage({
    title: 'Поделиться треком',
    emoji: '📤',
    description: `"${title}"`,
    sections: [
      {
        title: 'Способы',
        content: [
          '• Отправить друзьям в Telegram',
          '• Скопировать ссылку',
          '• Поделиться в историю'
        ],
        emoji: '💡',
        style: 'list'
      }
    ]
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Отправить друзьям',
      emoji: '👥',
      action: { type: 'switch_inline', query: `track_${trackId}` }
    })
    .addRow(
      {
        text: 'Копировать ссылку',
        emoji: '🔗',
        action: { type: 'callback', data: `copy_link_${trackId}` }
      },
      {
        text: 'В историю',
        emoji: '📱',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}?startapp=share_${trackId}` }
      }
    )
    .addButton({
      text: 'Назад к треку',
      emoji: '🔙',
      action: { type: 'callback', data: `track_details_${trackId}` }
    })
    .build();

  if (messageId) {
    await editMessageMedia(
      chatId,
      messageId,
      {
        type: 'photo',
        media: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop&q=80',
        caption: caption,
        parse_mode: 'MarkdownV2'
      },
      keyboard
    );
  }
}

export async function handleTrackCallback(
  callbackData: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  // Handle track details
  if (callbackData.startsWith('track_details_')) {
    await answerCallbackQuery(queryId);
    const trackId = callbackData.replace('track_details_', '');
    await handleTrackDetails(chatId, userId, trackId, messageId);
    return true;
  }

  // Handle play track
  if (callbackData.startsWith('play_track_')) {
    const trackId = callbackData.replace('play_track_', '');
    await handlePlayTrack(chatId, userId, trackId, queryId);
    return true;
  }

  // Handle toggle like
  if (callbackData.startsWith('toggle_like_')) {
    const trackId = callbackData.replace('toggle_like_', '');
    await handleToggleLike(chatId, userId, trackId, queryId);
    // Refresh track details to show updated like status
    await handleTrackDetails(chatId, userId, trackId, messageId);
    return true;
  }

  // Handle download track
  if (callbackData.startsWith('download_track_')) {
    await answerCallbackQuery(queryId, '⬇️ Загрузка...');
    const trackId = callbackData.replace('download_track_', '');
    await handlePlayTrack(chatId, userId, trackId, queryId); // Same as play for now
    return true;
  }

  // Handle share track
  if (callbackData.startsWith('share_track_')) {
    await answerCallbackQuery(queryId);
    const trackId = callbackData.replace('share_track_', '');
    await handleShareTrack(chatId, userId, trackId, messageId);
    return true;
  }

  // Handle copy link
  if (callbackData.startsWith('copy_link_')) {
    const trackId = callbackData.replace('copy_link_', '');
    const deepLink = `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}`;
    await answerCallbackQuery(queryId, `🔗 ${deepLink}`);
    return true;
  }

  return false;
}
