import { BOT_CONFIG } from '../config.ts';
import type { InlineKeyboardButton } from '../telegram-api.ts';

export function createMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🚀 Открыть студию', web_app: { url: BOT_CONFIG.miniAppUrl + '/studio' } }],
      [
        { text: '🎼 Генератор', callback_data: 'generate' },
        { text: '📚 Библиотека', callback_data: 'library' }
      ],
      [
        { text: '📁 Проекты', callback_data: 'projects' },
        { text: '⚙️ Настройки', callback_data: 'settings' }
      ],
      [
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
        { text: '💬 Отправить в чат', callback_data: `share_chat_${trackId}` }
      ],
      [
        { text: '👥 Поделиться с друзьями', switch_inline_query: `track_${trackId}` }
      ],
      [
        { text: '🔗 Копировать ссылку', callback_data: `share_link_${trackId}` }
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
        { text: '⬇️ Скачать', callback_data: `dl_${trackId}` }
      ]
    ] as InlineKeyboardButton[][]
  };
}

export function getMainBanner(): string {
  // Use stable, reliable image hosting
  return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop&q=80';
}
