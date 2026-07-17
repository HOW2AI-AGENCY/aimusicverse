/**
 * Track deep link handler.
 */
import { getSupabaseClient } from "../../core/supabase-client.ts";
import { sendMessage, sendPhoto } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { buildMessage } from "../../utils/message-formatter.ts";
import { BOT_CONFIG } from "../../config.ts";
import { getMenuImage } from "../../keyboards/menu-images.ts";
import { logger } from "../../utils/index.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

const supabase = getSupabaseClient();

export async function handleTrackDeepLink(chatId: number, userId: number, trackId: string): Promise<void> {
  const { data: track } = await supabase
    .from("tracks")
    .select("id, title, style, audio_url, cover_url, duration_seconds, likes_count, play_count, user_id")
    .eq("id", trackId)
    .single();

  if (!track) {
    await sendMessage(chatId, "❌ Трек не найден или был удалён");
    return;
  }

  const { data: creator } = await supabase
    .from("profiles")
    .select("username, display_name, photo_url")
    .eq("user_id", track.user_id)
    .single();

  const creatorName = creator?.display_name || creator?.username || "Unknown";
  const duration = track.duration_seconds
    ? `${Math.floor(track.duration_seconds / 60)}:${(track.duration_seconds % 60).toString().padStart(2, "0")}`
    : "—";

  const caption = buildMessage({
    title: track.title || "Без названия",
    emoji: "🎵",
    description: track.style || "AI Generated Track",
    sections: [
      {
        title: "Информация",
        content: `👤 ${creatorName}\n⏱ ${duration} │ ❤️ ${track.likes_count || 0} │ ▶️ ${track.play_count || 0}`,
        emoji: "📊",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть трек",
      emoji: "🎵",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` },
    })
    .addRow(
      {
        text: "В студию",
        emoji: "🎛️",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/studio/${trackId}` },
      },
      {
        text: "Ремикс",
        emoji: "🔄",
        action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate?remix=${trackId}` },
      },
    )
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (track.cover_url) {
    await sendPhoto(chatId, track.cover_url, { caption, replyMarkup: keyboard });
  } else {
    const menuImage = await getMenuImage("library");
    await sendPhoto(chatId, menuImage, { caption, replyMarkup: keyboard });
  }

  await trackDeepLinkAnalytics("track", trackId, userId, true);
}
