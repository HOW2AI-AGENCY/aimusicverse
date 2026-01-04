/**
 * /news command - Show news and updates from official channel
 */

import { sendMessage, editMessageText } from '../telegram-api.ts';
import { CHANNEL_URL, CHANNEL_USERNAME } from '../config.ts';

export async function handleNews(
  chatId: number,
  messageId?: number
): Promise<void> {
  const text = `📰 *Новости и Обновления*

📢 Подписывайтесь на официальный канал:
👉 @${CHANNEL_USERNAME}

*Что вы найдёте в канале:*
• 📰 Новости и анонсы релизов
• 🎵 Лучшие треки сообщества
• 💡 Советы по генерации музыки
• 🚀 Эксклюзивные функции
• 🎓 Обучающие материалы
• 🎁 Конкурсы и розыгрыши

*Последние обновления:*
✨ Новая модель Suno AI v5
🎛️ Улучшенный Stem Studio
🎨 AI\\-генерация обложек
🎤 Улучшенная работа с текстами

Не пропустите важные новости\\!`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: `📢 Канал @${CHANNEL_USERNAME}`, url: CHANNEL_URL }
      ],
      [
        { text: '📱 Открыть приложение', url: 'https://t.me/AIMusicVerseBot/app' }
      ],
      [
        { text: '🔙 Главное меню', callback_data: 'nav_main' }
      ]
    ]
  };

  if (messageId) {
    const result = await editMessageText(chatId, messageId, text, keyboard);
    if (!result) {
      await sendMessage(chatId, text, keyboard, 'MarkdownV2');
    }
  } else {
    await sendMessage(chatId, text, keyboard, 'MarkdownV2');
  }
}
