/**
 * Handler for processing audio messages received in Telegram bot
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { BOT_CONFIG } from "../config.ts";
import { sendMessage, sendAudio, deleteMessage } from "../telegram-api.ts";
import { consumePendingUpload, type PendingUpload } from "../core/db-session-store.ts";
import { escapeMarkdown, trackMetric } from "../utils/index.ts";
import { createLogger } from "../../_shared/logger.ts";
import { resolveContentType, getFileUrl } from "../_shared/audio-utils.ts";
import { deleteActiveMenu, setActiveMenuMessageId } from "../core/active-menu-manager.ts";
import { setPendingClassification, showClassificationPrompt, type PendingClassification } from "./audio-classifier.ts";
import { handleAutoUploadWithPipeline } from "./audio/auto-upload.ts";
import { handleCloudUploadWithAnalysis } from "./audio/cloud-upload.ts";
import { processAudioUpload } from "./audio/process-upload.ts";
import { storeTemporaryAudio } from "./audio/store.ts";

const logger = createLogger("telegram-audio-handler");

// Use centralized singleton client
const supabase = getSupabaseClient();

interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

/**
 * Handle incoming audio message
 *
 * NEW BEHAVIOR: Show classification prompt before processing
 * User selects: Instrumental / Vocal / Vocal+Instrumental
 * Then we process with appropriate parameters
 */
export async function handleAudioMessage(
  chatId: number,
  userId: number,
  audio: TelegramAudio | TelegramVoice | TelegramDocument,
  type: "audio" | "voice" | "document",
): Promise<void> {
  const startTime = Date.now();

  try {
    // Delete any active menu before showing audio-related messages
    await deleteActiveMenu(userId, chatId);

    // === VOICE MESSAGE: Route to specialized voice processor ===
    // Voice messages get special treatment: transcription + melody detection
    if (type === "voice") {
      const { processVoiceMessage } = await import("./voice-processor.ts");
      await processVoiceMessage(chatId, userId, audio as TelegramVoice);
      return;
    }

    // Check for pending upload (cover/extend mode)
    const pendingUpload = await consumePendingUpload(userId);

    if (!pendingUpload) {
      // === NEW: Show classification prompt instead of auto-processing ===
      await showAudioClassificationPromptInternal(chatId, userId, audio, type);
      return;
    }

    // Handle 'upload' mode - save to cloud storage with full analysis
    if (pendingUpload.mode === "upload") {
      await handleCloudUploadWithAnalysis(chatId, userId, audio, type, pendingUpload, startTime);
      return;
    }

    // Validate file size (max 25MB for Telegram)
    const fileSize = "file_size" in audio ? audio.file_size || 0 : 0;
    if (fileSize > 25 * 1024 * 1024) {
      await sendMessage(chatId, "❌ Файл слишком большой \\(максимум 25MB\\)\\.");
      return;
    }

    // Get file info from Telegram
    const fileId = audio.file_id;

    await sendMessage(chatId, `⬇️ Загружаю аудиофайл\\.\\.\\.`);

    // Download file from Telegram
    const fileUrl = await getFileUrl(fileId);

    if (!fileUrl) {
      await sendMessage(chatId, "❌ Не удалось получить файл\\. Попробуйте ещё раз\\.");
      return;
    }

    await sendMessage(chatId, `📤 Обрабатываю и отправляю на генерацию\\.\\.\\.`);

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      await sendMessage(chatId, "❌ Профиль не найден\\. Откройте Mini App для регистрации\\.");
      return;
    }

    // Download the audio file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error("Failed to download audio from Telegram");
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Prepare filename
    const fileNameValue =
      "file_name" in audio && audio.file_name
        ? audio.file_name
        : "title" in audio && audio.title
          ? `${audio.title}.mp3`
          : `telegram_audio_${Date.now()}.mp3`;

    // Determine mime type
    const mimeType = "mime_type" in audio ? audio.mime_type || "audio/mpeg" : "audio/mpeg";

    // Call appropriate generation function
    const result = await processAudioUpload(
      profile.user_id,
      pendingUpload,
      {
        name: fileNameValue,
        type: mimeType,
        data: `data:${mimeType};base64,${base64Audio}`,
      },
      chatId,
    );

    if (result.success) {
      const modeText = pendingUpload.mode === "cover" ? "кавера" : "расширения";

      await sendMessage(
        chatId,
        `✅ *Генерация ${modeText} началась\\!*

⏳ Обычно занимает 2\\-4 минуты
🔔 Вы получите уведомление когда трек будет готов

🆔 Задача: \`${escapeMarkdown(result.taskId || "N/A")}\``,
        {
          inline_keyboard: [[{ text: "📱 Открыть в приложении", web_app: { url: `${BOT_CONFIG.miniAppUrl}` } }]],
        },
      );

      trackMetric({
        eventType: pendingUpload.mode === "cover" ? "cover_started" : "extend_started",
        success: true,
        telegramChatId: chatId,
        responseTimeMs: Date.now() - startTime,
        metadata: { taskId: result.taskId },
      });
    } else {
      await sendMessage(
        chatId,
        `❌ *Ошибка при отправке на генерацию*

${escapeMarkdown(result.error || "Неизвестная ошибка")}

Попробуйте:
• Проверить формат файла
• Использовать файл меньшего размера
• Попробовать позже`,
      );

      trackMetric({
        eventType: pendingUpload.mode === "cover" ? "cover_failed" : "extend_failed",
        success: false,
        telegramChatId: chatId,
        errorMessage: result.error,
        responseTimeMs: Date.now() - startTime,
      });
    }
  } catch (error) {
    logger.error("Error handling audio message", error);

    await sendMessage(chatId, `❌ Произошла ошибка при обработке аудио\\. Попробуйте ещё раз\\.`);

    trackMetric({
      eventType: "audio_processing_error",
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
    });
  }
}

