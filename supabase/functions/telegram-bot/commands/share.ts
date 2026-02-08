import { getSupabaseClient } from '../core/supabase-client.ts';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, sendAudio } from '../telegram-api.ts';
import { createShareTrackKeyboard, createTrackDetailsKeyboard } from '../keyboards/share-menu.ts';
import { getBotMention } from '../../_shared/telegram-config.ts';

const supabase = getSupabaseClient();

export async function handleShareTrack(chatId: number, trackId: string, messageId?: number) {
  try {
    const { data: track } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (!track) {
      const msg = '❌ Трек не найден';
      if (messageId) {
        await editMessageText(chatId, messageId, msg);
      } else {
        await sendMessage(chatId, msg);
      }
      return;
    }

    const msg = `📤 *Поделиться треком*\n\n🎵 *${track.title || 'Новый трек'}*\n${track.style ? `🎸 ${track.style}` : ''}\n\n✨ Выберите способ:`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createShareTrackKeyboard(trackId));
    } else {
      await sendMessage(chatId, msg, createShareTrackKeyboard(trackId));
    }
  } catch (error) {
    console.error('Error sharing track:', error);
    const msg = '❌ Ошибка при загрузке трека';
    if (messageId) {
      await editMessageText(chatId, messageId, msg);
    } else {
      await sendMessage(chatId, msg);
    }
  }
}

export async function handleSendTrackToChat(chatId: number, userId: number, trackId: string) {
  try {
    // Fetch track with creator profile
    const { data: track } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (!track || !track.audio_url) {
      await sendMessage(chatId, '❌ Трек не найден или не готов');
      return;
    }

    // Get creator profile for performer name
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('username, first_name')
      .eq('user_id', track.user_id)
      .single();

    const performer = creatorProfile?.username 
      ? `@${creatorProfile.username}` 
      : creatorProfile?.first_name || 'MusicVerse AI';

    const durationSeconds = track.duration_seconds || 0;
    const deepLink = `${BOT_CONFIG.deepLinkBase}?startapp=track_${trackId}`;
    
    // Build rich caption
    const caption = buildTrackCaption(track, performer, deepLink);

    // Use cached file_id if available, otherwise use URL
    const audioSource = track.telegram_file_id || track.audio_url;

    const response = await sendAudio(chatId, audioSource, {
      caption: caption,
      title: track.title || 'MusicVerse Track',
      performer: performer,
      duration: durationSeconds,
      thumbnail: track.cover_url,
      replyMarkup: createTrackDetailsKeyboard(trackId)
    });

    // Cache file_id for future use
    if (response?.ok && response?.result?.audio?.file_id && !track.telegram_file_id) {
      await supabase
        .from('tracks')
        .update({ telegram_file_id: response.result.audio.file_id })
        .eq('id', trackId);
      
      console.log(`Cached file_id for track ${trackId}`);
    }

    await sendMessage(chatId, '✅ Трек отправлен!');
  } catch (error) {
    console.error('Error sending track to chat:', error);
    await sendMessage(chatId, '❌ Ошибка при отправке трека');
  }
}

// Escape special characters for Telegram Markdown
function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function buildTrackCaption(track: any, performer: string, deepLink: string): string {
  const lines: string[] = [];
  
  // Title with emoji
  const title = track.title || 'Новый трек';
  lines.push(`🎵 *${escapeMarkdown(title)}*`);
  
  // Performer - @ usernames are already clickable
  if (performer.startsWith('@')) {
    lines.push(`👤 ${performer}`);
  } else {
    lines.push(`👤 _${escapeMarkdown(performer)}_`);
  }
  
  // Style
  if (track.style) {
    const firstStyle = track.style.split(',')[0].trim();
    lines.push(`🎸 ${escapeMarkdown(firstStyle)}`);
  }
  
  // Duration
  if (track.duration_seconds) {
    const mins = Math.floor(track.duration_seconds / 60);
    const secs = Math.floor(track.duration_seconds % 60);
    lines.push(`⏱️ ${mins}:${String(secs).padStart(2, '0')}`);
  }
  
  // Hashtags - replace spaces with underscores, lowercase
  if (track.tags) {
    const hashtags = track.tags
      .split(',')
      .slice(0, 3)
      .map((t: string) => `#${t.trim().replace(/\s+/g, '_').toLowerCase()}`)
      .join(' ');
    lines.push(`\n🏷️ ${hashtags}`);
  }
  
  // Bot link with @ for clickability
  lines.push('');
  lines.push(`✨ _Создано в_ ${getBotMention()} ✨`);
  
  // Deep link
  lines.push(`\n🔗 [Открыть трек](${deepLink})`);
  
  return lines.join('\n');
}

