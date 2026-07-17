/**
 * Artist deep link handler.
 */
import { getSupabaseClient } from "../../core/supabase-client.ts";
import { sendMessage, sendPhoto } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { buildMessage } from "../../utils/message-formatter.ts";
import { BOT_CONFIG } from "../../config.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

const supabase = getSupabaseClient();

export async function handleArtistDeepLink(chatId: number, userId: number, artistId: string): Promise<void> {
  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, bio, avatar_url, genre_tags, is_ai_generated")
    .eq("id", artistId)
    .single();

  if (!artist) {
    await sendMessage(chatId, "❌ Артист не найден");
    return;
  }

  const caption = buildMessage({
    title: artist.name,
    emoji: artist.is_ai_generated ? "🤖" : "👤",
    description: artist.bio || "AI Artist",
    sections: artist.genre_tags?.length
      ? [
          {
            title: "Жанры",
            content: artist.genre_tags.join(", "),
            emoji: "🎵",
          },
        ]
      : [],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть артиста",
      emoji: "👤",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/artists/${artistId}` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (artist.avatar_url) {
    await sendPhoto(chatId, artist.avatar_url, { caption, replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  }

  await trackDeepLinkAnalytics("artist", artistId, userId, true);
}