/**
 * NEW: Show audio classification prompt
 * Collects file info and shows type selection buttons
 */
async function showAudioClassificationPromptInternal(
  chatId: number,
  userId: number,
  audio: TelegramAudio | TelegramVoice | TelegramDocument,
  type: "audio" | "voice" | "document",
): Promise<void> {
  try {
    // Get user profile first
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      await sendMessage(chatId, "❌ Профиль не найден\\. Откройте Mini App для регистрации\\.");
      return;
    }

    // Prepare file info
    const fileName =
      "file_name" in audio && audio.file_name
        ? audio.file_name
        : "title" in audio && audio.title
          ? `${audio.title}.mp3`
          : type === "voice"
            ? `Голосовое сообщение`
            : `audio_${Date.now()}.mp3`;

    const duration = "duration" in audio ? audio.duration : undefined;
    const fileSize = "file_size" in audio ? audio.file_size : undefined;
    const mimeType = "mime_type" in audio ? audio.mime_type : undefined;

    // Store pending classification
    const pendingData: PendingClassification = {
      fileId: audio.file_id,
      fileType: type,
      fileName,
      fileSize,
      duration,
      mimeType,
      createdAt: Date.now(),
    };

    await setPendingClassification(userId, pendingData);

    // Show classification prompt
    await showClassificationPrompt(chatId, userId, pendingData);

    logger.info("Showed classification prompt", { userId, fileName });
  } catch (error) {
    logger.error("Error showing classification prompt", error);
    await sendMessage(chatId, "❌ Ошибка обработки файла\\. Попробуйте ещё раз\\.");
  }
}

/**
 * Check if message contains audio
 */
export function isAudioMessage(message: unknown): message is {
  audio?: TelegramAudio;
  voice?: TelegramVoice;
  document?: TelegramDocument;
} {
  const msg = message as Record<string, unknown>;

  // Check for audio
  if (msg.audio) return true;

  // Check for voice message
  if (msg.voice) return true;

  // Check for audio document
  if (msg.document) {
    const doc = msg.document as TelegramDocument;
    const mimeType = doc.mime_type || "";
    const fileName = doc.file_name || "";

    // Check if it's an audio file
    if (mimeType.startsWith("audio/")) return true;
    if (/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(fileName)) return true;
  }

  return false;
}
