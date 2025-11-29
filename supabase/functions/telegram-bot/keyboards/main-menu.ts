import { BOT_CONFIG } from '../config.ts';
import type { InlineKeyboardButton } from '../telegram-api.ts';

export function createMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🎵 Открыть приложение', web_app: { url: BOT_CONFIG.miniAppUrl } }],
      [
        { text: '🎼 Создать трек', callback_data: 'generate' },
        { text: '⚡ Статус', callback_data: 'status' }
      ],
      [
        { text: '📚 Библиотека', callback_data: 'library' },
        { text: '📁 Проекты', callback_data: 'projects' }
      ],
      [{ text: '❓ Помощь', callback_data: 'help' }]
    ] as InlineKeyboardButton[][]
  };
}

export function createGenerateKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🎸 Рок', callback_data: 'style_rock' }, { text: '🎹 Поп', callback_data: 'style_pop' }],
      [{ text: '🎺 Джаз', callback_data: 'style_jazz' }, { text: '🎧 Электроника', callback_data: 'style_electronic' }],
      [{ text: '🎻 Классика', callback_data: 'style_classical' }, { text: '🎤 Хип-хоп', callback_data: 'style_hiphop' }],
      [{ text: '✍️ Свой стиль', callback_data: 'custom_generate' }],
      [{ text: '⬅️ Назад', callback_data: 'main_menu' }]
    ] as InlineKeyboardButton[][]
  };
}

export function createTrackKeyboard(trackId: string) {
  return {
    inline_keyboard: [
      [{ text: '▶️ Открыть трек', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` } }],
      [{ text: '🔄 Создать еще', callback_data: 'generate' }]
    ] as InlineKeyboardButton[][]
  };
}

export function createProjectKeyboard(projectId: string) {
  return {
    inline_keyboard: [
      [{ text: '📁 Открыть проект', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=project_${projectId}` } }]
    ] as InlineKeyboardButton[][]
  };
}
