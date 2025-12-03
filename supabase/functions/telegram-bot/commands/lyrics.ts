/**
 * Lyrics Command Handler
 * Display track lyrics in Telegram
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { escapeMarkdown, splitText, cleanLyrics } from '../utils/index.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export async function handleLyrics(
  chatId: number,
  trackId: string,
  messageId?: number
) {
  try {
    // Fetch track with lyrics
    const { data: track, error } = await supabase
      .from('tracks')
      .select('id, title, lyrics')
      .eq('id', trackId)
      .single();

    if (error || !track) {
      await sendMessage(chatId, '❌ Трек не найден');
      return;
    }

    if (!track.lyrics) {
      const noLyricsMsg = `📝 *${escapeMarkdown(track.title || 'Трек')}*\n\n_Текст песни недоступен_`;
      
      if (messageId) {
        await editMessageText(chatId, messageId, noLyricsMsg, {
          inline_keyboard: [[
            { text: '⬅️ Назад', callback_data: `track_details_${trackId}` }
          ]]
        });
      } else {
        await sendMessage(chatId, noLyricsMsg, {
          inline_keyboard: [[
            { text: '⬅️ Назад', callback_data: `track_details_${trackId}` }
          ]]
        });
      }
      return;
    }

    // Clean lyrics from Suno tags
    const cleanedLyrics = cleanLyrics(track.lyrics);
    
    // Split if too long
    const chunks = splitText(cleanedLyrics, 3800);
    
    // Send first chunk with header
    const header = `📝 *${escapeMarkdown(track.title || 'Трек')}*\n\n`;
    
    if (chunks.length === 1) {
      const fullMessage = header + cleanedLyrics;
      
      if (messageId) {
        await editMessageText(chatId, messageId, fullMessage, {
          inline_keyboard: [[
            { text: '⬅️ Назад к треку', callback_data: `track_details_${trackId}` }
          ]]
        });
      } else {
        await sendMessage(chatId, fullMessage, {
          inline_keyboard: [[
            { text: '⬅️ Назад к треку', callback_data: `track_details_${trackId}` }
          ]]
        });
      }
    } else {
      // Multiple chunks - send separately
      for (let i = 0; i < chunks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === chunks.length - 1;
        
        let message = isFirst ? header + chunks[i] : chunks[i];
        
        if (isFirst && messageId) {
          await editMessageText(chatId, messageId, message + `\n\n_(часть ${i + 1}/${chunks.length})_`);
        } else {
          const keyboard = isLast ? {
            inline_keyboard: [[
              { text: '⬅️ Назад к треку', callback_data: `track_details_${trackId}` }
            ]]
          } : undefined;
          
          await sendMessage(
            chatId, 
            message + (isLast ? '' : `\n\n_(часть ${i + 1}/${chunks.length})_`),
            keyboard
          );
        }
      }
    }
  } catch (error) {
    console.error('Error handling lyrics:', error);
    await sendMessage(chatId, '❌ Ошибка при загрузке текста');
  }
}
