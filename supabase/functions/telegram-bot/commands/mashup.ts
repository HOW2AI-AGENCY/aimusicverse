/**
 * Mashup Command Handler
 *
 * Sprint 052-B6. Initiate a two-track mashup in the mini app from any
 * completed track owned by the user. The mashup-{trackId} deep-link
 * opens MashupDialog with trackA pre-selected; the user picks track B
 * inside the dialog.
 */

import { getSupabaseClient } from "../core/supabase-client.ts";
import { sendMessage, editMessageText } from "../telegram-api.ts";
import { escapeMarkdown } from "../utils/index.ts";
import { BOT_CONFIG } from "../config.ts";

const supabase = getSupabaseClient();

const MINI_APP_URL = BOT_CONFIG.miniAppUrl;

/**
 * Send the user a small chooser pointing to the mini app. We don't generate
 * inline — track B has to be picked by the user from their library, so we
 * hand off to MashupDialog via deep link.
 */
export async function handleMashup(chatId: number, trackId: string, messageId?: number) {
  try {
    const { data: track, error } = await supabase
      .from("tracks")
      .select("id, title, style, audio_url")
      .eq("id", trackId)
      .single();

    if (error || !track) {
      await sendMessage(chatId, "❌ Трек не найден");
      return;
    }

    if (!track.audio_url) {
      await sendMessage(chatId, "❌ Аудио ещё не готово — дождитесь завершения генерации");
      return;
    }

    const mashupMessage =
      `🎛️ *Mashup на основе трека*\n\n` +
      `🎵 *${escapeMarkdown(track.title || "Трек")}*\n` +
      `${track.style ? `🎸 ${escapeMarkdown(track.style.split(",")[0])}\n` : ""}\n` +
      `Откройте приложение, выберите второй трек и запустите mashup — результат появится в библиотеке через 1-3 минуты.`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🎛️ Открыть Mashup",
            web_app: { url: `${MINI_APP_URL}?startapp=mashup_${trackId}` },
          },
        ],
        [{ text: "⬅️ Назад", callback_data: `track_details_${trackId}` }],
      ],
    };

    if (messageId) {
      await editMessageText(chatId, messageId, mashupMessage, keyboard);
    } else {
      await sendMessage(chatId, mashupMessage, keyboard);
    }
  } catch (error) {
    console.error("Error handling mashup:", error);
    await sendMessage(chatId, "❌ Ошибка при запуске mashup");
  }
}
