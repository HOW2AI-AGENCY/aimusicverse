/**
 * Upload handlers for the ЗАГРУЗКА menu section
 */

import { editMessageText, answerCallbackQuery } from '../telegram-api.ts';
import { setWaitingForInput } from '../db-session-store.ts';
import { sendAutoDeleteMessage, AUTO_DELETE_TIMINGS } from '../utils/auto-delete.ts';
import { logger } from '../utils/index.ts';
import { logBotAction } from '../utils/bot-logger.ts';

const UPLOAD_INSTRUCTIONS: Record<string, { text: string; waitingType: string }> = {
  upload_audio_prompt: {
    text: `🎵 *ЗАГРУЗКА АУДИО*\n\nОтправьте аудиофайл для обработки\\.\n\n📎 *Форматы:* MP3, WAV, OGG, M4A\n📏 *Макс\\. размер:* 50 MB\n\n_Отправьте файл в чат\\.\\.\\._`,
    waitingType: 'audio_upload',
  },
  upload_voice_prompt: {
    text: `🎤 *ГОЛОСОВОЕ СООБЩЕНИЕ*\n\nЗапишите голосовое для обработки\\.\n\n🎵 Напойте мелодию\n📝 Надиктуйте текст\n\n_Отправьте голосовое\\.\\.\\._`,
    waitingType: 'voice_upload',
  },
  upload_lyrics_prompt: {
    text: `📝 *ЗАГРУЗКА ТЕКСТА*\n\nОтправьте текст песни\\.\n\n✍️ Напишите текст сообщением\n📄 Или отправьте TXT файл\n\n_Отправьте текст\\.\\.\\._`,
    waitingType: 'lyrics_upload',
  },
  upload_cover_prompt: {
    text: `🎭 *СОЗДАНИЕ КАВЕРА*\n\nЗагрузите трек для AI\\-кавера\\.\n\n🎵 Отправьте оригинальный трек\n\n_Отправьте аудиофайл\\.\\.\\._`,
    waitingType: 'cover_upload',
  },
  upload_extend_prompt: {
    text: `➕ *РАСШИРЕНИЕ ТРЕКА*\n\nПродлите существующий трек\\.\n\n🎵 Загрузите трек для расширения\n\n_Отправьте аудиофайл\\.\\.\\._`,
    waitingType: 'extend_upload',
  },
};

export async function handleUploadCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string
): Promise<boolean> {
  const instruction = UPLOAD_INSTRUCTIONS[data];
  
  if (!instruction) {
    return false;
  }
  
  try {
    await setWaitingForInput(userId, instruction.waitingType, { chatId, messageId });
    
    await editMessageText(chatId, messageId, instruction.text, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'upload_cancel' }],
          [{ text: '◀️ Назад', callback_data: 'menu_upload' }],
        ],
      },
    } as Record<string, unknown>);
    
    await answerCallbackQuery(queryId);
    await logBotAction(userId, chatId, 'upload_prompt', { type: instruction.waitingType });
    
    return true;
  } catch (error) {
    logger.error('Failed to show upload prompt', error);
    await answerCallbackQuery(queryId, '❌ Ошибка');
    return true;
  }
}

export async function handleUploadCancel(
  chatId: number,
  userId: number,
  _messageId: number,
  queryId: string
): Promise<boolean> {
  try {
    await setWaitingForInput(userId, null);
    await sendAutoDeleteMessage(chatId, '❌ Загрузка отменена', AUTO_DELETE_TIMINGS.SHORT);
    await answerCallbackQuery(queryId, 'Отменено');
    return true;
  } catch (error) {
    logger.error('Failed to cancel upload', error);
    return true;
  }
}
