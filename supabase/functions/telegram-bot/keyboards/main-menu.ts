import { BOT_CONFIG } from '../config.ts';
import type { InlineKeyboardButton } from '../telegram-api.ts';
import { getMenuImage } from './menu-images.ts';

// Channel configuration
export const CHANNEL_USERNAME = 'AIMusiicVerse';
export const CHANNEL_URL = `https://t.me/${CHANNEL_USERNAME}`;

export function createMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🚀 Открыть студию', web_app: { url: BOT_CONFIG.miniAppUrl + '/studio' } }],
      [
        { text: '🎼 Генератор', callback_data: 'generate' },
        { text: '📚 Библиотека', callback_data: 'library' }
      ],
      [
        { text: '🔬 Анализ аудио', callback_data: 'analyze' },
        { text: '📁 Проекты', callback_data: 'projects' }
      ],
      [
        { text: '📢 Канал @AIMusiicVerse', url: CHANNEL_URL }
      ],
      [
        { text: '⚙️ Настройки', callback_data: 'settings' },
        { text: 'ℹ️ О платформе', callback_data: 'help' }
      ]
    ] as InlineKeyboardButton[][]
  };
}

export function createGenerateKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🚀 Генератор в студии', web_app: { url: BOT_CONFIG.miniAppUrl + '/generate' } }],
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

export function createProjectListKeyboard(projects: Array<{ id: string; title: string }>) {
  const projectButtons = projects.slice(0, 5).map(p => ([
    { 
      text: `📁 ${(p.title || 'Проект').substring(0, 25)}`, 
      web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=project_${p.id}` } 
    }
  ]));

  return {
    inline_keyboard: [
      ...projectButtons,
      [{ text: '➕ Создать проект', callback_data: 'wizard_start_project' }],
      [{ text: '📱 В приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}/projects` } }],
      [{ text: '⬅️ Назад', callback_data: 'main_menu' }]
    ] as InlineKeyboardButton[][]
  };
}

// New functions for reactive interface
export function createPlayerControls(trackId: string, page: number, total: number) {
  const prev = page > 0 ? page - 1 : total - 1;
  const next = page < total - 1 ? page + 1 : 0;

  return {
    inline_keyboard: [
      [
        { text: '⏮️ Пред', callback_data: `lib_page_${prev}` },
        { text: '▶️ СЛУШАТЬ', callback_data: `play_${trackId}` },
        { text: '⏭️ След', callback_data: `lib_page_${next}` }
      ],
      [
        { text: '❤️ Like', callback_data: `like_${trackId}` },
        { text: '⬇️ Скачать', callback_data: `dl_${trackId}` }
      ],
      [
        { text: '📤 Поделиться', callback_data: `share_${trackId}` },
        { text: '🏠 Главное меню', callback_data: 'nav_main' }
      ]
    ] as InlineKeyboardButton[][]
  };
}

export function createProjectControls(projectId: string, page: number, total: number) {
  const prev = page > 0 ? page - 1 : total - 1;
  const next = page < total - 1 ? page + 1 : 0;

  return {
    inline_keyboard: [
      [
        { text: '⬅️ Пред', callback_data: `project_page_${prev}` },
        { text: `${page + 1}/${total}`, callback_data: 'noop' },
        { text: '➡️ След', callback_data: `project_page_${next}` }
      ],
      [
        { text: '📂 Открыть проект', web_app: { url: `${BOT_CONFIG.miniAppUrl}/projects/${projectId}` } }
      ],
      [
        { text: '🏠 Главное меню', callback_data: 'nav_main' }
      ]
    ] as InlineKeyboardButton[][]
  };
}

export function createShareMenu(trackId: string) {
  return {
    inline_keyboard: [
      [
        { text: '📤 Отправить в Telegram', switch_inline_query: `track_${trackId}` }
      ],
      [
        { text: '💬 В этот чат', switch_inline_query_current_chat: `track_${trackId}` }
      ],
      [
        { text: '📊 Статистика', callback_data: `stats_${trackId}` },
        { text: '🔗 Ссылка', callback_data: `share_link_${trackId}` }
      ],
      [
        { text: '🔙 К треку', callback_data: `track_${trackId}` }
      ]
    ] as InlineKeyboardButton[][]
  };
}

export function createTrackDetailsKeyboard(trackId: string) {
  return {
    inline_keyboard: [
      [
        { text: '🎵 Открыть в приложении', web_app: { url: `${BOT_CONFIG.miniAppUrl}?startapp=track_${trackId}` } }
      ],
      [
        { text: '📤 Поделиться', callback_data: `share_${trackId}` },
        { text: '❤️ Лайк', callback_data: `like_${trackId}` }
      ],
      [
        { text: '📊 Статистика', callback_data: `stats_${trackId}` },
        { text: '⬇️ Скачать', callback_data: `dl_${trackId}` }
      ],
      [
        { text: '🎛️ Студия', callback_data: `studio_${trackId}` },
        { text: '🔀 Ремикс', callback_data: `remix_${trackId}` }
      ]
    ] as InlineKeyboardButton[][]
  };
}

export function getMainBanner(): string {
  return getMenuImage('mainMenu');
}
