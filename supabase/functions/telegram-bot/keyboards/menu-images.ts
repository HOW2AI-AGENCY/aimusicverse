/**
 * Menu images configuration for Telegram bot
 * Images are hosted in Supabase Storage and used for visual navigation
 */

import { BOT_CONFIG } from '../config.ts';

// Base URL for Supabase storage
const STORAGE_URL = `${BOT_CONFIG.supabaseUrl}/storage/v1/object/public/project-assets/bot-menu-images`;

// Fallback images from Unsplash (reliable backup)
const FALLBACK_IMAGES = {
  mainMenu: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=800&fit=crop&q=80',
  generator: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop&q=80',
  library: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=800&fit=crop&q=80',
  projects: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=800&fit=crop&q=80',
  analysis: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop&q=80',
  settings: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop&q=80',
  cloud: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=800&fit=crop&q=80',
  profile: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&h=800&fit=crop&q=80',
  upload: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?w=800&h=800&fit=crop&q=80',
  help: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=800&fit=crop&q=80',
  shop: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800&h=800&fit=crop&q=80',
  trackDefault: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop&q=80',
  projectDefault: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop&q=80',
};

export interface MenuImage {
  url: string;
  fallback: string;
  title: string;
  description?: string;
}

// Menu images with local storage URLs and fallbacks
export const MENU_IMAGES: Record<string, MenuImage> = {
  mainMenu: {
    url: `${STORAGE_URL}/main-menu.png`,
    fallback: FALLBACK_IMAGES.mainMenu,
    title: 'MusicVerse Studio',
    description: 'Создавайте музыку с помощью AI'
  },
  generator: {
    url: `${STORAGE_URL}/generator.png`,
    fallback: FALLBACK_IMAGES.generator,
    title: 'Генератор музыки',
    description: 'Создание треков по описанию'
  },
  library: {
    url: `${STORAGE_URL}/library.png`,
    fallback: FALLBACK_IMAGES.library,
    title: 'Библиотека',
    description: 'Ваши созданные треки'
  },
  projects: {
    url: `${STORAGE_URL}/projects.png`,
    fallback: FALLBACK_IMAGES.projects,
    title: 'Проекты',
    description: 'Управление музыкальными проектами'
  },
  analysis: {
    url: `${STORAGE_URL}/analysis.png`,
    fallback: FALLBACK_IMAGES.analysis,
    title: 'Анализ аудио',
    description: 'MIDI, аккорды, BPM, распознавание'
  },
  settings: {
    url: `${STORAGE_URL}/settings.png`,
    fallback: FALLBACK_IMAGES.settings,
    title: 'Настройки',
    description: 'Управление аккаунтом'
  },
  cloud: {
    url: `${STORAGE_URL}/cloud.png`,
    fallback: FALLBACK_IMAGES.cloud,
    title: 'Облако',
    description: 'Загруженные аудио файлы'
  },
  profile: {
    url: `${STORAGE_URL}/profile.png`,
    fallback: FALLBACK_IMAGES.profile,
    title: 'Профиль',
    description: 'Статистика и баланс'
  },
  upload: {
    url: `${STORAGE_URL}/cloud.png`, // Reuse cloud image
    fallback: FALLBACK_IMAGES.upload,
    title: 'Загрузка аудио',
    description: 'Загрузите файл для обработки'
  },
  help: {
    url: `${STORAGE_URL}/main-menu.png`, // Reuse main menu
    fallback: FALLBACK_IMAGES.help,
    title: 'Справка',
    description: 'Помощь по использованию бота'
  },
  shop: {
    url: `${STORAGE_URL}/profile.png`, // Reuse profile
    fallback: FALLBACK_IMAGES.shop,
    title: 'Магазин',
    description: 'Покупка кредитов и подписок'
  },
};

// Cache for validated URLs
const validatedUrls = new Map<string, string>();

/**
 * Get menu image URL with fallback
 * Checks if storage URL is accessible, falls back to Unsplash if not
 */
export async function getMenuImage(menuKey: keyof typeof MENU_IMAGES): Promise<string> {
  const imageConfig = MENU_IMAGES[menuKey];
  if (!imageConfig) {
    return FALLBACK_IMAGES.mainMenu;
  }

  // Check cache first
  const cached = validatedUrls.get(menuKey);
  if (cached) {
    return cached;
  }

  try {
    // Try to validate the storage URL with a HEAD request
    const response = await fetch(imageConfig.url, { method: 'HEAD' });
    if (response.ok) {
      validatedUrls.set(menuKey, imageConfig.url);
      return imageConfig.url;
    }
  } catch (error) {
    console.warn(`Menu image not available in storage: ${menuKey}, using fallback`);
  }

  // Use fallback
  validatedUrls.set(menuKey, imageConfig.fallback);
  return imageConfig.fallback;
}

/**
 * Get menu image synchronously (uses fallback by default)
 * For cases where async is not possible
 */
export function getMenuImageSync(menuKey: keyof typeof MENU_IMAGES): string {
  const cached = validatedUrls.get(menuKey);
  if (cached) return cached;
  
  const imageConfig = MENU_IMAGES[menuKey];
  return imageConfig?.fallback || FALLBACK_IMAGES.mainMenu;
}

/**
 * Get fallback image for a menu
 */
export function getFallbackImage(menuKey: keyof typeof FALLBACK_IMAGES): string {
  return FALLBACK_IMAGES[menuKey] || FALLBACK_IMAGES.mainMenu;
}

/**
 * Preload all menu images (validate URLs)
 */
export async function preloadMenuImages(): Promise<void> {
  const keys = Object.keys(MENU_IMAGES) as (keyof typeof MENU_IMAGES)[];
  await Promise.all(keys.map(key => getMenuImage(key)));
}
