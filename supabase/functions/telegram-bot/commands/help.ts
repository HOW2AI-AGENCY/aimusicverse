import { BOT_CONFIG } from '../config.ts';
import { sendMessage } from '../telegram-api.ts';
import { buildMessage, createSection, createList, createDivider } from '../utils/message-formatter.ts';
import { ButtonBuilder } from '../utils/button-builder.ts';
import { trackMessage } from '../utils/message-manager.ts';

export async function handleHelp(chatId: number) {
  const helpMessage = buildMessage({
    title: 'Справка по командам',
    emoji: '📚',
    description: 'Полный список команд и возможностей бота',
    sections: [
      {
        title: 'Основные команды',
        emoji: '🎵',
        content: [
          '/generate <описание> - Создать трек',
          '/analyze - Анализ аудио (MIDI, аккорды, BPM)',
          '/library - Мои треки (последние 5)',
          '/projects - Мои проекты',
          '/status - Статус генерации',
          '/app - Открыть приложение'
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
          '/recognize - Распознать музыку'
        ],
        style: 'list'
      },
      {
        title: 'Загрузка аудио',
        emoji: '📤',
        content: [
          '/cover <описание> - Создать кавер',
          '/extend <описание> - Расширить трек',
          '/audio - Справка по аудио',
          '/cancel - Отменить загрузку'
        ],
        style: 'list'
      },
      {
        title: 'Параметры генерации',
        emoji: '⚙️',
        content: [
          '--instrumental - Без вокала',
          '--style="стиль" - Музыкальный стиль',
          '--model=v5 - Версия модели (v4/v5)'
        ],
        style: 'list'
      },
      {
        title: 'Примеры использования',
        emoji: '💡',
        content: [
          '/generate мелодичный поп трек о любви',
          '/generate энергичный рок с гитарой',
          '/cover --style="indie rock" мой кавер',
          '/extend --instrumental продолжение'
        ],
        style: 'list'
      }
    ],
    footer: 'Чем детальнее описание, тем лучше результат!'
  });

  const keyboard = new ButtonBuilder()
    .addButton({
      text: 'Открыть полную документацию',
      emoji: '📖',
      action: { type: 'webapp', url: `${BOT_CONFIG.miniAppUrl}/help` }
    })
    .addRow(
      {
        text: 'Попробовать генератор',
        emoji: '🎼',
        action: { type: 'callback', data: 'nav_generate' }
      },
      {
        text: 'Анализ аудио',
        emoji: '🔬',
        action: { type: 'callback', data: 'nav_analyze' }
      }
    )
    .addButton({
      text: 'Главное меню',
      emoji: '🏠',
      action: { type: 'callback', data: 'nav_main' }
    })
    .build();

  const result = await sendMessage(chatId, helpMessage, keyboard, 'MarkdownV2');
  
  if (result?.result?.message_id) {
    await trackMessage(chatId, result.result.message_id, 'content', 'help', { expiresIn: 300000 }); // 5 minutes
  }
}
