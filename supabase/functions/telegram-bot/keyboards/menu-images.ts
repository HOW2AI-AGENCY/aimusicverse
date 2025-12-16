/**
 * Menu images configuration for Telegram bot
 * Images are hosted on the app domain and used for visual navigation
 */

import { BOT_CONFIG } from '../config.ts';

// Base URL for app-hosted images
const APP_URL = BOT_CONFIG.miniAppUrl || 'https://ygmvthybdrqymfsqifmj.lovableproject.com';
const IMAGES_URL = `${APP_URL}/bot-menu-images`;

export interface MenuImage {
  url: string;
  title: string;
  description?: string;
}

// Menu images with app-hosted URLs (MusicVerse styled)
export const MENU_IMAGES: Record<string, MenuImage> = {
  mainMenu: {
    url: `${IMAGES_URL}/main-menu.png`,
    title: 'MusicVerse Studio',
    description: 'Создавайте музыку с помощью AI'
  },
  generator: {
    url: `${IMAGES_URL}/generator.png`,
    title: 'Генератор музыки',
    description: 'Создание треков по описанию'
  },
  library: {
    url: `${IMAGES_URL}/library.png`,
    title: 'Библиотека',
    description: 'Ваши созданные треки'
  },
  projects: {
    url: `${IMAGES_URL}/projects.png`,
    title: 'Проекты',
    description: 'Управление музыкальными проектами'
  },
  analysis: {
    url: `${IMAGES_URL}/analysis.png`,
    title: 'Анализ аудио',
    description: 'MIDI, аккорды, BPM, распознавание'
  },
  settings: {
    url: `${IMAGES_URL}/settings.png`,
    title: 'Настройки',
    description: 'Управление аккаунтом'
  },
  cloud: {
    url: `${IMAGES_URL}/cloud.png`,
    title: 'Облако',
    description: 'Загруженные аудио файлы'
  },
  profile: {
    url: `${IMAGES_URL}/profile.png`,
    title: 'Профиль',
    description: 'Статистика и баланс'
  },
  upload: {
    url: `${IMAGES_URL}/cloud.png`, // Reuse cloud image
    title: 'Загрузка аудио',
    description: 'Загрузите файл для обработки'
  },
  help: {
    url: `${IMAGES_URL}/main-menu.png`, // Reuse main menu
    title: 'Справка',
    description: 'Помощь по использованию бота'
  },
  shop: {
    url: `${IMAGES_URL}/shop.png`,
    title: 'Магазин',
    description: 'Покупка кредитов и подписок'
  },
};

/**
 * Get menu image URL
 */
export function getMenuImage(menuKey: keyof typeof MENU_IMAGES): string {
  const imageConfig = MENU_IMAGES[menuKey];
  return imageConfig?.url || MENU_IMAGES.mainMenu.url;
}

/**
 * Get menu image synchronously (same as getMenuImage now)
 */
export function getMenuImageSync(menuKey: keyof typeof MENU_IMAGES): string {
  return getMenuImage(menuKey);
}

/**
 * Get menu image info
 */
export function getMenuImageInfo(menuKey: keyof typeof MENU_IMAGES): MenuImage | null {
  return MENU_IMAGES[menuKey] || null;
}
