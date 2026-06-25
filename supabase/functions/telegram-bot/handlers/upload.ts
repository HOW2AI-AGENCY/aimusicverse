/**
 * Upload handlers for the ЗАГРУЗКА menu section
 * Enhanced with better UX - deletes menu before showing upload prompt
 */

import { editMessageText, answerCallbackQuery, sendMessage, deleteMessage } from "../telegram-api.ts";
import { setPendingUpload, cancelPendingUpload } from "../core/db-session-store.ts";
import { deleteActiveMenu, clearActiveMenu } from "../core/active-menu-manager.ts";
import { sendAutoDeleteMessage, AUTO_DELETE_TIMINGS } from "../utils/auto-delete.ts";
import { logger } from "../utils/index.ts";
import { logBotAction } from "../utils/bot-logger.ts";

const UPLOAD_INSTRUCTIONS: Record<string, { text: string; waitingType: string; deleteMenu?: boolean }> = {
  upload_audio_prompt: {
    text:
      `🎵 *ЗАГРУЗКА АУДИО*\n\n` +
      `Отправьте аудиофайл для обработки\\.\n\n` +
      `📎 *Форматы:* MP3, WAV, OGG, M4A, FLAC\n` +
      `📏 *Макс\\. размер:* 50 MB\n` +
      `⏱ *Макс\\. длина:* 10 минут\n\n` +
      `_Просто отправьте файл в этот чат\\.\\.\\._`,
    waitingType: "audio_upload",
    deleteMenu: true,
  },
  upload_voice_prompt: {
    text:
      `🎤 *ГОЛОСОВОЕ СООБЩЕНИЕ*\n\n` +
      `Запишите голосовое для обработки\\.\n\n` +
      `🎵 Напойте мелодию\n` +
      `📝 Надиктуйте текст песни\n` +
      `🎸 Запишите гитарную партию\n\n` +
      `_Нажмите и удерживайте 🎤 для записи\\.\\.\\._`,
    waitingType: "voice_upload",
    deleteMenu: true,
  },
  upload_lyrics_prompt: {
    text:
      `📝 *ЗАГРУЗКА ТЕКСТА*\n\n` +
      `Отправьте текст песни\\.\n\n` +
      `✍️ Напишите текст сообщением\n` +
      `📄 Или отправьте TXT файл\n\n` +
      `💡 *Советы:*\n` +
      `• Разделяйте куплеты пустой строкой\n` +
      `• Помечайте \\[Куплет\\], \\[Припев\\]\n\n` +
      `_Отправьте текст\\.\\.\\._`,
    waitingType: "lyrics_upload",
    deleteMenu: true,
  },
  upload_cover_prompt: {
    text:
      `🎭 *СОЗДАНИЕ КАВЕРА*\n\n` +
      `Загрузите трек для AI\\-кавера\\.\n\n` +
      `🎵 Мы извлечём вокал и создадим\n` +
      `новую аранжировку с AI\\-голосом\\.\n\n` +
      `📎 *Форматы:* MP3, WAV, OGG\n` +
      `📏 *Макс\\. размер:* 50 MB\n\n` +
      `_Отправьте аудиофайл\\.\\.\\._`,
    waitingType: "cover_upload",
    deleteMenu: true,
  },
  upload_extend_prompt: {
    text:
      `➕ *РАСШИРЕНИЕ ТРЕКА*\n\n` +
      `Продлите существующий трек\\.\n\n` +
      `🎵 AI проанализирует ваш трек и\n` +
      `создаст продолжение в том же стиле\\.\n\n` +
      `📎 *Форматы:* MP3, WAV, OGG\n` +
      `⏱ *Добавит:* до 30 секунд\n\n` +
      `_Отправьте аудиофайл\\.\\.\\._`,
    waitingType: "extend_upload",
    deleteMenu: true,
  },
};

// Map waitingType to upload mode
function getUploadMode(waitingType: string): "upload" | "cover" | "extend" {
  if (waitingType === "cover_upload") return "cover";
  if (waitingType === "extend_upload") return "extend";
  return "upload";
}

