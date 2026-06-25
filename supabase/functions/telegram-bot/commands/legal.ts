import { sendMessage, editMessageText } from "../telegram-api.ts";
import { BOT_CONFIG } from "../config.ts";
import { buildMessage, createSection } from "../utils/message-formatter.ts";
import { ButtonBuilder } from "../utils/button-builder.ts";
import { trackMessage } from "../utils/message-manager.ts";

/**
 * Handle /terms command - show terms of service
 */
export async function handleTerms(chatId: number, messageId?: number) {
  const termsMsg = buildMessage({
    title: "Условия использования",
    emoji: "📜",
    description: "MusicVerse AI предоставляет сервис по созданию музыки с помощью искусственного интеллекта",
    sections: [
      {
        title: "Основные положения",
        content: [
          "Используйте сервис в законных целях",
          "Соблюдайте авторские права",
          "Не создавайте оскорбительный контент",
          "Вы сохраняете права на созданную музыку",
        ],
        emoji: "📋",
        style: "list",
      },
      {
        title: "Ответственность",
        content: [
          "Используйте контент на свое усмотрение",
          "Мы не несем ответственности за использование",
          'Сервис предоставляется "как есть"',
        ],
        emoji: "⚠️",
        style: "list",
      },
    ],
    footer: "Подробнее читайте в приложении",
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть полные условия",
      emoji: "📱",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=terms` },
    })
    .addRow(
      {
        text: "Конфиденциальность",
        emoji: "🔒",
        action: { type: "callback", data: "legal_privacy" },
      },
      {
        text: "О платформе",
        emoji: "ℹ️",
        action: { type: "callback", data: "about" },
      },
    )
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (messageId) {
    await editMessageText(chatId, messageId, termsMsg, keyboard);
    await trackMessage(chatId, messageId, "content", "help", { expiresIn: 300000 });
  } else {
    const result = await sendMessage(chatId, termsMsg, keyboard, "MarkdownV2");
    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "content", "help", { expiresIn: 300000 });
    }
  }
}

/**
 * Handle /privacy command - show privacy policy
 */
export async function handlePrivacy(chatId: number, messageId?: number) {
  const privacyMsg = buildMessage({
    title: "Политика конфиденциальности",
    emoji: "🔒",
    description: "Мы серьезно относимся к защите ваших данных",
    sections: [
      {
        title: "Что мы собираем",
        content: [
          "Данные из Telegram (имя, username, ID)",
          "Созданный контент (треки, плейлисты)",
          "История использования сервиса",
        ],
        emoji: "📊",
        style: "list",
      },
      {
        title: "Как мы защищаем данные",
        content: [
          "Шифрование при передаче",
          "Row Level Security",
          "Регулярные резервные копии",
          "Мониторинг безопасности",
        ],
        emoji: "🛡️",
        style: "list",
      },
      {
        title: "Ваши права",
        content: ["Доступ к данным", "Исправление информации", "Удаление аккаунта", "Экспорт данных"],
        emoji: "✅",
        style: "list",
      },
    ],
    footer: "Подробнее читайте в приложении",
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть полную политику",
      emoji: "📱",
      action: { type: "webapp", url: `${BOT_CONFIG.miniAppUrl}?startapp=privacy` },
    })
    .addRow(
      {
        text: "Условия использования",
        emoji: "📜",
        action: { type: "callback", data: "legal_terms" },
      },
      {
        text: "О платформе",
        emoji: "ℹ️",
        action: { type: "callback", data: "about" },
      },
    )
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (messageId) {
    await editMessageText(chatId, messageId, privacyMsg, keyboard);
    await trackMessage(chatId, messageId, "content", "help", { expiresIn: 300000 });
  } else {
    const result = await sendMessage(chatId, privacyMsg, keyboard, "MarkdownV2");
    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "content", "help", { expiresIn: 300000 });
    }
  }
}

/**
 * Handle /about command - show app information
 */
export async function handleAbout(chatId: number, messageId?: number) {
  const aboutMsg = buildMessage({
    title: "О MusicVerse AI",
    emoji: "ℹ️",
    sections: [
      {
        title: "Информация о платформе",
        content: ["Версия: 2.0", "Платформа: Telegram Mini App", "Разработчик: HOW2AI Agency"],
        emoji: "💻",
        style: "list",
      },
      {
        title: "Технологии",
        content: [
          "Suno AI v5 для генерации музыки",
          "React 19 + TypeScript 5",
          "Supabase для хранения данных",
          "Telegram Bot API",
        ],
        emoji: "🔧",
        style: "list",
      },
      {
        title: "Возможности",
        content: [
          "Генерация музыки по описанию",
          "Создание с аудио-референсами",
          "Разделение на стемы",
          "Библиотека и проекты",
          "Плейлисты и коллекции",
          "Сообщество и шеринг",
        ],
        emoji: "✨",
        style: "list",
      },
    ],
    footer: "Спасибо что используете наш сервис! 🎵",
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: "Открыть приложение",
      emoji: "🚀",
      action: { type: "webapp", url: BOT_CONFIG.miniAppUrl },
    })
    .addRow(
      {
        text: "Условия",
        emoji: "📜",
        action: { type: "callback", data: "legal_terms" },
      },
      {
        text: "Конфиденциальность",
        emoji: "🔒",
        action: { type: "callback", data: "legal_privacy" },
      },
    )
    .addButton({
      text: "Главное меню",
      emoji: "🏠",
      action: { type: "callback", data: "nav_main" },
    })
    .build();

  if (messageId) {
    await editMessageText(chatId, messageId, aboutMsg, keyboard);
    await trackMessage(chatId, messageId, "content", "help", { expiresIn: 300000 });
  } else {
    const result = await sendMessage(chatId, aboutMsg, keyboard, "MarkdownV2");
    if (result?.result?.message_id) {
      await trackMessage(chatId, result.result.message_id, "content", "help", { expiresIn: 300000 });
    }
  }
}
