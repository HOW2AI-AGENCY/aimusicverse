/**
 * /news command - Show news and updates from official channel
 */

import { sendMessage, editMessageText } from '../telegram-api.ts';
import { escapeMarkdownV2 } from '../utils/text-processor.ts';

export async function handleNews(
  chatId: number,
  messageId?: number
): Promise<void> {
  const text = `📰 *Новости и Обновления*

📢 Подписывайтесь на официальный канал:
👉 @AIMusicVerse

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
        { text: '📢 Открыть канал', url: 'https://t.me/AIMusicVerse' },
        { text: '🔔 Подписаться', url: 'https://t.me/AIMusicVerse' }
      ],
      [
        { text: '📱 Открыть в приложении', url: 'https://t.me/AIMusicVerseBot/app' }
      ],
      [
        { text: '🔙 Главное меню', callback_data: 'main_menu' }
      ]
    ]
  };

  if (messageId) {
    const result = await editMessageText(chatId, messageId, text, keyboard);
    if (!result) {
      // If edit fails, send new message
      await sendMessage(chatId, text, keyboard, 'MarkdownV2');
    }
  } else {
    await sendMessage(chatId, text, keyboard, 'MarkdownV2');
  }
}
