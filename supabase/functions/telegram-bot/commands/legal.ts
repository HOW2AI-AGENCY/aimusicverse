import { sendMessage, editMessageText } from '../telegram-api.ts';
import { BOT_CONFIG } from '../config.ts';

/**
 * Handle /terms command - show terms of service
 */
export async function handleTerms(chatId: number, messageId?: number) {
  const message = `📜 *Условия использования*

MusicVerse AI предоставляет сервис по созданию музыки с помощью искусственного интеллекта\\.

*Основные положения:*
• Используйте сервис в законных целях
• Соблюдайте авторские права
• Не создавайте оскорбительный контент
• Вы сохраняете права на созданную музыку

📱 Подробнее читайте в приложении`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📱 Открыть полные условия',
          web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=terms` }
        }
      ],
      [
        {
          text: '🔙 Назад',
          callback_data: 'main_menu'
        }
      ]
    ]
  };

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendMessage(chatId, message, keyboard);
  }
}

/**
 * Handle /privacy command - show privacy policy
 */
export async function handlePrivacy(chatId: number, messageId?: number) {
  const message = `🔒 *Политика конфиденциальности*

Мы серьезно относимся к защите ваших данных\\.

*Что мы собираем:*
• Данные из Telegram \\(имя, username, ID\\)
• Созданный контент \\(треки, плейлисты\\)
• История использования сервиса

*Как мы защищаем данные:*
• Шифрование при передаче
• Row Level Security
• Регулярные резервные копии
• Мониторинг безопасности

*Ваши права:*
• Доступ к данным
• Исправление информации
• Удаление аккаунта
• Экспорт данных

📱 Подробнее читайте в приложении`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📱 Открыть полную политику',
          web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=privacy` }
        }
      ],
      [
        {
          text: '🔙 Назад',
          callback_data: 'main_menu'
        }
      ]
    ]
  };

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendMessage(chatId, message, keyboard);
  }
}

/**
 * Handle /about command - show app information
 */
export async function handleAbout(chatId: number, messageId?: number) {
  const message = `ℹ️ *О MusicVerse AI*

*Версия:* 2\\.0
*Платформа:* Telegram Mini App
*Разработчик:* HOW2AI Agency

*Технологии:*
• Suno AI v5 для генерации музыки
• React 19 \\+ TypeScript 5
• Supabase для хранения данных
• Telegram Bot API

*Возможности:*
🎼 Генерация музыки по описанию
🎤 Создание с аудио\\-референсами
🎛️ Разделение на стемы
📚 Библиотека и проекты
🎨 Плейлисты и коллекции
👥 Сообщество и шеринг

*Поддержка:*
📧 support@musicverse\\.ai
💬 @AIMusicVerseBot

Спасибо что используете наш сервис\\! 🎵`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📱 Открыть приложение',
          web_app: { url: BOT_CONFIG.miniAppUrl }
        }
      ],
      [
        {
          text: '📜 Условия',
          callback_data: 'legal_terms'
        },
        {
          text: '🔒 Конфиденциальность',
          callback_data: 'legal_privacy'
        }
      ],
      [
        {
          text: '🔙 Назад',
          callback_data: 'main_menu'
        }
      ]
    ]
  };

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendMessage(chatId, message, keyboard);
  }
}
