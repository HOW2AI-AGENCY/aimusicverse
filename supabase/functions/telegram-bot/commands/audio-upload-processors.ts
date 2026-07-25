/**
 * Processing helpers for audio upload generation (cover/extend/add_vocals/add_instrumental)
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { editMessageText } from "../telegram-api.ts";
import { escapeMarkdown } from "../utils/index.ts";
import { getBotMention } from "../../_shared/telegram-config.ts";

const supabase = getSupabaseClient();
const BOT_MENTION = getBotMention();

/**
 * Process generation (cover/extend) using existing reference audio URL
 */
export async function processGenerationWithReference(
  chatId: number,
  telegramUserId: number,
  supabaseUserId: string,
  messageId: number,
  action: "cover" | "extend",
  refAudio: {
    id: string;
    file_url: string;
    duration_seconds?: number | null;
    style_description?: string | null;
    genre?: string | null;
    mood?: string | null;
    transcription?: string | null;
  },
  styleFromAnalysis?: string,
): Promise<void> {
  const isExtend = action === "extend";
  const modeText = isExtend ? "расширения" : "кавера";
  const modeEmoji = isExtend ? "⏩" : "🎤";

  // Send initial progress message
  await editMessageText(
    chatId,
    messageId,
    `${modeEmoji} *Создание ${modeText}*\\n\\n▓░░░░░░░░░ 10%\\n⏳ Загружаем на сервер\\\\.\\\\.\\\\.\\n\\n🤖 _${BOT_MENTION}_`,
  );

  // Use the current messageId as the progress message ID
  const progressMessageId = messageId;

  // Build style prompt from analysis
  const stylePrompt =
    styleFromAnalysis ||
    refAudio.style_description ||
    [refAudio.genre, refAudio.mood].filter(Boolean).join(", ") ||
    "modern music";

  try {
    const endpoint = isExtend ? "suno-upload-extend" : "suno-upload-cover";

    const { data, error } = await supabase.functions.invoke(endpoint, {
      body: {
        source: "telegram_bot",
        userId: supabaseUserId,
        telegramChatId: chatId,
        telegramMessageId: progressMessageId, // Pass progress message ID for later updates
        audioUrl: refAudio.file_url,
        audioDuration: refAudio.duration_seconds,
        customMode: true,
        instrumental: false,
        style: stylePrompt,
        prompt: refAudio.transcription?.substring(0, 500) || undefined,
        model: "V5",
      },
      headers: {
        "x-telegram-bot-secret": Deno.env.get("TELEGRAM_BOT_TOKEN") || "",
      },
    });

    if (error) {
      throw new Error(error.message || "Generation failed");
    }

    if (!data?.success) {
      throw new Error(data?.error || "No task ID received");
    }

    // Update progress message with task started status
    await editMessageText(
      chatId,
      messageId,
      `${modeEmoji} *Создание ${modeText}*\\n\\n▓▓░░░░░░░░ 20%\\n🚀 Генерация запущена\\\\.\\\\.\\\\.\\n\\n⏳ Обычно 2\\\\-4 минуты\\n\\n🤖 _${BOT_MENTION}_`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await editMessageText(
      chatId,
      messageId,
      `❌ *Ошибка генерации*\\n\\n${escapeMarkdown(errorMessage)}\\n\\nПопробуйте:\\n• Проверить формат файла\\n• Использовать файл меньшего размера\\n• Попробовать позже\\n\\n🤖 _${BOT_MENTION}_`,
      {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: `audio_action_${action}` }],
          [{ text: "🏠 Меню", callback_data: "nav_main" }],
        ],
      },
    );
  }
}

/**
 * Process add vocals/instrumental generation using existing reference audio URL
 */
export async function processAddVocalsInstrumental(
  chatId: number,
  telegramUserId: number,
  supabaseUserId: string,
  messageId: number,
  action: "add_vocals" | "add_instrumental",
  refAudio: {
    id: string;
    file_url: string;
    duration_seconds?: number | null;
    style_description?: string | null;
    genre?: string | null;
    mood?: string | null;
    transcription?: string | null;
    has_vocals?: boolean | null;
    has_instrumentals?: boolean | null;
  },
): Promise<void> {
  const isAddVocals = action === "add_vocals";
  const modeText = isAddVocals ? "вокала" : "аранжировки";
  const modeEmoji = isAddVocals ? "🎤" : "🎸";

  // Send initial progress message
  await editMessageText(
    chatId,
    messageId,
    `${modeEmoji} *Добавление ${modeText}*\\n\\n▓░░░░░░░░░ 10%\\n⏳ Отправляем на обработку\\\\.\\\\.\\\\.\\n\\n🤖 _${BOT_MENTION}_`,
  );

  // Build style prompt from analysis
  const stylePrompt =
    refAudio.style_description || [refAudio.genre, refAudio.mood].filter(Boolean).join(", ") || "modern music";

  // Build default prompt based on action
  const defaultPrompt = isAddVocals
    ? "Добавить профессиональный вокал к этому инструменталу"
    : "Создать новую профессиональную аранжировку для этого вокала";

  try {
    const endpoint = isAddVocals ? "suno-add-vocals" : "suno-add-instrumental";

    const { data, error } = await supabase.functions.invoke(endpoint, {
      body: {
        source: "telegram_bot",
        audioUrl: refAudio.file_url,
        prompt: defaultPrompt,
        style: stylePrompt,
        title: "",
        negativeTags: "",
        referenceAudioId: refAudio.id,
        customMode: false,
        telegramChatId: chatId,
        telegramMessageId: messageId,
      },
      headers: {
        "x-telegram-bot-secret": Deno.env.get("TELEGRAM_BOT_TOKEN") || "",
      },
    });

    if (error) {
      throw new Error(error.message || "Generation failed");
    }

    if (!data?.success) {
      throw new Error(data?.error || "No task ID received");
    }

    // Update progress message with task started status
    await editMessageText(
      chatId,
      messageId,
      `${modeEmoji} *Добавление ${modeText}*\\n\\n▓▓░░░░░░░░ 20%\\n🚀 Генерация запущена\\\\.\\\\.\\\\.\\n\\n⏳ Обычно 2\\\\-4 минуты\\n\\n🤖 _${BOT_MENTION}_`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await editMessageText(
      chatId,
      messageId,
      `❌ *Ошибка генерации*\\n\\n${escapeMarkdown(errorMessage)}\\n\\nПопробуйте:\\n• Проверить формат файла\\n• Использовать файл меньшего размера\\n• Попробовать позже\\n\\n🤖 _${BOT_MENTION}_`,
      {
        inline_keyboard: [
          [{ text: "🔄 Попробовать снова", callback_data: `audio_action_${action}` }],
          [{ text: "🏠 Меню", callback_data: "nav_main" }],
        ],
      },
    );
  }
}
