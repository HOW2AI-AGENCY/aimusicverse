/**
 * Achievements deep link handler.
 */
import { sendMessage } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { BOT_CONFIG } from "../../config.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

export async function handleAchievementsDeepLink(chatId: number, userId: number): Promise<void> {
  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Мои достижения",
      emoji: "🏅",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/achievements` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(chatId, "🏅 *Достижения*\n\nОткройте все достижения и получите награды\\!", keyboard, "MarkdownV2");
  await trackDeepLinkAnalytics("achievements", "", userId);
}
