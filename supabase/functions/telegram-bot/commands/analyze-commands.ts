/**
 * Command and navigation handlers for the /analyze command
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendMessage, editMessageText, answerCallbackQuery, escapeMarkdownV2 } from "../telegram-api.ts";
import { trackMetric, formatDuration } from "../utils/index.ts";
import { createLogger } from "../../_shared/logger.ts";
import { setAnalysisSession } from "./analyze-types.ts";

const logger = createLogger("telegram-analyze-cmd");
const supabase = getSupabaseClient();

/**
 * /analyze command - show analysis menu for uploaded audio
 */
export async function handleAnalyzeCommand(chatId: number, userId: number, args: string): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      await sendMessage(chatId, "❌ Профиль не найден. Откройте Mini App для регистрации.", undefined, null);
      return;
    }

    // Get user's uploaded reference audio
    const { data: uploads, error } = await supabase
      .from("reference_audio")
      .select("id, file_name, file_url, duration_seconds")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !uploads || uploads.length === 0) {
      await sendMessage(
        chatId,
        `🔍 Анализ аудио

У вас нет загруженных файлов для анализа.

Сначала загрузите аудио командой /upload или отправьте аудиофайл в чат.`,
        {
          inline_keyboard: [[{ text: "☁️ Загрузить аудио", callback_data: "start_upload" }]],
        },
        null,
      );
      return;
    }

    // Build keyboard with uploaded files
    const fileButtons = uploads.map((upload) => [
      {
        text: `🎵 ${upload.file_name.substring(0, 25)}${upload.file_name.length > 25 ? "..." : ""} (${formatDuration(upload.duration_seconds || 0)})`,
        callback_data: `analyze_select_${upload.id.substring(0, 20)}`,
      },
    ]);

    await sendMessage(
      chatId,
      `🔍 Анализ аудио

Выберите файл для анализа:

Доступные функции:
• 🎼 Транскрипция (MIDI, PDF, Guitar Pro)
• 🎸 Распознавание аккордов
• 🥁 Определение темпа (BPM)`,
      {
        inline_keyboard: [...fileButtons, [{ text: "☁️ Загрузить новый", callback_data: "start_upload" }]],
      },
      null,
    );

    trackMetric({
      eventType: "analyze_command",
      success: true,
      telegramChatId: chatId,
    });
  } catch (error) {
    logger.error("Error in handleAnalyzeCommand", error);
    await sendMessage(chatId, "❌ Произошла ошибка. Попробуйте позже.", undefined, null);
  }
}

/**
 * Handle file selection for analysis
 */
export async function handleAnalyzeSelect(
  chatId: number,
  userId: number,
  referenceId: string,
  messageId: number,
  callbackId: string,
): Promise<void> {
  try {
    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      await answerCallbackQuery(callbackId, "❌ Профиль не найден");
      return;
    }

    // Get reference audio
    const { data: reference } = await supabase
      .from("reference_audio")
      .select("id, file_name, file_url, duration_seconds")
      .eq("id", referenceId)
      .single();

    if (!reference) {
      await answerCallbackQuery(callbackId, "❌ Файл не найден");
      return;
    }

    // Save session
    setAnalysisSession(userId, {
      referenceId,
      audioUrl: reference.file_url,
      fileName: reference.file_name,
      userId: profile.user_id,
    });

    const fileName =
      reference.file_name.length > 30 ? reference.file_name.substring(0, 27) + "..." : reference.file_name;

    await editMessageText(
      chatId,
      messageId,
      `🔍 *Анализ:* ${escapeMarkdownV2(fileName)}

Выберите тип анализа:`,
      {
        inline_keyboard: [
          [{ text: "🎼 Транскрипция", callback_data: `analyze_transcribe_${referenceId.substring(0, 20)}` }],
          [
            { text: "🎸 Аккорды", callback_data: `analyze_chords_${referenceId.substring(0, 20)}` },
            { text: "🥁 Темп/BPM", callback_data: `analyze_beats_${referenceId.substring(0, 20)}` },
          ],
          [{ text: "📊 Полный анализ", callback_data: `analyze_full_${referenceId.substring(0, 20)}` }],
          [{ text: "🔙 К списку", callback_data: "analyze_list" }],
        ],
      },
      "MarkdownV2",
    );
    await answerCallbackQuery(callbackId);
  } catch (error) {
    logger.error("Error in handleAnalyzeSelect", error);
    await answerCallbackQuery(callbackId, "❌ Ошибка");
  }
}

/**
 * Show analysis list (same as /analyze command)
 */
export async function handleAnalyzeList(
  chatId: number,
  userId: number,
  messageId: number,
  callbackId: string,
): Promise<void> {
  await answerCallbackQuery(callbackId);

  try {
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("telegram_id", userId).single();

    if (!profile) {
      return;
    }

    const { data: uploads } = await supabase
      .from("reference_audio")
      .select("id, file_name, duration_seconds")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!uploads || uploads.length === 0) {
      await editMessageText(
        chatId,
        messageId,
        `🔍 *Анализ аудио*

У вас нет загруженных файлов\\. Используйте /upload чтобы загрузить аудио\\.`,
        {
          inline_keyboard: [[{ text: "☁️ Загрузить аудио", callback_data: "start_upload" }]],
        },
        "MarkdownV2",
      );
      return;
    }

    const fileButtons = uploads.map((upload) => [
      {
        text: `🎵 ${upload.file_name.substring(0, 25)}${upload.file_name.length > 25 ? "..." : ""} (${formatDuration(upload.duration_seconds || 0)})`,
        callback_data: `analyze_select_${upload.id.substring(0, 20)}`,
      },
    ]);

    await editMessageText(
      chatId,
      messageId,
      `🔍 *Анализ аудио*

Выберите файл для анализа:`,
      {
        inline_keyboard: [...fileButtons, [{ text: "☁️ Загрузить новый", callback_data: "start_upload" }]],
      },
      "MarkdownV2",
    );
  } catch (error) {
    logger.error("Error in handleAnalyzeList", error);
  }
}
