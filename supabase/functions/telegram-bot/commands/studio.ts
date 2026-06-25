/**
 * Studio Command Handler
 * Open track in Stem Studio
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendMessage, editMessageText, sendPhoto } from "../telegram-api.ts";
import { escapeMarkdown, formatDuration } from "../utils/index.ts";
import { BOT_CONFIG } from "../config.ts";

const supabase = getSupabaseClient();

const MINI_APP_URL = BOT_CONFIG.miniAppUrl;

export async function handleStudio(chatId: number, trackId: string, messageId?: number) {
  try {
    // Fetch track with stems info and audio_url
    const { data: track, error } = await supabase
      .from("tracks")
      .select("id, title, cover_url, has_stems, duration_seconds, audio_url, status")
      .eq("id", trackId)
      .single();

    if (error || !track) {
      await sendMessage(chatId, "❌ Трек не найден");
      return;
    }

    // Check if track is generated (has audio)
    if (!track.audio_url) {
      const statusText = track.status === "processing" ? "⏳ Трек ещё генерируется..." : "❌ Трек не сгенерирован";

      const message =
        `🎨 *Stem Studio*\n\n` +
        `🎵 *${escapeMarkdown(track.title || "Трек")}*\n\n` +
        `${statusText}\n\n` +
        `Студия доступна только для сгенерированных треков.`;

      const keyboard = {
        inline_keyboard: [[{ text: "⬅️ Назад", callback_data: `track_details_${trackId}` }]],
      };

      if (messageId) {
        await editMessageText(chatId, messageId, message, keyboard);
      } else {
        await sendMessage(chatId, message, keyboard);
      }
      return;
    }

    // Check if stems exist
    const { data: stems } = await supabase.from("track_stems").select("id, stem_type").eq("track_id", trackId);

    const hasStemsAvailable = stems && stems.length > 0;

    if (!hasStemsAvailable) {
      // No stems - offer to separate
      const message =
        `🎨 *Stem Studio*\n\n` +
        `🎵 *${escapeMarkdown(track.title || "Трек")}*\n\n` +
        `⚠️ Для этого трека ещё не созданы стемы.\n\n` +
        `Стемы позволяют:\n` +
        `• Отключать/включать отдельные инструменты\n` +
        `• Создавать караоке версию\n` +
        `• Скачивать отдельные дорожки\n\n` +
        `Создать стемы?`;

      const keyboard = {
        inline_keyboard: [
          [{ text: "🎛️ Разделить на стемы", callback_data: `separate_stems_${trackId}` }],
          [
            {
              text: "▶️ Открыть базовую студию",
              web_app: { url: `${MINI_APP_URL}?startapp=studio_${trackId}` },
            },
          ],
          [{ text: "⬅️ Назад", callback_data: `track_details_${trackId}` }],
        ],
      };

      if (messageId) {
        await editMessageText(chatId, messageId, message, keyboard);
      } else {
        await sendMessage(chatId, message, keyboard);
      }
      return;
    }

    // Stems available - show studio options
    const stemTypes = stems.map((s) => s.stem_type);
    const stemList = stemTypes
      .map((type) => {
        const icons: Record<string, string> = {
          vocals: "🎤",
          backing_vocals: "🎙️",
          drums: "🥁",
          bass: "🎸",
          guitar: "🎸",
          piano: "🎹",
          keyboard: "🎹",
          strings: "🎻",
          brass: "🎺",
          woodwinds: "🎷",
          synth: "🎹",
          other: "🎵",
        };
        return `${icons[type] || "🎵"} ${type}`;
      })
      .join("\n");

    const message =
      `🎨 *Stem Studio*\n\n` +
      `🎵 *${escapeMarkdown(track.title || "Трек")}*\n` +
      `⏱️ ${formatDuration(track.duration_seconds || 0)}\n\n` +
      `*Доступные стемы:*\n${stemList}\n\n` +
      `Откройте студию для микширования:`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🎛️ Открыть Studio",
            web_app: { url: `${MINI_APP_URL}?startapp=studio_${trackId}` },
          },
        ],
        [{ text: "📥 Скачать все стемы", callback_data: `download_stems_${trackId}` }],
        [{ text: "⬅️ Назад к треку", callback_data: `track_details_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendMessage(chatId, message, keyboard);
    }
  } catch (error) {
    console.error("Error handling studio:", error);
    await sendMessage(chatId, "❌ Ошибка при открытии студии");
  }
}

export async function handleSeparateStems(chatId: number, userId: number, trackId: string, messageId?: number) {
  try {
    // Check if separation is already in progress
    const { data: existingTask } = await supabase
      .from("stem_separation_tasks")
      .select("id, status")
      .eq("track_id", trackId)
      .eq("status", "processing")
      .single();

    if (existingTask) {
      await sendMessage(chatId, "⏳ Разделение уже в процессе. Пожалуйста, подождите...");
      return;
    }

    const message =
      `🎛️ *Разделение на стемы*\n\n` +
      `Выберите режим разделения:\n\n` +
      `*Простое (2 дорожки):*\n` +
      `🎤 Вокал + 🎸 Инструментал\n\n` +
      `*Детальное (6+ дорожек):*\n` +
      `🎤 Вокал, 🥁 Ударные, 🎸 Бас, 🎹 Клавишные и др.`;

    const keyboard = {
      inline_keyboard: [
        [{ text: "🎤 Простое разделение", callback_data: `stem_mode_simple_${trackId}` }],
        [{ text: "🎛️ Детальное разделение", callback_data: `stem_mode_detailed_${trackId}` }],
        [{ text: "⬅️ Назад", callback_data: `studio_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendMessage(chatId, message, keyboard);
    }
  } catch (error) {
    console.error("Error handling separate stems:", error);
    await sendMessage(chatId, "❌ Ошибка");
  }
}

export async function handleDownloadStems(chatId: number, trackId: string, messageId?: number) {
  try {
    const { data: stems } = await supabase
      .from("track_stems")
      .select("id, stem_type, audio_url")
      .eq("track_id", trackId);

    if (!stems || stems.length === 0) {
      await sendMessage(chatId, "❌ Стемы не найдены");
      return;
    }

    const message =
      `📥 *Скачивание стемов*\n\n` + `Доступно ${stems.length} стемов.\n` + `Откройте приложение для скачивания:`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "📥 Скачать в приложении",
            web_app: { url: `${MINI_APP_URL}?startapp=download_stems_${trackId}` },
          },
        ],
        [{ text: "⬅️ Назад", callback_data: `studio_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendMessage(chatId, message, keyboard);
    }
  } catch (error) {
    console.error("Error handling download stems:", error);
    await sendMessage(chatId, "❌ Ошибка");
  }
}
