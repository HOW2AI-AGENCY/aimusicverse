/**
 * Menu images configuration for Telegram bot
 * Uses reliable Unsplash images as fallbacks
 */

import { BOT_CONFIG } from '../config.ts';

export interface MenuImage {
  url: string;
  title: string;
  description?: string;
}

// Reliable image URLs for bot menus
// Using Unsplash images that are guaranteed to work with Telegram
export const MENU_IMAGES: Record<string, MenuImage> = {
  mainMenu: {
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop&q=80',
    title: 'MusicVerse Studio',
    description: 'Создавайте музыку с помощью AI'
  },
  generator: {
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=400&fit=crop&q=80',
    title: 'Генератор музыки',
    description: 'Создание треков по описанию'
  },
  library: {
    url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=400&fit=crop&q=80',
    title: 'Библиотека',
    description: 'Ваши созданные треки'
  },
  projects: {
    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop&q=80',
    title: 'Проекты',
    description: 'Управление музыкальными проектами'
  },
  analysis: {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&q=80',
    title: 'Анализ аудио',
    description: 'MIDI, аккорды, BPM, распознавание'
  },
  settings: {
    url: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=800&h=400&fit=crop&q=80',
    title: 'Настройки',
    description: 'Управление аккаунтом'
  },
  cloud: {
    url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=400&fit=crop&q=80',
    title: 'Облако',
    description: 'Загруженные аудио файлы'
  },
  profile: {
    url: 'https://images.unsplash.com/photo-1493225255756-d9584f39cffb?w=800&h=400&fit=crop&q=80',
    title: 'Профиль',
    description: 'Статистика и баланс'
  },
  upload: {
    url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=400&fit=crop&q=80',
    title: 'Загрузка аудио',
    description: 'Загрузите файл для обработки'
  },
  help: {
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop&q=80',
    title: 'Справка',
    description: 'Помощь по использованию бота'
  },
  shop: {
    url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop&q=80',
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
