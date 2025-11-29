import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG, MESSAGES } from '../config.ts';
import { createTrackKeyboard } from '../keyboards/main-menu.ts';
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { createMainMenuKeyboard } from '../keyboards/main-menu.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

export async function handleLibrary(chatId: number, userId: number, messageId?: number) {
  try {
    // Get user from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', userId)
      .single();

    if (!profile) {
      const text = '❌ Пользователь не найден. Сначала откройте Mini App.';
      if (messageId) {
        await editMessageText(chatId, messageId, text, createMainMenuKeyboard());
      } else {
        await sendMessage(chatId, text, createMainMenuKeyboard());
      }
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
      const text = '❌ Ошибка при загрузке треков.';
      if (messageId) {
        await editMessageText(chatId, messageId, text, createMainMenuKeyboard());
      } else {
        await sendMessage(chatId, text, createMainMenuKeyboard());
      }
      return;
    }

    if (!tracks || tracks.length === 0) {
      if (messageId) {
        await editMessageText(chatId, messageId, MESSAGES.noTracks, createMainMenuKeyboard());
      } else {
        await sendMessage(chatId, MESSAGES.noTracks, createMainMenuKeyboard());
      }
      return;
    }

    // Escape markdown special characters
    const escapeMarkdown = (text: string) => text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
    
    let message = '🎵 *Ваши последние треки:*\n\n';
    
    for (const track of tracks) {
      const title = track.title || 'Без названия';
      const style = track.style || 'Без стиля';
      const statusEmoji = track.status === 'completed' ? '✅' : '⏳';
      
      message += `${statusEmoji} *${escapeMarkdown(title)}*\n`;
      message += `   🎸 ${escapeMarkdown(style)}\n`;
      message += `   📋 /track\\_${track.id.replace(/-/g, '')}\n\n`;
    }
    
    message += '\n💡 _Нажмите на команду для деталей_';

    if (messageId) {
      await editMessageText(chatId, messageId, message, createTrackKeyboard(tracks[0].id));
    } else {
      await sendMessage(chatId, message, createTrackKeyboard(tracks[0].id));
    }
  } catch (error) {
    console.error('Error in library command:', error);
    const text = '❌ Ошибка при загрузке библиотеки.';
    if (messageId) {
      await editMessageText(chatId, messageId, text, createMainMenuKeyboard());
    } else {
      await sendMessage(chatId, text, createMainMenuKeyboard());
    }
  }
}
