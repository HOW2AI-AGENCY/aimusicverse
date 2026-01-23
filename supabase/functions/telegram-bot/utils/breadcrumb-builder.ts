/**
 * Breadcrumb Builder for Telegram Bot Navigation
 * Creates visual navigation path in messages
 */

import { escapeMarkdownV2 } from '../telegram-api.ts';

// Route configuration with labels and emojis
const ROUTE_CONFIG: Record<string, { label: string; emoji: string }> = {
  main: { label: 'Главная', emoji: '🏠' },
  library: { label: 'Библиотека', emoji: '📚' },
  projects: { label: 'Проекты', emoji: '📁' },
  generate: { label: 'Генератор', emoji: '🎼' },
  analyze: { label: 'Анализ', emoji: '🔬' },
  settings: { label: 'Настройки', emoji: '⚙️' },
  help: { label: 'Справка', emoji: '📖' },
  upload: { label: 'Загрузка', emoji: '📤' },
  midi: { label: 'MIDI', emoji: '🎹' },
  guitar: { label: 'Гитара', emoji: '🎸' },
  recognize: { label: 'Распознавание', emoji: '🔍' },
  track: { label: 'Трек', emoji: '🎵' },
  project: { label: 'Проект', emoji: '📂' },
  cover: { label: 'Кавер', emoji: '🎤' },
  extend: { label: 'Расширение', emoji: '➕' },
  buy: { label: 'Магазин', emoji: '💎' },
  profile: { label: 'Профиль', emoji: '👤' },
  stems: { label: 'Стемы', emoji: '🎚️' }
};

// Route hierarchy for breadcrumb path
const ROUTE_PARENTS: Record<string, string> = {
  track: 'library',
  project: 'projects',
  cover: 'generate',
  extend: 'generate',
  midi: 'analyze',
  guitar: 'analyze',
  recognize: 'analyze',
  stems: 'library',
  buy: 'settings',
  profile: 'settings'
};

/**
 * Get route info with fallback
 */
function getRouteInfo(route: string): { label: string; emoji: string } {
  return ROUTE_CONFIG[route] || { label: route, emoji: '📍' };
}

/**
 * Build breadcrumb path from current route
 */
export function buildBreadcrumbPath(currentRoute: string): string[] {
  const path: string[] = [currentRoute];
  let route = currentRoute;

  // Traverse up the hierarchy
  while (ROUTE_PARENTS[route]) {
    route = ROUTE_PARENTS[route];
    path.unshift(route);
  }

  // Always start from main if not already there
  if (path[0] !== 'main') {
    path.unshift('main');
  }

  return path;
}

/**
 * Create a visual breadcrumb string for messages
 */
export function createBreadcrumb(
  currentRoute: string,
  options?: {
    separator?: string;
    showEmojis?: boolean;
    compact?: boolean;
  }
): string {
  const { 
    separator = ' › ', 
    showEmojis = true,
    compact = false 
  } = options || {};

  const path = buildBreadcrumbPath(currentRoute);
  
  if (compact && path.length > 3) {
    // Show: main > ... > parent > current
    const first = path[0];
    const parent = path[path.length - 2];
    const current = path[path.length - 1];
    
    const firstInfo = getRouteInfo(first);
    const parentInfo = getRouteInfo(parent);
    const currentInfo = getRouteInfo(current);
    
    const parts = [
      showEmojis ? `${firstInfo.emoji} ${firstInfo.label}` : firstInfo.label,
      '\\.\\.\\.',
      showEmojis ? `${parentInfo.emoji} ${parentInfo.label}` : parentInfo.label,
      showEmojis ? `${currentInfo.emoji} *${currentInfo.label}*` : `*${currentInfo.label}*`
    ];
    
    return parts.join(separator);
  }

  return path.map((route, index) => {
    const info = getRouteInfo(route);
    const isLast = index === path.length - 1;
    const label = escapeMarkdownV2(info.label);
    
    if (isLast) {
      return showEmojis ? `${info.emoji} *${label}*` : `*${label}*`;
    }
    
    return showEmojis ? `${info.emoji} ${label}` : label;
  }).join(separator);
}

/**
 * Create a navigation footer with breadcrumb and home button hint
 */
export function createNavigationFooter(
  currentRoute: string,
  options?: {
    showBreadcrumb?: boolean;
    showHomeHint?: boolean;
  }
): string {
  const { 
    showBreadcrumb = true, 
    showHomeHint = true 
  } = options || {};

  const parts: string[] = [];

  if (showBreadcrumb && currentRoute !== 'main') {
    const breadcrumb = createBreadcrumb(currentRoute, { compact: true });
    parts.push(`📍 ${breadcrumb}`);
  }

  if (showHomeHint && currentRoute !== 'main') {
    parts.push('_Нажмите 🏠 для возврата в главное меню_');
  }

  return parts.join('\n');
}

/**
 * Get current location as a simple label
 */
export function getCurrentLocationLabel(route: string): string {
  const info = getRouteInfo(route);
  return `${info.emoji} ${info.label}`;
}

/**
 * Create a "You are here" indicator
 */
export function createLocationIndicator(route: string): string {
  const info = getRouteInfo(route);
  return `📍 *Вы здесь:* ${info.emoji} ${escapeMarkdownV2(info.label)}`;
}

/**
 * Append navigation context to a message
 */
export function appendNavigationContext(
  message: string,
  currentRoute: string,
  options?: {
    position?: 'top' | 'bottom';
    includeHome?: boolean;
  }
): string {
  const { position = 'top', includeHome = true } = options || {};
  
  if (currentRoute === 'main') {
    return message;
  }

  const locationIndicator = createLocationIndicator(currentRoute);
  const divider = '─'.repeat(20);

  if (position === 'top') {
    return `${locationIndicator}\n${divider}\n\n${message}`;
  } else {
    const footer = includeHome 
      ? `\n\n${divider}\n${locationIndicator}\n_🏠 Главное меню_`
      : `\n\n${divider}\n${locationIndicator}`;
    return `${message}${footer}`;
  }
}

export default {
  createBreadcrumb,
  createNavigationFooter,
  getCurrentLocationLabel,
  createLocationIndicator,
  appendNavigationContext,
  buildBreadcrumbPath
};
