/**
 * Command handlers for audio upload commands
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { BOT_CONFIG } from "../config.ts";
import { sendMessage, editMessageText, deleteMessage } from "../telegram-api.ts";
import { setPendingUpload, cancelPendingUpload, hasPendingUpload } from "../core/db-session-store.ts";
import { escapeMarkdown } from "../utils/index.ts";
import { getBotMention } from "../../_shared/telegram-config.ts";
import { parseAudioOptions } from "./audio-upload-utils.ts";

const supabase = getSupabaseClient();
const BOT_MENTION = getBotMention();

/**
 * /cover command - initiate cover creation from audio
 */
export async function handleCoverCommand(
  chatId: number,
  userId: number,
  args: string,
  messageId?: number,
  deleteOriginal?: boolean,
): Promise<void> {
  // Parse arguments for options
  const options = parseAudioOptions(args);

  // Set pending upload for user (now async with DB)
  await setPendingUpload(userId, "cover", options);

  const text = `🎵 *Создание кавера*

Отправьте аудиофайл \\\\(MP3, WAV, OGG\\\\) для создания кавер\\\\-версии\\\\.\\n
${options.prompt ? `📝 Описание: _${escapeMarkdown(options.prompt)}_\\n` : ""}${options.style ? `🎨 Стиль: _${escapeMarkdown(options.style)}_\\n` : ""}${options.instrumental ? "🎸 Режим: _Инструментал_\\n" : ""}

⏳ Ожидание аудио\\\\.\\\\.\\\\. \\\\(15 минут\\\)
❌ Отмена: /cancel`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "❌ Отмена", callback_data: "cancel_upload" },
        { text: "📱 Открыть в приложении", url: `${BOT_CONFIG.deepLinkBase}?startapp=upload_cover` },
      ],
    ],
  };

  if (messageId && deleteOriginal) {
    await deleteMessage(chatId, messageId);
    await sendMessage(chatId, text, keyboard);
  } else if (messageId) {
    const result = await editMessageText(chatId, messageId, text, keyboard);
    if (!result) {
      await deleteMessage(chatId, messageId);
      await sendMessage(chatId, text, keyboard);
    }
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
  messageId?: number,
  deleteOriginal?: boolean,
): Promise<void> {
  const options = parseAudioOptions(args);

  await setPendingUpload(userId, "extend", options);

  const text = `🔄 *Расширение трека*

Отправьте аудиофайл \\\\(MP3, WAV, OGG\\\\) для продолжения/расширения\\\\.\\n
${options.prompt ? `📝 Текст: _${escapeMarkdown(options.prompt)}_\\n` : ""}${options.style ? `🎨 Стиль: _${escapeMarkdown(options.style)}_\\n` : ""}${options.title ? `📛 Название: _${escapeMarkdown(options.title)}_\\n` : ""}

⏳ Ожидание аудио\\\\.\\\\.\\\\. \\\\(15 минут\\\)
❌ Отмена: /cancel`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "❌ Отмена", callback_data: "cancel_upload" },
        { text: "📱 Открыть в приложении", url: `${BOT_CONFIG.deepLinkBase}?startapp=upload_extend` },
      ],
    ],
  };

  if (messageId && deleteOriginal) {
    await deleteMessage(chatId, messageId);
    await sendMessage(chatId, text, keyboard);
  } else if (messageId) {
    const result = await editMessageText(chatId, messageId, text, keyboard);
    if (!result) {
      await deleteMessage(chatId, messageId);
      await sendMessage(chatId, text, keyboard);
    }
  } else {
    await sendMessage(chatId, text, keyboard);
  }
}

/**
 * /cancel command - cancel pending upload
 */
export async function handleCancelCommand(chatId: number, userId: number): Promise<void> {
  const cancelled = await cancelPendingUpload(userId);
  if (cancelled) {
    await sendMessage(chatId, "✅ Загрузка аудио отменена\\\\.", undefined);
  } else {
    await sendMessage(chatId, "ℹ️ Нет активных ожиданий загрузки\\\\.", undefined);
  }
}

/**
 * Check upload status for a user
 */
export async function checkUploadPending(userId: number): Promise<boolean> {
  return await hasPendingUpload(userId);
}