export async function handleUploadCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
): Promise<boolean> {
  const instruction = UPLOAD_INSTRUCTIONS[data];

  if (!instruction) {
    return false;
  }

  try {
    // Use existing session store
    await setPendingUpload(userId, getUploadMode(instruction.waitingType));

    if (instruction.deleteMenu) {
      // Delete the current menu message
      try {
        await deleteMessage(chatId, messageId);
      } catch {
        // Ignore if message was already deleted
      }

      // Clear the active menu state
      await clearActiveMenu(userId, chatId);

      // Send new message with upload instructions
      await sendMessage(chatId, instruction.text, {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [[{ text: "❌ Отмена", callback_data: "upload_cancel" }]],
        },
      } as Record<string, unknown>);
    } else {
      // Legacy behavior - edit the message
      await editMessageText(chatId, messageId, instruction.text, {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Отмена", callback_data: "upload_cancel" }],
            [{ text: "◀️ Назад", callback_data: "menu_upload" }],
          ],
        },
      } as Record<string, unknown>);
    }

    await answerCallbackQuery(queryId);
    await logBotAction(userId, chatId, "upload_prompt", { type: instruction.waitingType });

    return true;
  } catch (error) {
    logger.error("Failed to show upload prompt", error);
    await answerCallbackQuery(queryId, "❌ Ошибка");
    return true;
  }
}

export async function handleUploadCancel(
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
): Promise<boolean> {
  try {
    await cancelPendingUpload(userId);

    // Delete the upload prompt message
    try {
      await deleteMessage(chatId, messageId);
    } catch {
      // Ignore if message was already deleted
    }

    await sendAutoDeleteMessage(chatId, "❌ Загрузка отменена", AUTO_DELETE_TIMINGS.SHORT);
    await answerCallbackQuery(queryId, "Отменено");
    return true;
  } catch (error) {
    logger.error("Failed to cancel upload", error);
    return true;
  }
}

// Called after successful upload to show result
export async function showUploadResult(
  chatId: number,
  userId: number,
  result: {
    success: boolean;
    fileName?: string;
    fileId?: string;
    fileType?: string;
    error?: string;
  },
): Promise<void> {
  if (!result.success) {
    await sendMessage(chatId, `❌ *ОШИБКА ЗАГРУЗКИ*\n\n${result.error || "Неизвестная ошибка"}`, {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: "menu_upload" }],
          [{ text: "🏠 Главное меню", callback_data: "main_menu" }],
        ],
      },
    } as Record<string, unknown>);
    return;
  }

  const text =
    `✅ *ФАЙЛ ЗАГРУЖЕН\\!*\n\n` +
    `📄 *Имя:* ${result.fileName || "Файл"}\n` +
    `📁 *Тип:* ${result.fileType || "Аудио"}\n\n` +
    `_Что хотите сделать с файлом\\?_`;

  await sendMessage(chatId, text, {
    parse_mode: "MarkdownV2",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔍 Анализировать", callback_data: `analyze_audio_${result.fileId}` }],
        [{ text: "🎛️ Разделить на стемы", callback_data: `separate_stems_${result.fileId}` }],
        [{ text: "🎼 Использовать для генерации", callback_data: `use_reference_${result.fileId}` }],
        [{ text: "📤 Загрузить ещё", callback_data: "menu_upload" }],
        [{ text: "🏠 Главное меню", callback_data: "main_menu" }],
      ],
    },
  } as Record<string, unknown>);
}

// Called during upload to show progress
export async function showUploadProgress(
  chatId: number,
  progressPercent: number,
  messageId?: number,
): Promise<number | null> {
  const progressBar = "█".repeat(Math.floor(progressPercent / 10)) + "░".repeat(10 - Math.floor(progressPercent / 10));

  const text = `⏳ *ЗАГРУЗКА\\.\\.\\.*\n\n` + `${progressBar} ${progressPercent}%`;

  if (messageId) {
    try {
      await editMessageText(chatId, messageId, text, {
        parse_mode: "MarkdownV2",
      } as Record<string, unknown>);
      return messageId;
    } catch (e) {
      // Message might have been deleted
      return null;
    }
  } else {
    const result = await sendMessage(chatId, text, {
      parse_mode: "MarkdownV2",
    } as Record<string, unknown>);
    return result?.result?.message_id || null;
  }
}
