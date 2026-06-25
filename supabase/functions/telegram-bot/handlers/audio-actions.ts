/**
 * Audio Actions Handler
 * Handles advanced audio processing actions:
 * - Cover creation
 * - Track extension
 * - Add vocals
 * - Add instrumental
 * - Stem separation
 * - MIDI export
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { BOT_CONFIG } from "../config.ts";
import { sendMessage, answerCallbackQuery, editMessageText, deleteMessage } from "../telegram-api.ts";
import { escapeMarkdown } from "../utils/index.ts";
import { logBotAction } from "../utils/bot-logger.ts";
import { consumePendingAudio } from "../core/db-session-store.ts";
import { createLogger } from "../../_shared/logger.ts";

const logger = createLogger("audio-actions");

const supabase = getSupabaseClient();

const TELEGRAM_API = `https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}`;

interface AudioActionContext {
  chatId: number;
  userId: number;
  messageId?: number;
  queryId: string;
  fileId?: string;
  referenceId?: string;
}

/**
 * Handle audio action callbacks
 */
export async function handleAudioActionCallback(
  data: string,
  chatId: number,
  userId: number,
  messageId: number,
  queryId: string,
): Promise<boolean> {
  if (!data.startsWith("audio_action_")) {
    return false;
  }

  const action = data.replace("audio_action_", "");
  const context: AudioActionContext = { chatId, userId, messageId, queryId };

  try {
    // Get pending audio file
    const pendingAudio = await consumePendingAudio(userId);
    if (pendingAudio?.fileId) {
      context.fileId = pendingAudio.fileId;
    }

    switch (action) {
      case "cover":
        return await handleCoverAction(context);
      case "extend":
        return await handleExtendAction(context);
      case "add_vocals":
        return await handleAddVocalsAction(context);
      case "add_instrumental":
        return await handleAddInstrumentalAction(context);
      case "stems":
        return await handleStemsAction(context);
      case "midi":
        return await handleMidiAction(context);
      case "show_lyrics":
        return await handleShowLyricsAction(context);
      case "edit_style":
        return await handleEditStyleAction(context);
      default:
        return false;
    }
  } catch (error) {
    logger.error("Error handling audio action:", error);
    await answerCallbackQuery(queryId, "❌ Ошибка");
    return true;
  }
}

/**
 * Create cover from uploaded audio
 */
async function handleCoverAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId, "🎤 Подготовка к созданию кавера...");

  if (!ctx.fileId) {
    await sendMessage(ctx.chatId, "❌ Аудиофайл не найден\\. Отправьте его снова\\.");
    return true;
  }

  // Get user profile
  const profile = await getUserProfile(ctx.userId);
  if (!profile) {
    await sendMessage(ctx.chatId, "❌ Профиль не найден\\.");
    return true;
  }

  // Show progress
  await editMessageText(
    ctx.chatId,
    ctx.messageId!,
    `🎤 *Создание кавера*\n\n⏳ Загружаю файл и отправляю на генерацию\\.\\.\\.\n\n_Это может занять 2\\-4 минуты_`,
  );

  try {
    // Download file from Telegram
    const fileUrl = await getFileUrl(ctx.fileId);
    if (!fileUrl) {
      await sendMessage(ctx.chatId, "❌ Не удалось получить файл\\.");
      return true;
    }

    // Download and convert to base64
    const audioData = await downloadAsBase64(fileUrl);

    // Call cover generation
    const { data, error } = await supabase.functions.invoke("suno-upload-cover", {
      body: {
        userId: profile.user_id,
        audioData,
        source: "telegram",
        chatId: ctx.chatId,
      },
    });

    if (error) throw error;

    await sendMessage(
      ctx.chatId,
      `✅ *Генерация кавера началась\\!*\n\n⏳ Обычно занимает 2\\-4 минуты\n🔔 Вы получите уведомление когда трек будет готов\n\n🆔 Задача: \`${escapeMarkdown(data?.taskId || "N/A")}\``,
      {
        inline_keyboard: [[{ text: "📱 Открыть в приложении", web_app: { url: BOT_CONFIG.miniAppUrl } }]],
      },
    );

    await logBotAction(ctx.userId, ctx.chatId, "cover_generation_started", { taskId: data?.taskId });
  } catch (error) {
    logger.error("Cover action error:", error);
    await sendMessage(
      ctx.chatId,
      `❌ Ошибка при создании кавера\\.\n\n${escapeMarkdown(error instanceof Error ? error.message : "Попробуйте позже")}`,
    );
  }

  return true;
}

/**
 * Extend track
 */
