/**
 * Profile deep link handler.
 */
import { getSupabaseClient } from "../../core/supabase-client.ts";
import { sendMessage, sendPhoto } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { buildMessage } from "../../utils/message-formatter.ts";
import { BOT_CONFIG } from "../../config.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

const supabase = getSupabaseClient();

export async function handleProfileDeepLink(chatId: number, userId: number, profileUserId: string): Promise<void> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, photo_url, bio, followers_count, following_count")
    .eq("user_id", profileUserId)
    .single();

  if (!profile) {
    await sendMessage(chatId, "❌ Профиль не найден");
    return;
  }

  const caption = buildMessage({
    title: profile.display_name || profile.username || "Пользователь",
    emoji: "👤",
    description: profile.bio || "",
    sections: [
      {
        title: "Статистика",
        content: `👥 ${profile.followers_count || 0} подписчиков │ ${profile.following_count || 0} подписок`,
        emoji: "📊",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть профиль",
      emoji: "👤",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/profile/${profileUserId}` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (profile.photo_url) {
    await sendPhoto(chatId, profile.photo_url, { caption, replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  }

  await trackDeepLinkAnalytics("profile", profileUserId, userId, true);
}
