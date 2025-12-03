/**
 * Playlist Command Handler
 * Add tracks to playlists in Telegram
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { sendMessage, editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { escapeMarkdown } from '../utils/index.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function handleAddToPlaylist(
  chatId: number,
  userId: number,
  trackId: string,
  messageId?: number
) {
  try {
    // Get user's playlists
    // Note: playlists table may not exist yet, handle gracefully
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('id, title')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      // Playlists feature not available
      console.warn('Playlists table not found:', error);
      await sendMessage(chatId, '📁 Функция плейлистов скоро будет доступна!');
      return;
    }

    const message = `📁 *Добавить в плейлист*\n\n` +
      (playlists && playlists.length > 0 
        ? `Выберите плейлист:`
        : `У вас пока нет плейлистов.\nСоздайте первый!`);

    const playlistButtons = playlists?.map(p => [{
      text: `📁 ${p.title}`,
      callback_data: `playlist_add_${p.id}_${trackId}`
    }]) || [];

    const keyboard = {
      inline_keyboard: [
        ...playlistButtons,
        [{ text: '➕ Создать новый плейлист', callback_data: `playlist_new_${trackId}` }],
        [{ text: '⬅️ Назад', callback_data: `track_details_${trackId}` }]
      ]
    };

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendMessage(chatId, message, keyboard);
    }
  } catch (error) {
    console.error('Error handling add to playlist:', error);
    await sendMessage(chatId, '❌ Ошибка при загрузке плейлистов');
  }
}

export async function handlePlaylistAdd(
  chatId: number,
  playlistId: string,
  trackId: string,
  queryId: string
) {
  try {
    // Add track to playlist
    const { error } = await supabase
      .from('playlist_tracks')
      .insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: 0 // Will be updated by trigger
      });

    if (error) {
      if (error.code === '23505') {
        // Duplicate
        await answerCallbackQuery(queryId, '⚠️ Трек уже в этом плейлисте');
      } else {
        console.error('Error adding to playlist:', error);
        await answerCallbackQuery(queryId, '❌ Ошибка добавления');
      }
      return;
    }

    await answerCallbackQuery(queryId, '✅ Трек добавлен в плейлист!');
  } catch (error) {
    console.error('Error in playlist add:', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
  }
}

export async function handlePlaylistNew(
  chatId: number,
  trackId: string,
  messageId?: number
) {
  const message = `➕ *Создание плейлиста*\n\n` +
    `Для создания плейлиста откройте приложение:`;

  const MINI_APP_URL = Deno.env.get('MINI_APP_URL') || 'https://t.me/AIMusicVerseBot/app';

  const keyboard = {
    inline_keyboard: [
      [{ 
        text: '📱 Открыть приложение', 
        web_app: { url: `${MINI_APP_URL}?startapp=new_playlist_${trackId}` }
      }],
      [{ text: '⬅️ Назад', callback_data: `add_playlist_${trackId}` }]
    ]
  };

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendMessage(chatId, message, keyboard);
  }
}