async function handleExtendAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId, "➕ Подготовка к расширению...");

  if (!ctx.fileId) {
    await sendMessage(ctx.chatId, "❌ Аудиофайл не найден\\. Отправьте его снова\\.");
    return true;
  }

  const profile = await getUserProfile(ctx.userId);
  if (!profile) {
    await sendMessage(ctx.chatId, "❌ Профиль не найден\\.");
    return true;
  }

  await editMessageText(
    ctx.chatId,
    ctx.messageId!,
    `➕ *Расширение трека*\n\n⏳ Загружаю файл и отправляю на генерацию\\.\\.\\.\n\n_Это может занять 2\\-4 минуты_`,
  );

  try {
    const fileUrl = await getFileUrl(ctx.fileId);
    if (!fileUrl) {
      await sendMessage(ctx.chatId, "❌ Не удалось получить файл\\.");
      return true;
    }

    const audioData = await downloadAsBase64(fileUrl);

    const { data, error } = await supabase.functions.invoke("suno-upload-extend", {
      body: {
        userId: profile.user_id,
        audioData,
        source: "telegram",
        chatId: ctx.chatId,
      },
    });

    if (error) throw error;

    await sendMessage(
      ctx.chatId,
      `✅ *Расширение трека началось\\!*\n\n⏳ Обычно занимает 2\\-4 минуты\n🔔 Вы получите уведомление когда трек будет готов\n\n🆔 Задача: \`${escapeMarkdown(data?.taskId || "N/A")}\``,
      {
        inline_keyboard: [[{ text: "📱 Открыть в приложении", web_app: { url: BOT_CONFIG.miniAppUrl } }]],
      },
    );

    await logBotAction(ctx.userId, ctx.chatId, "extend_generation_started", { taskId: data?.taskId });
  } catch (error) {
    logger.error("Extend action error:", error);
    await sendMessage(
      ctx.chatId,
      `❌ Ошибка при расширении трека\\.\n\n${escapeMarkdown(error instanceof Error ? error.message : "Попробуйте позже")}`,
    );
  }

  return true;
}

/**
 * Add vocals to instrumental
 */
async function handleAddVocalsAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId, "🎤 Добавление вокала...");

  // Show style input prompt
  await sendMessage(
    ctx.chatId,
    `🎤 *Добавление вокала*\n\n📝 Опишите желаемый стиль вокала:\n\n_Например: "мужской голос, мягкий тенор, лирический стиль" или "женский вокал, мощный, R&B"_`,
    {
      inline_keyboard: [
        [{ text: "🎵 Авто-стиль", callback_data: "vocals_auto_style" }],
        [{ text: "❌ Отмена", callback_data: "nav_main" }],
      ],
    },
  );

  // Set waiting for style input
  await setWaitingForInput(ctx.userId, "vocals_style", ctx.fileId);

  await logBotAction(ctx.userId, ctx.chatId, "add_vocals_started");

  return true;
}

/**
 * Add instrumental to vocals
 */
async function handleAddInstrumentalAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId, "🎸 Новая аранжировка...");

  await sendMessage(
    ctx.chatId,
    `🎸 *Новая аранжировка*\n\n📝 Опишите желаемый стиль аранжировки:\n\n_Например: "acoustic guitar, soft drums, piano ballad" или "electronic, synth bass, EDM drops"_`,
    {
      inline_keyboard: [
        [{ text: "🎵 Авто-стиль", callback_data: "instrumental_auto_style" }],
        [{ text: "❌ Отмена", callback_data: "nav_main" }],
      ],
    },
  );

  await setWaitingForInput(ctx.userId, "instrumental_style", ctx.fileId);

  await logBotAction(ctx.userId, ctx.chatId, "add_instrumental_started");

  return true;
}

/**
 * Separate audio into stems
 */
