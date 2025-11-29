import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { createTrackKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage } from '../telegram-api.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleLibrary(chatId: number, userId: number) {
  try {
    // Get user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      await sendMessage(chatId, '❌ Пользователь не найден. Сначала откройте Mini App.');
      return;
    }

    // Get last 5 tracks
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('id, title, style, created_at, status')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching tracks:', error);
      await sendMessage(chatId, '❌ Ошибка при загрузке треков.');
      return;
    }

    if (!tracks || tracks.length === 0) {
      await sendMessage(chatId, MESSAGES.noTracks);
      return;
    }

    let message = '🎵 Ваши последние треки:\n\n';
    
    for (const track of tracks) {
      const title = track.title || 'Без названия';
      const style = track.style || 'Без стиля';
      const statusEmoji = track.status === 'completed' ? '✅' : '⏳';
      
      message += `${statusEmoji} ${title}\n`;
      message += `   Стиль: ${style}\n`;
      message += `   /track_${track.id}\n\n`;
    }

    await sendMessage(chatId, message, createTrackKeyboard(tracks[0].id));
  } catch (error) {
    console.error('Error in library command:', error);
    await sendMessage(chatId, '❌ Ошибка при загрузке библиотеки.');
  }
}
