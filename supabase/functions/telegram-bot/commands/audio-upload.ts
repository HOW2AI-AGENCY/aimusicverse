/**
 * Audio upload commands for creating covers and extending tracks via Telegram bot
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { BOT_CONFIG } from '../config.ts';
import { sendMessage, editMessageText } from '../telegram-api.ts';
import { setPendingUpload, cancelPendingUpload, hasPendingUpload } from '../core/db-session-store.ts';
import { escapeMarkdown } from '../utils/index.ts';

const supabase = createClient(
  BOT_CONFIG.supabaseUrl,
  BOT_CONFIG.supabaseServiceKey
);

/**
 * /cover command - initiate cover creation from audio
 */
export async function handleCoverCommand(
  chatId: number, 
  userId: number, 
  args: string,
  messageId?: number
): Promise<void> {
  // Parse arguments for options
  const options = parseAudioOptions(args);
  
  // Set pending upload for user (now async with DB)
  await setPendingUpload(userId, 'cover', options);
  
  const text = `🎵 *Создание кавера*

Отправьте аудиофайл \\(MP3, WAV, OGG\\) для создания кавер\\-версии\\.

${options.prompt ? `📝 Описание: _${escapeMarkdown(options.prompt)}_\n` : ''}${options.style ? `🎨 Стиль: _${escapeMarkdown(options.style)}_\n` : ''}${options.instrumental ? '🎸 Режим: _Инструментал_\n' : ''}

⏳ Ожидание аудио\\.\\.\\. \\(15 минут\\)
❌ Отмена: /cancel`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '❌ Отмена', callback_data: 'cancel_upload' },
        { text: '📱 Открыть в приложении', url: `${BOT_CONFIG.deepLinkBase}?startapp=upload_cover` }
      ]
    ]
  };

  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

/**
 * /extend command - initiate track extension from audio
 */
