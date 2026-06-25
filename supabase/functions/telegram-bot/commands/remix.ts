/**
 * Remix Command Handler
 * Initiate track remix/extend in Telegram
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendMessage, editMessageText } from "../telegram-api.ts";
import { escapeMarkdown } from "../utils/index.ts";
import { BOT_CONFIG } from "../config.ts";

const supabase = getSupabaseClient();

const MINI_APP_URL = BOT_CONFIG.miniAppUrl;

export async function handleRemix(chatId: number, trackId: string, messageId?: number) {
  try {
    // Fetch track details
    const { data: track, error } = await supabase
      .from("tracks")
      .select("id, title, style, is_instrumental, has_vocals")
      .eq("id", trackId)
      .single();

    if (error || !track) {
      await sendMessage(chatId, "❌ Трек не найден");
      return;
    }

    const remixMessage =
      `🔄 *Создать на основе трека*\n\n` +
      `🎵 *${escapeMarkdown(track.title || "Трек")}*\n` +
      `${track.style ? `🎸 ${escapeMarkdown(track.style.split(",")[0])}\n` : ""}\n` +
      `Выберите действие:`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "⏩ Продолжить трек",
            web_app: { url: `${MINI_APP_URL}?startapp=extend_${trackId}` },
          },
        ],
        [
          {
            text: "🎨 Создать кавер",
            web_app: { url: `${MINI_APP_URL}?startapp=cover_${trackId}` },
          },
        ],
        ...(track.is_instrumental
          ? [
              [
                {
                  text: "🎤 Добавить вокал",
                  callback_data: `add_vocals_${trackId}`,
                },
              ],
            ]
          : []),
        ...(!track.is_instrumental
          ? [
              [
                {
                  text: "🎸 Добавить инструментал",
                  callback_data: `add_instrumental_${trackId}`,
                },
              ],
            ]
          : []),
        [{ text: "⬅️ Назад", callback_data: `track_details_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, remixMessage, keyboard);
    } else {
      await sendMessage(chatId, remixMessage, keyboard);
    }
  } catch (error) {
    console.error("Error handling remix:", error);
    await sendMessage(chatId, "❌ Ошибка при создании ремикса");
  }
}

export async function handleAddVocals(chatId: number, userId: number, trackId: string, messageId?: number) {
  try {
    const { data: track } = await supabase
      .from("tracks")
      .select("id, title, audio_url, suno_id")
      .eq("id", trackId)
      .single();

    if (!track?.audio_url) {
      await sendMessage(chatId, "❌ Аудио недоступно для этого трека");
      return;
    }

    const message =
      `🎤 *Добавление вокала*\n\n` +
      `🎵 *${escapeMarkdown(track.title || "Трек")}*\n\n` +
      `Для добавления вокала откройте приложение:`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🎤 Открыть в приложении",
            web_app: { url: `${MINI_APP_URL}?startapp=vocals_${trackId}` },
          },
        ],
        [{ text: "⬅️ Назад", callback_data: `remix_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendMessage(chatId, message, keyboard);
    }
  } catch (error) {
    console.error("Error handling add vocals:", error);
    await sendMessage(chatId, "❌ Ошибка");
  }
}

export async function handleAddInstrumental(chatId: number, userId: number, trackId: string, messageId?: number) {
  try {
    const { data: track } = await supabase.from("tracks").select("id, title").eq("id", trackId).single();

    if (!track) {
      await sendMessage(chatId, "❌ Трек не найден");
      return;
    }

    const message =
      `🎸 *Добавление инструментала*\n\n` +
      `🎵 *${escapeMarkdown(track.title || "Трек")}*\n\n` +
      `Для добавления инструментала откройте приложение:`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🎸 Открыть в приложении",
            web_app: { url: `${MINI_APP_URL}?startapp=instrumental_${trackId}` },
          },
        ],
        [{ text: "⬅️ Назад", callback_data: `remix_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendMessage(chatId, message, keyboard);
    }
  } catch (error) {
    console.error("Error handling add instrumental:", error);
    await sendMessage(chatId, "❌ Ошибка");
  }
}
