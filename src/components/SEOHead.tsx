/**
 * SEO Head component for managing page-level meta tags
 * Uses document.title and meta tags directly (no react-helmet needed for Telegram Mini App)
 */
import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: readonly string[] | string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'music.song' | 'music.album';
  canonical?: string;
  noIndex?: boolean;
}

const BASE_TITLE = 'MusicVerse';
const BASE_DESCRIPTION = 'Платформа для генерации и редактирования музыки с помощью искусственного интеллекта';

export function SEOHead({
  title,
  description = BASE_DESCRIPTION,
  keywords = [],
  ogImage,
  ogType = 'website',
  canonical,
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Set description
    setMeta('description', description);

    // Set keywords
    if (keywords.length > 0) {
      const existingKeywords = 'AI music, генерация музыки, музыкальный редактор';
      setMeta('keywords', `${existingKeywords}, ${keywords.join(', ')}`);
    }

    // OpenGraph tags
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', ogType, true);
    
    if (ogImage) {
      setMeta('og:image', ogImage, true);
    }

    // Twitter tags
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);

    // Canonical URL
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Robots meta
    if (noIndex) {
      setMeta('robots', 'noindex, nofollow');
    }

    // Cleanup on unmount - restore base title
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, description, keywords, ogImage, ogType, canonical, noIndex]);

  return null;
}

// Preset configurations for common pages
export const SEO_PRESETS = {
  home: {
    title: undefined, // Uses base title
    description: 'Создавайте уникальную музыку с помощью ИИ. Генерация, редактирование и публикация треков в один клик.',
    keywords: ['главная', 'создание музыки', 'AI генератор'],
  },
  library: {
    title: 'Моя библиотека',
    description: 'Ваша коллекция сгенерированных треков. Управление, редактирование и экспорт музыки.',
    keywords: ['библиотека', 'мои треки', 'коллекция'],
  },
  projects: {
    title: 'Проекты',
    description: 'Организуйте ваши треки в альбомы и EP. Профессиональное управление музыкальными проектами.',
    keywords: ['проекты', 'альбомы', 'EP', 'организация'],
  },
  lyricsStudio: {
    title: 'Lyrics Studio',
    description: 'Профессиональная работа с текстами песен. Заметки, референсы, анализ стиля и обогащение тегами.',
    keywords: ['lyrics', 'тексты песен', 'редактор текстов', 'референсы'],
  },
  stemStudio: {
    title: 'Stem Studio',
    description: 'Разделение трека на стемы, транскрипция в MIDI, профессиональное редактирование.',
    keywords: ['stems', 'разделение', 'MIDI', 'транскрипция'],
  },
  generate: {
    title: 'Создать музыку',
    description: 'Генерация уникальной музыки с помощью искусственного интеллекта. Задайте стиль и получите трек.',
    keywords: ['генерация', 'создание', 'AI музыка'],
  },
  community: {
    title: 'Сообщество',
    description: 'Откройте для себя публичные треки других авторов. Вдохновляйтесь и делитесь своей музыкой.',
    keywords: ['сообщество', 'публичные треки', 'открытия'],
  },
  profile: {
    title: 'Мой профиль',
    description: 'Ваш профиль музыканта. Статистика, достижения и настройки.',
    keywords: ['профиль', 'аккаунт', 'настройки'],
  },
} as const;
