import { BOT_CONFIG } from '../config.ts';
import { sendPhoto, sendMessage } from '../telegram-api.ts';
import { buildMessage } from '../utils/message-formatter.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';
import { trackMessage } from '../utils/message-manager.ts';
import { getMenuImage } from '../keyboards/menu-images.ts';

export async function handleHelp(chatId: number) {
  const helpImage = getMenuImage('help');
  
  const helpMessage = buildMessage({
    title: 'Справка и обучение',
    emoji: '📚',
    description: 'Полное руководство по использованию MusicVerse AI',
    sections: [
      {
        title: 'Быстрый старт',
        content: 'Создайте первый трек за 5 минут',
        emoji: '🚀'
      },
      {
        title: 'Основные команды',
        emoji: '🤖',
        content: [
          '/generate - Создать трек',
          '/analyze - Анализ аудио',
          '/library - Мои треки',
          '/projects - Проекты'
        ],
        style: 'list'
      }
    ],
    footer: 'Выберите раздел для подробной информации'
  });

  const keyboard = new ButtonBuilder()
    // Row 1: Main tutorials
    .addRow(
      {
        text: 'Быстрый старт',
        emoji: '🚀',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/help?section=quickstart` }
      },
      {
        text: 'Генерация',
        emoji: '🎵',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/help?section=generation` }
      }
    )
    // Row 2: Analysis and projects
    .addRow(
      {
        text: 'Анализ',
        emoji: '🔬',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/help?section=analysis` }
      },
      {
        text: 'Проекты',
        emoji: '📁',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/help?section=projects` }
      }
    )
    // Row 3: FAQ and tips
    .addRow(
      {
        text: 'FAQ',
        emoji: '❓',
        action: { type: 'callback', data: 'deeplink_faq' }
      },
      {
        text: 'Советы',
        emoji: '💡',
        action: { type: 'callback', data: 'deeplink_tips' }
      }
    )
    // Row 4: Blog and support
    .addRow(
      {
        text: 'Блог',
        emoji: '📝',
        action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/blog` }
      },
      {
        text: 'Поддержка',
        emoji: '💬',
        action: { type: 'url', url: 'https://t.me/MusicVerseSupport' }
      }
    )
    // Row 5: All commands
    .addButton({
      text: 'Все команды бота',
      emoji: '📋',
      action: { type: 'callback', data: 'help_commands' }
    })
    // Row 6: Back to main
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  const result = await sendPhoto(chatId, helpImage, {
    caption: helpMessage,
    replyMarkup: keyboard
  });
  
  if (result?.result?.message_id) {
    await trackMessage(chatId, result.result.message_id, 'menu', 'help', { persistent: true });
  }
}

/**
 * Show full command list
 */
export async function handleHelpCommands(chatId: number) {
  const commandsMessage = buildMessage({
    title: 'Все команды бота',
    emoji: '📋',
    sections: [
      {
        title: 'Генерация',
        emoji: '🎵',
        content: [
          '/generate <описание> - Создать трек',
          '/cover - Создать кавер (загрузите аудио)',
          '/extend - Расширить трек',
          '/status - Статус генерации'
        ],
        style: 'list'
      },
      {
        title: 'Анализ аудио',
        emoji: '🔬',
        content: [
          '/analyze - Меню анализа',
          '/midi - Конвертация в MIDI',
          '/piano - Фортепианная аранжировка',
          '/guitar - Анализ гитарной партии',
          '/recognize - Распознать музыку (Shazam)'
        ],
        style: 'list'
      },
      {
        title: 'Библиотека',
        emoji: '📚',
        content: [
          '/library - Мои треки',
          '/projects - Мои проекты',
          '/uploads - Загруженные файлы'
        ],
        style: 'list'
      },
      {
        title: 'Прочее',
        emoji: '⚙️',
        content: [
          '/app - Открыть приложение',
          '/buy - Купить кредиты',
          '/help - Эта справка',
          '/cancel - Отменить операцию'
        ],
        style: 'list'
      },
      {
        title: 'Параметры генерации',
        emoji: '🎛️',
        content: [
          '--instrumental - Без вокала',
          '--style="стиль" - Музыкальный стиль',
          '--model=v5 - Версия модели'
        ],
        style: 'list'
      }
    ],
    footer: 'Чем детальнее описание, тем лучше результат!'
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть генератор',
      emoji: '🎵',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/generate` }
    })
    .addButton({
      text: 'Назад к справке',
      emoji: '⬅️',
      action: { type: 'callback', data: 'nav_help' }
    })
    .build();

  await sendMessage(chatId, commandsMessage, keyboard, 'MarkdownV2');
}