/**
 * Channel command handler - opens the official Telegram channel
 */

import { sendMessage } from "../telegram-api.ts";
import { CHANNEL_URL, CHANNEL_USERNAME } from "../config.ts";
import { escapeMarkdownV2 } from "../utils/text-processor.ts";

export async function handleChannel(chatId: number): Promise<void> {
  const text = `📢 *Официальный канал MusicVerse*

@${CHANNEL_USERNAME}

В канале вы найдёте:
• 🎵 Примеры сгенерированных треков
• 📰 Новости и обновления платформы
• 💡 Советы по созданию музыки
• 🎁 Конкурсы и розыгрыши
• 🤝 Общение с сообществом

Подписывайтесь, чтобы не пропустить новые функции\\!`;

  const keyboard = {
    inline_keyboard: [
      [{ text: `📢 Перейти на канал @${CHANNEL_USERNAME}`, url: CHANNEL_URL }],
      [{ text: "🏠 Главное меню", callback_data: "nav_main" }],
    ],
  };

  await sendMessage(chatId, text, keyboard);
}