export async function handleExtendCommand(
  chatId: number, 
  userId: number, 
  args: string,
  messageId?: number
): Promise<void> {
  const options = parseAudioOptions(args);
  
  await setPendingUpload(userId, 'extend', options);
  
  const text = `🔄 *Расширение трека*

Отправьте аудиофайл \\(MP3, WAV, OGG\\) для продолжения/расширения\\.

${options.prompt ? `📝 Текст: _${escapeMarkdown(options.prompt)}_\n` : ''}${options.style ? `🎨 Стиль: _${escapeMarkdown(options.style)}_\n` : ''}${options.title ? `📛 Название: _${escapeMarkdown(options.title)}_\n` : ''}

⏳ Ожидание аудио\\.\\.\\. \\(15 минут\\)
❌ Отмена: /cancel`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '❌ Отмена', callback_data: 'cancel_upload' },
        { text: '📱 Открыть в приложении', url: `${BOT_CONFIG.deepLinkBase}?startapp=upload_extend` }
      ]
    ]
  };

  if (messageId) {
    await editMessageText(chatId, messageId, text, keyboard);
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

/**
 * /cancel command - cancel pending upload
 */
export async function handleCancelCommand(
  chatId: number,
  userId: number
): Promise<void> {
  const cancelled = await cancelPendingUpload(userId);
  if (cancelled) {
    await sendMessage(chatId, '✅ Загрузка аудио отменена\\.');
  } else {
    await sendMessage(chatId, 'ℹ️ Нет активных ожиданий загрузки\\.');
  }
}

/**
 * Handle cancel_upload callback
 */
export async function handleCancelUploadCallback(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string
): Promise<void> {
  await cancelPendingUpload(userId);
  
  const { answerCallbackQuery } = await import('../telegram-api.ts');
  await answerCallbackQuery(callbackId, '✅ Загрузка отменена');
  
  await editMessageText(chatId, messageId, '✅ Загрузка аудио отменена\\.');
}

/**
 * Handle audio action callback (when user clicks inline button after sending audio)
 */
export async function handleAudioActionCallback(
  chatId: number,
  userId: number,
  action: string,
  messageId: number,
  callbackId: string
): Promise<void> {
  const { answerCallbackQuery } = await import('../telegram-api.ts');
  const { consumePendingAudio } = await import('../core/db-session-store.ts');
  
  // Get the stored audio file_id
  const audioData = await consumePendingAudio(userId);
  
  if (!audioData) {
    await answerCallbackQuery(callbackId, '⚠️ Аудио файл истёк. Отправьте снова.');
    return;
  }
  
  // Set pending upload based on action
  if (action === 'cover') {
    await setPendingUpload(userId, 'cover', {});
    await answerCallbackQuery(callbackId, '🎤 Создание кавера');
    
    // Process the audio immediately
    const { handleAudioMessage } = await import('../handlers/audio.ts');
    // Note: We need to reconstruct the audio object
    // For now, show a message to re-upload
    await editMessageText(chatId, messageId, `✅ *Режим выбран: Кавер*

Отправьте аудио файл повторно для обработки\\.`);
  } else if (action === 'extend') {
    await setPendingUpload(userId, 'extend', {});
    await answerCallbackQuery(callbackId, '➕ Расширение трека');
    
    await editMessageText(chatId, messageId, `✅ *Режим выбран: Расширение*

Отправьте аудио файл повторно для обработки\\.`);
  } else if (action === 'upload') {
    await setPendingUpload(userId, 'upload', {});
    await answerCallbackQuery(callbackId, '📤 Загрузка в облако');
    
    await editMessageText(chatId, messageId, `✅ *Режим выбран: Загрузка*

Отправьте аудио файл повторно для сохранения в облако\\.`);
  } else if (action === 'recognize') {
    await answerCallbackQuery(callbackId, '🎼 Функция скоро...');
  } else if (action === 'midi') {
    await answerCallbackQuery(callbackId, '🎹 Функция скоро...');
  }
}

/**
 * Check upload status for a user
 */
export async function checkUploadPending(userId: number): Promise<boolean> {
  return await hasPendingUpload(userId);
}

/**
 * Parse audio options from command arguments
 */
function parseAudioOptions(args: string): {
  prompt?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  model?: string;
} {
  const options: {
    prompt?: string;
    style?: string;
    title?: string;
    instrumental?: boolean;
    model?: string;
  } = {};
  
  let remaining = args;
  
  // Parse flags
  const flagRegex = /--([\w]+)(?:=("[^"]+"|'[^']+'|\S+))?/g;
  let match;
  
  while ((match = flagRegex.exec(args)) !== null) {
    const flag = match[1];
    const value = match[2]?.replace(/^["']|["']$/g, '') || 'true';
    
    switch (flag) {
      case 'instrumental':
        options.instrumental = true;
        break;
      case 'style':
        options.style = value;
        break;
      case 'title':
        options.title = value;
        break;
      case 'model':
        options.model = value.toUpperCase();
        break;
    }
    
    remaining = remaining.replace(match[0], '').trim();
  }
  
  // Remaining text is the prompt/description
  if (remaining.trim()) {
    options.prompt = remaining.trim();
  }
  
  return options;
}

/**
 * Get help text for audio upload commands
 */
export function getAudioUploadHelp(): string {
  return `🎵 *Загрузка аудио*

*Создание кавера:*
/cover \\- базовая команда
/cover энергичный рок \\- с описанием
/cover \\-\\-style="indie rock" \\-\\-instrumental \\- с параметрами

*Расширение трека:*
/extend \\- базовая команда  
/extend \\-\\-title="My Song Part 2" продолжение песни
/extend \\-\\-style="epic orchestra" \\-\\-model=V5

*Параметры:*
\\-\\-style="стиль" \\- музыкальный стиль
\\-\\-title="название" \\- название трека
\\-\\-instrumental \\- без вокала
\\-\\-model=V5 \\- модель генерации

*Поддерживаемые форматы:*
MP3, WAV, OGG, M4A \\(до 25MB\\)`;
}
