/**
 * Quick generation deep link handler.
 */
import { sendMessage } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { buildMessage } from "../../utils/message-formatter.ts";
import { BOT_CONFIG } from "../../config.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

const styleEmojis: Record<string, string> = {
  rock: "🎸",
  pop: "🎹",
  electronic: "🎧",
  hiphop: "🎤",
  jazz: "🎺",
  classical: "🎻",
  ambient: "🌙",
  lofi: "☕",
  metal: "🤘",
  rnb: "💜",
  folk: "🪕",
  country: "🤠",
};

export async function handleQuickGenDeepLink(chatId: number, userId: number, style: string): Promise<void> {
  const emoji = styleEmojis[style.toLowerCase()] || "🎵";

  const caption = buildMessage({
    title: `Быстрая генерация: ${style}`,
    emoji,
    description: "Нажмите кнопку для мгновенной генерации трека в выбранном стиле",
    sections: [
      {
        title: "Или настройте детали",
        content: "Откройте генератор для точной настройки стиля, темпа и других параметров",
        emoji: "⚙️",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Генерировать сейчас",
      emoji: "🚀",
      action: { type: "callback", data: `confirm_quick_gen_${style.toLowerCase()}` },
    })
    .addButton({
      text: "Настроить детали",
      emoji: "⚙️",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}/generate?style=${encodeURIComponent(style)}` },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  await trackDeepLinkAnalytics("quick", style, userId);
}
