/**
 * Voice Message Handler for Telegram Bot
 * Transcribes voice messages and uses them for music generation
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { BOT_CONFIG } from "../config.ts";
import { sendMessage, editMessageText } from "../telegram-api.ts";
import { escapeMarkdown, trackMetric } from "../utils/index.ts";
import { createLogger } from "../../_shared/logger.ts";

const logger = createLogger("voice-handler");

const supabase = getSupabaseClient();

interface TelegramVoice {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
}

interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
}

/**
 * Check if message contains a voice message intended for generation
 */
export function isVoiceForGeneration(message: any): boolean {
  // Check if it's a voice message
  if (!message.voice) return false;

  // Check if there's a caption indicating generation intent
  const caption = message.caption?.toLowerCase() || "";
  const generationKeywords = ["генер", "создай", "сделай", "музык", "трек", "песн"];

  return generationKeywords.some((kw) => caption.includes(kw));
}

/**
 * Handle voice message for transcription and generation
 */
export async function handleVoiceForGeneration(chatId: number, userId: number, voice: TelegramVoice): Promise<boolean> {
  const startTime = Date.now();
  let progressMessageId: number | undefined;

  try {
    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      await sendMessage(chatId, "❌ Профиль не найден\\. Откройте приложение для регистрации\\.");
      return false;
    }

    // Check voice duration (max 60 seconds for transcription)
    if (voice.duration > 60) {
      await sendMessage(chatId, "⚠️ Голосовое сообщение слишком длинное\\. Максимум 60 секунд\\.");
      return false;
    }

    // Send progress message
    const progressMsg = await sendMessage(
      chatId,
      "🎤 *Голосовое сообщение получено\\!*\n\n" + "▓░░░░░░░░░ 10%\n" + "⏳ Распознаю речь\\.\\.\\.",
    );
    progressMessageId = progressMsg?.result?.message_id;

    // Get file URL from Telegram
    const fileUrl = await getFileUrl(voice.file_id);
    if (!fileUrl) {
      if (progressMessageId) {
        await editMessageText(chatId, progressMessageId, "❌ Не удалось получить файл\\.");
      }
      return false;
    }

    // Download voice file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error("Failed to download voice from Telegram");
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // Update progress
    if (progressMessageId) {
      await editMessageText(
        chatId,
        progressMessageId,
        "🎤 *Распознаю речь\\.\\.\\.*\n\n" + "▓▓▓░░░░░░░ 30%\n" + "⏳ Анализирую аудио\\.\\.\\.",
      );
    }

    // Call speech-to-text function
    const { data: transcription, error: transcriptionError } = await supabase.functions.invoke("speech-to-text", {
      body: {
        audio_data: base64Audio,
        audio_format: voice.mime_type || "audio/ogg",
        language_hint: "ru",
      },
    });

    if (transcriptionError || !transcription?.text) {
      logger.error("Transcription failed", transcriptionError);
      if (progressMessageId) {
        await editMessageText(
          chatId,
          progressMessageId,
          "❌ Не удалось распознать речь\\. Попробуйте говорить чётче или используйте текст\\.",
        );
      }
      return false;
    }

    const transcribedText = transcription.text.trim();

    // Save transcription to database
    await supabase.from("telegram_voice_transcriptions").insert({
      user_id: profile.user_id,
      telegram_chat_id: chatId,
      telegram_file_id: voice.file_id,
      duration_seconds: voice.duration,
      transcription: transcribedText,
      detected_language: transcription.language,
      confidence: transcription.confidence,
    });

    // Update progress
    if (progressMessageId) {
      await editMessageText(
        chatId,
        progressMessageId,
        "🎤 *Текст распознан\\!*\n\n" +
          `📝 "${escapeMarkdown(transcribedText.substring(0, 100))}${transcribedText.length > 100 ? "\\.\\.\\." : ""}"\n\n` +
          "▓▓▓▓▓░░░░░ 50%\n" +
          "🎵 Подтвердите генерацию\\.\\.\\.",
      );
    }

    // Show confirmation with recognized text
    const confirmMessage =
      `🎤 *Распознанный текст:*\n\n` +
      `"${escapeMarkdown(transcribedText)}"\n\n` +
      `🎵 *Использовать как описание для генерации?*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Да, сгенерировать", callback_data: `voice_gen_confirm_${voice.file_id}` },
          { text: "✏️ Редактировать", callback_data: `voice_gen_edit_${voice.file_id}` },
        ],
        [{ text: "🎸 Инструментал", callback_data: `voice_gen_instrumental_${voice.file_id}` }],
        [{ text: "❌ Отмена", callback_data: "voice_gen_cancel" }],
      ],
    };

    if (progressMessageId) {
      await editMessageText(chatId, progressMessageId, confirmMessage, keyboard);
    } else {
      await sendMessage(chatId, confirmMessage, keyboard);
    }

    // Store transcription for later use
    await storeVoiceTranscription(userId, voice.file_id, transcribedText);

    trackMetric({
      eventType: "voice_transcribed",
      success: true,
      telegramChatId: chatId,
      responseTimeMs: Date.now() - startTime,
      metadata: {
        duration: voice.duration,
        textLength: transcribedText.length,
        language: transcription.language,
      },
    });

    return true;
  } catch (error) {
    logger.error("Error handling voice for generation", error);

    if (progressMessageId) {
      await editMessageText(chatId, progressMessageId, "❌ Произошла ошибка при обработке голосового сообщения\\.");
    } else {
      await sendMessage(chatId, "❌ Ошибка обработки голосового сообщения\\.");
    }

    trackMetric({
      eventType: "voice_transcription_failed",
      success: false,
      telegramChatId: chatId,
      errorMessage: error instanceof Error ? error.message : String(error),
      responseTimeMs: Date.now() - startTime,
    });

    return false;
  }
}

/**
 * Handle voice generation callback
 */
export async function handleVoiceGenerationCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
): Promise<boolean> {
  const { answerCallbackQuery } = await import("../telegram-api.ts");

  try {
    if (data === "voice_gen_cancel") {
      await editMessageText(chatId, messageId, "❌ Генерация отменена\\.");
      await answerCallbackQuery(queryId);
      return true;
    }

    if (data.startsWith("voice_gen_confirm_")) {
      const fileId = data.replace("voice_gen_confirm_", "");
      const transcription = await getStoredTranscription(userId, fileId);

      if (!transcription) {
        await answerCallbackQuery(queryId, "Текст не найден. Попробуйте ещё раз.");
        return true;
      }

      // Start generation with transcribed text
      await startGenerationFromVoice(chatId, userId, messageId, transcription, false);
      await answerCallbackQuery(queryId, "🎵 Генерация запущена!");
      return true;
    }

    if (data.startsWith("voice_gen_instrumental_")) {
      const fileId = data.replace("voice_gen_instrumental_", "");
      const transcription = await getStoredTranscription(userId, fileId);

      if (!transcription) {
        await answerCallbackQuery(queryId, "Текст не найден. Попробуйте ещё раз.");
        return true;
      }

      // Start instrumental generation
      await startGenerationFromVoice(chatId, userId, messageId, transcription, true);
      await answerCallbackQuery(queryId, "🎸 Генерация инструментала запущена!");
      return true;
    }

    if (data.startsWith("voice_gen_edit_")) {
      await editMessageText(
        chatId,
        messageId,
        "✏️ *Редактирование*\n\n" +
          "Отправьте исправленный текст для генерации\\.\n\n" +
          "Или используйте /cancel для отмены\\.",
      );
      await answerCallbackQuery(queryId);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error handling voice generation callback", error);
    await answerCallbackQuery(queryId, "Произошла ошибка");
    return false;
  }
}

/**
 * Start music generation from voice transcription
 */
async function startGenerationFromVoice(
  chatId: number,
  userId: number,
  messageId: number,
  prompt: string,
  instrumental: boolean,
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      await editMessageText(chatId, messageId, "❌ Профиль не найден\\.");
      return;
    }

    // Update message to show generation started
    await editMessageText(
      chatId,
      messageId,
      "🎵 *Генерация началась\\!*\n\n" +
        `📝 ${escapeMarkdown(prompt.substring(0, 100))}${prompt.length > 100 ? "\\.\\.\\." : ""}\n` +
        `🎸 Режим: ${instrumental ? "Инструментал" : "С вокалом"}\n\n` +
        "⏳ Обычно занимает 1\\-3 минуты\\.\n" +
        "🔔 Вы получите уведомление когда трек будет готов\\!",
    );

    // Mark transcription as used
    await supabase
      .from("telegram_voice_transcriptions")
      .update({ used_for_generation: true })
      .eq("telegram_chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(1);

    // Call generation function
    const { data: result, error } = await supabase.functions.invoke("suno-generate", {
      body: {
        prompt,
        userId: profile.user_id,
        instrumental,
        source: "telegram_voice",
        chatId,
        messageId,
      },
    });

    if (error) {
      logger.error("Generation error", error);
      await editMessageText(
        chatId,
        messageId,
        "❌ *Ошибка генерации*\n\n" +
          `${escapeMarkdown(error.message || "Неизвестная ошибка")}\n\n` +
          "Попробуйте ещё раз или измените описание\\.",
      );
    }

    trackMetric({
      eventType: "voice_generation_started",
      success: !error,
      telegramChatId: chatId,
      metadata: {
        instrumental,
        promptLength: prompt.length,
        taskId: result?.task_id,
      },
    });
  } catch (error) {
    logger.error("Error starting generation from voice", error);
    await editMessageText(chatId, messageId, "❌ Ошибка запуска генерации\\.");
  }
}

/**
 * Get file URL from Telegram
 */
async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_CONFIG.botToken}/getFile?file_id=${fileId}`);

    const data = await response.json();

    if (!data.ok || !data.result?.file_path) {
      return null;
    }

    return `https://api.telegram.org/file/bot${BOT_CONFIG.botToken}/${data.result.file_path}`;
  } catch (error) {
    logger.error("Error getting file URL", error);
    return null;
  }
}

/**
 * Store voice transcription for later use
 */
async function storeVoiceTranscription(userId: number, fileId: string, text: string): Promise<void> {
  try {
    // Use telegram_bot_sessions for temporary storage
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await supabase.from("telegram_bot_sessions").upsert({
      telegram_user_id: userId,
      session_type: "voice_transcription",
      mode: fileId,
      options: { text },
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    logger.error("Error storing voice transcription", error);
  }
}

/**
 * Get stored voice transcription
 */
async function getStoredTranscription(userId: number, fileId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("telegram_bot_sessions")
      .select("options")
      .eq("telegram_user_id", userId)
      .eq("session_type", "voice_transcription")
      .eq("mode", fileId)
      .single();

    return (data?.options as { text?: string })?.text || null;
  } catch {
    return null;
  }
}
