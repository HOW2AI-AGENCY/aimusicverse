/**
 * Menu images configuration for Telegram bot
 * Loads custom images from database config, falls back to Unsplash
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface MenuImage {
  url: string;
  title: string;
  description?: string;
}

// Fallback images (reliable Unsplash URLs)
const FALLBACK_IMAGES: Record<string, MenuImage> = {
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

// Cache for custom images from database
let cachedCustomImages: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load custom image URLs from database config
 */
async function loadCustomImages(): Promise<Record<string, string>> {
  // Return cached if fresh
  if (cachedCustomImages && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedCustomImages;
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('telegram_bot_config')
      .select('config_value')
      .eq('config_key', 'menu_images')
      .single();

    if (error) {
      console.log('No custom menu images configured, using fallbacks');
      cachedCustomImages = {};
    } else {
      cachedCustomImages = (data?.config_value as Record<string, string>) || {};
    }
    
    cacheTimestamp = Date.now();
    return cachedCustomImages;
  } catch (error) {
    console.error('Error loading custom images:', error);
    cachedCustomImages = {};
    return cachedCustomImages;
  }
}

/**
 * Invalidate cache (call after updates)
 */
export function invalidateImageCache() {
  cachedCustomImages = null;
  cacheTimestamp = 0;
}

/**
 * Get menu image URL (async - loads from database)
 */
export async function getMenuImageAsync(menuKey: string): Promise<string> {
  const customImages = await loadCustomImages();
  
  // Return custom image if exists
  if (customImages[menuKey]) {
    return customImages[menuKey];
  }
  
  // Return fallback
  return FALLBACK_IMAGES[menuKey]?.url || FALLBACK_IMAGES.mainMenu.url;
}

/**
 * Get menu image URL (sync - uses cache only)
 */
export function getMenuImage(menuKey: string): string {
  // Check cache first
  if (cachedCustomImages && cachedCustomImages[menuKey]) {
    return cachedCustomImages[menuKey];
  }
  
  // Return fallback
  return FALLBACK_IMAGES[menuKey]?.url || FALLBACK_IMAGES.mainMenu.url;
}

/**
 * Get menu image synchronously (same as getMenuImage)
 */
export function getMenuImageSync(menuKey: string): string {
  return getMenuImage(menuKey);
}

/**
 * Get menu image info
 */
export function getMenuImageInfo(menuKey: string): MenuImage | null {
  const fallback = FALLBACK_IMAGES[menuKey];
  if (!fallback) return null;
  
  return {
    ...fallback,
    url: getMenuImage(menuKey)
  };
}

// Export fallbacks for reference
export const MENU_IMAGES = FALLBACK_IMAGES;