async function handleStemsAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId, "🎛️ Разделение на стемы...");

  if (!ctx.fileId) {
    await sendMessage(ctx.chatId, "❌ Аудиофайл не найден\\.");
    return true;
  }

  const profile = await getUserProfile(ctx.userId);
  if (!profile) {
    await sendMessage(ctx.chatId, "❌ Профиль не найден\\.");
    return true;
  }

  await editMessageText(
    ctx.chatId,
    ctx.messageId!,
    `🎛️ *Разделение на стемы*\n\n⏳ Обрабатываю аудио\\.\\.\\.\n\n_Разделяю на: vocals, drums, bass, other_`,
  );

  try {
    const fileUrl = await getFileUrl(ctx.fileId);
    if (!fileUrl) {
      await sendMessage(ctx.chatId, "❌ Не удалось получить файл\\.");
      return true;
    }

    const { data, error } = await supabase.functions.invoke("stem-separation", {
      body: {
        audioUrl: fileUrl,
        userId: profile.user_id,
        mode: "htdemucs",
        source: "telegram",
      },
    });

    if (error) throw error;

    await sendMessage(
      ctx.chatId,
      `✅ *Разделение на стемы запущено\\!*\n\n⏳ Обычно занимает 3\\-5 минут\n🔔 Вы получите уведомление с файлами\n\n🆔 Задача: \`${escapeMarkdown(data?.taskId || "N/A")}\``,
      {
        inline_keyboard: [
          [{ text: "📱 Открыть в приложении", web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=cloud` } }],
        ],
      },
    );

    await logBotAction(ctx.userId, ctx.chatId, "stems_started", { taskId: data?.taskId });
  } catch (error) {
    logger.error("Stems action error:", error);
    await sendMessage(
      ctx.chatId,
      `❌ Ошибка при разделении на стемы\\.\n\n${escapeMarkdown(error instanceof Error ? error.message : "Попробуйте позже")}`,
    );
  }

  return true;
}

/**
 * Export to MIDI
 */
async function handleMidiAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId, "🎹 Экспорт в MIDI...");

  if (!ctx.fileId) {
    await sendMessage(ctx.chatId, "❌ Аудиофайл не найден\\.");
    return true;
  }

  const profile = await getUserProfile(ctx.userId);
  if (!profile) {
    await sendMessage(ctx.chatId, "❌ Профиль не найден\\.");
    return true;
  }

  await editMessageText(
    ctx.chatId,
    ctx.messageId!,
    `🎹 *Экспорт в MIDI*\n\n⏳ Анализирую ноты и ритм\\.\\.\\.\n\n_Создаю MIDI файл_`,
  );

  try {
    const fileUrl = await getFileUrl(ctx.fileId);
    if (!fileUrl) {
      await sendMessage(ctx.chatId, "❌ Не удалось получить файл\\.");
      return true;
    }

    const { data, error } = await supabase.functions.invoke("klangio-transcribe", {
      body: {
        audioUrl: fileUrl,
        userId: profile.user_id,
        mode: "full",
        outputs: ["midi", "musicxml"],
      },
    });

    if (error) throw error;

    await sendMessage(
      ctx.chatId,
      `✅ *Транскрипция в MIDI запущена\\!*\n\n⏳ Обычно занимает 2\\-3 минуты\n🔔 Вы получите MIDI и MusicXML файлы\n\n🆔 Задача: \`${escapeMarkdown(data?.jobId || "N/A")}\``,
      {
        inline_keyboard: [
          [{ text: "📱 Открыть в приложении", web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=cloud` } }],
        ],
      },
    );

    await logBotAction(ctx.userId, ctx.chatId, "midi_export_started", { jobId: data?.jobId });
  } catch (error) {
    logger.error("MIDI action error:", error);
    await sendMessage(
      ctx.chatId,
      `❌ Ошибка при экспорте в MIDI\\.\n\n${escapeMarkdown(error instanceof Error ? error.message : "Попробуйте позже")}`,
    );
  }

  return true;
}

/**
 * Show full lyrics
 */
async function handleShowLyricsAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId);

  // Get analysis data with lyrics
  const pendingAudio = await consumePendingAudio(ctx.userId);
  const lyrics = pendingAudio?.analysisResult?.lyrics;

  if (!lyrics) {
    await sendMessage(ctx.chatId, "❌ Текст не найден\\.");
    return true;
  }

  // Split into chunks if too long
  const maxLength = 4000;
  const chunks = [];
  for (let i = 0; i < lyrics.length; i += maxLength) {
    chunks.push(lyrics.substring(i, i + maxLength));
  }

  for (let i = 0; i < chunks.length; i++) {
    const header = chunks.length > 1 ? `📝 *Текст \\(${i + 1}/${chunks.length}\\)*\n\n` : `📝 *Полный текст*\n\n`;
    await sendMessage(ctx.chatId, `${header}_${escapeMarkdown(chunks[i])}_`);
  }

  return true;
}

/**
 * Edit style description
 */
async function handleEditStyleAction(ctx: AudioActionContext): Promise<boolean> {
  await answerCallbackQuery(ctx.queryId);

  await sendMessage(
    ctx.chatId,
    `✏️ *Редактирование стиля*\n\n📝 Отправьте новое описание стиля:\n\n_Например: "Energetic pop with electronic elements and catchy melody"_`,
    {
      inline_keyboard: [[{ text: "❌ Отмена", callback_data: "nav_main" }]],
    },
  );

  await setWaitingForInput(ctx.userId, "edit_style", ctx.fileId);

  return true;
}

// Helper functions

async function getUserProfile(telegramId: number) {
  const { data } = await supabase.from("profiles").select("user_id").eq("telegram_id", telegramId).single();
  return data;
}

async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const response = await fetch(`${TELEGRAM_API}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });

    const result = await response.json();
    if (result.ok && result.result?.file_path) {
      return `https://api.telegram.org/file/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/${result.result.file_path}`;
    }
  } catch (e) {
    logger.error("getFileUrl error:", e);
  }
  return null;
}

async function downloadAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const mimeType = blob.type || "audio/mpeg";
  return `data:${mimeType};base64,${base64}`;
}

async function setWaitingForInput(userId: number, inputType: string, fileId?: string): Promise<void> {
  await supabase.from("telegram_bot_sessions").upsert(
    {
      telegram_user_id: userId,
      session_type: "waiting_input",
      session_data: { inputType, fileId },
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    },
    {
      onConflict: "telegram_user_id,session_type",
    },
  );
}
