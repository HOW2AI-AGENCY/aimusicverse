/**
 * Payment / credits deep link handler.
 */
import { sendMessage } from "../../telegram-api.ts";
import { ButtonBuilder } from "../../utils/button-builder.ts";
import { buildMessage } from "../../utils/message-formatter.ts";
import { BOT_CONFIG } from "../../config.ts";
import { trackDeepLinkAnalytics } from "./deep-link-analytics.ts";

export async function handlePaymentDeepLink(
  chatId: number,
  userId: number,
  type: "buy" | "credits" | "subscribe",
  productCode?: string,
): Promise<void> {
  let paymentUrl = `${BOT_CONFIG.miniAppUrl}/payment`;
  if (productCode) {
    paymentUrl += `?product=${encodeURIComponent(productCode)}`;
  } else if (type === "credits") {
    paymentUrl += "?select=popular";
  }

  const caption = buildMessage({
    title: "Пополнение кредитов",
    emoji: "💳",
    description: "Оплата банковской картой через защищённое соединение",
    sections: [
      {
        title: "Как работают кредиты",
        content: "3 кредита = 1 AI-трек • 1 кредит = разделение на стемы",
        emoji: "⚡",
      },
      {
        title: "Безопасность",
        content: "PCI DSS сертификация • 3D-Secure • Мгновенное зачисление",
        emoji: "🔒",
      },
    ],
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть магазин",
      emoji: "💳",
      action: { type: "webapp", url: paymentUrl },
    })
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  await sendMessage(chatId, caption, keyboard, "MarkdownV2");
  await trackDeepLinkAnalytics(type, productCode || "", userId);
}