export async function handleCopyTrackLink(chatId: number, trackId: string, messageId?: number) {
  const link = `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}`;
  const msg = `🔗 *Ссылка на трек*\n\n\`${link}\`\n\nСкопируйте и отправьте друзьям! 🎵`;
  
  if (messageId) {
    await editMessageText(chatId, messageId, msg, createTrackDetailsKeyboard(trackId));
  } else {
    await sendMessage(chatId, msg, createTrackDetailsKeyboard(trackId));
  }
}

export async function handleTrackDetails(chatId: number, trackId: string, messageId?: number) {
  try {
    const { data: track } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (!track) {
      const msg = '❌ Трек не найден';
      if (messageId) {
        await editMessageText(chatId, messageId, msg);
      } else {
        await sendMessage(chatId, msg);
      }
      return;
    }

    const durationSeconds = track.duration_seconds || 0;
    const durationText = durationSeconds > 0 
      ? `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')}`
      : '0:00';

    // Если есть аудио, отправляем аудио файл
    if (track.audio_url || track.local_audio_url) {
      const audioUrl = track.local_audio_url || track.audio_url;
      
      try {
        await sendAudio(chatId, audioUrl, {
          caption: `🎵 *${track.title || 'Новый трек'}*\n\n${track.style ? `🎸 Стиль: ${track.style}\n` : ''}⏱️ Длительность: ${durationText}\n📊 Прослушиваний: ${track.play_count || 0}\n📅 Создан: ${new Date(track.created_at).toLocaleDateString('ru-RU')}\n\n${track.prompt ? `💭 "${track.prompt.substring(0, 100)}${track.prompt.length > 100 ? '...' : ''}"` : ''}`,
          title: track.title || 'MusicVerse Track',
          performer: 'MusicVerse AI',
          duration: durationSeconds,
          thumbnail: track.cover_url || track.local_cover_url,
          replyMarkup: createTrackDetailsKeyboard(trackId)
        });
        return;
      } catch (audioError) {
        console.error('Error sending audio:', audioError);
        // Если не удалось отправить аудио, отправим текстовое сообщение
      }
    }

    // Если аудио нет или не удалось отправить, отправляем текстовое сообщение
    const msg = `🎵 *${track.title || 'Новый трек'}*\n\n${track.style ? `🎸 Стиль: ${track.style}\n` : ''}⏱️ Длительность: ${durationText}\n📊 Прослушиваний: ${track.play_count || 0}\n📅 Создан: ${new Date(track.created_at).toLocaleDateString('ru-RU')}\n\n${track.prompt ? `💭 "${track.prompt.substring(0, 100)}${track.prompt.length > 100 ? '...' : ''}"` : ''}${!track.audio_url && !track.local_audio_url ? '\n\n⚠️ Трек в процессе генерации' : ''}`;
    
    if (messageId) {
      await editMessageText(chatId, messageId, msg, createTrackDetailsKeyboard(trackId));
    } else {
      await sendMessage(chatId, msg, createTrackDetailsKeyboard(trackId));
    }
  } catch (error) {
    console.error('Error loading track details:', error);
    const msg = '❌ Ошибка при загрузке деталей трека';
    if (messageId) {
      await editMessageText(chatId, messageId, msg);
    } else {
      await sendMessage(chatId, msg);
    }
  }
}