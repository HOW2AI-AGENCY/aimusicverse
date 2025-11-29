import { BOT_CONFIG } from '../config.ts';
import type { InlineKeyboardButton } from '../telegram-api.ts';

export function createMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🎵 Открыть приложение', web_app: { url: BOT_CONFIG.miniAppUrl } }],
      [
        { text: '📚 Моя библиотека', callback_data: 'library' },
        { text: '📁 Проекты', callback_data: 'projects' }
      ],
      [{ text: '❓ Помощь', callback_data: 'help' }]
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
