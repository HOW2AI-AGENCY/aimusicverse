import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText, sendAudio } from '../telegram-api.ts';
import { createShareTrackKeyboard, createTrackDetailsKeyboard } from '../keyboards/share-menu.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

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
    const { data: track } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .single();

    if (!track || !track.audio_url) {
      await sendMessage(chatId, '❌ Трек не найден или не готов');
      return;
    }

    const durationSeconds = track.duration_seconds || 0;
    const durationText = `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')}`;

    await sendAudio(chatId, track.audio_url, {
      caption: `🎵 *${track.title || 'Новый трек'}*\n${track.style ? `🎸 Стиль: ${track.style}` : ''}\n⏱️ ${durationText}\n\n✨ Создано с помощью MusicVerse AI`,
      title: track.title || 'MusicVerse Track',
      performer: 'MusicVerse AI',
      duration: durationSeconds,
      thumbnail: track.cover_url,
      replyMarkup: createTrackDetailsKeyboard(trackId)
    });

    await sendMessage(chatId, '✅ Трек отправлен!');
  } catch (error) {
    console.error('Error sending track to chat:', error);
    await sendMessage(chatId, '❌ Ошибка при отправке трека');
  }
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
    const durationText = `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')}`;

    const msg = `🎵 *${track.title || 'Новый трек'}*\n\n${track.style ? `🎸 Стиль: ${track.style}` : ''}\n⏱️ Длительность: ${durationText}\n📊 Прослушиваний: ${track.play_count || 0}\n📅 Создан: ${new Date(track.created_at).toLocaleDateString('ru-RU')}\n\n${track.prompt ? `💭 "${track.prompt.substring(0, 100)}${track.prompt.length > 100 ? '...' : ''}"` : ''}`;
    
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