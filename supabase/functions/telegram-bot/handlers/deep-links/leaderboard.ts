/**
 * Leaderboard deep link handler.
 */
import { sendMessage } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { BOT_CONFIG } from "../../config.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

export async function handleLeaderboardDeepLink(chatId: number, userId: number): Promise<void> {
  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть лидерборд",
      emoji: "🏆",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/leaderboard` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(
    chatId,
    "🏆 *Лидерборд MusicVerse*\n\nСоревнуйтесь с другими музыкантами\\!",
    keyboard,
    "MarkdownV2",
  );

  await trackDeepLinkAnalytics("leaderboard", "", userId);
}
