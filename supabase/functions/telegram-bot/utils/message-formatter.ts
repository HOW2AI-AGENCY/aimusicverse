/**
 * Advanced Message Formatter for Telegram Bot
 * Provides rich formatting, templates, and visual enhancements
 */

import { escapeMarkdownV2 } from '../telegram-api.ts';

// ============================================================================
// Types
// ============================================================================

export interface MessageTemplate {
  title?: string;
  description?: string;
  sections?: MessageSection[];
  footer?: string;
  emoji?: string;
}

export interface MessageSection {
  title: string;
  content: string | string[];
  emoji?: string;
  style?: 'plain' | 'list' | 'code' | 'quote';
}

export interface ProgressBar {
  current: number;
  total: number;
  width?: number;
  filledChar?: string;
  emptyChar?: string;
  showPercentage?: boolean;
}

// ============================================================================
// Core Formatting Functions
// ============================================================================

/**
 * Enhanced MarkdownV2 escaping with edge case handling
 */
export function escapeMarkdown(text: string): string {
  if (!text) return '';
  
  // Handle null bytes and control characters
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Escape backslashes first to prevent double escaping
  text = text.replace(/\\/g, '\\\\');
  
  // Escape all special MarkdownV2 characters
  text = text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
  
  return text;
}

/**
 * Safe MarkdownV2 escaping - always use this for dynamic user data
 * This is the recommended function for escaping any text that will be
 * included in MarkdownV2 formatted messages
 */
export function safeMarkdownV2(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  return escapeMarkdown(String(text));
}

/**
 * Create a formatted header with emojis and separators
 */
export function createHeader(
  text: string,
  emoji?: string,
  level: 1 | 2 | 3 = 1
): string {
  const prefix = emoji ? `${emoji} ` : '';
  const separator = level === 1 ? '\n━━━━━━━━━━━━━━━━━━' : '';
  
  if (level === 1) {
    return `${prefix}*${escapeMarkdown(text)}*${separator}`;
  } else if (level === 2) {
    return `\n${prefix}*${escapeMarkdown(text)}*`;
  } else {
    return `${prefix}_${escapeMarkdown(text)}_`;
  }
}

/**
 * Create a section with title and content
 */
export function createSection(section: MessageSection): string {
  const parts: string[] = [];
  
  // Add section title
  if (section.title) {
    const prefix = section.emoji ? `${section.emoji} ` : '▫️ ';
    parts.push(`\n${prefix}*${escapeMarkdown(section.title)}*`);
  }
  
  // Add content based on style
  if (typeof section.content === 'string') {
    parts.push(formatContent(section.content, section.style));
  } else {
    section.content.forEach(item => {
      parts.push(formatContent(item, section.style));
    });
  }
  
  return parts.join('\n');
}

/**
 * Format content based on style
 */
function formatContent(content: string, style: MessageSection['style'] = 'plain'): string {
  const escaped = escapeMarkdown(content);
  
  switch (style) {
    case 'list':
      return `  • ${escaped}`;
    case 'code':
      return `\`${escaped}\``;
    case 'quote':
      return `> ${escaped}`;
    default:
      return escaped;
  }
}

/**
 * Create a progress bar
 */
export function createProgressBar(options: ProgressBar): string {
  const {
    current,
    total,
    width = 10,
    filledChar = '█',
    emptyChar = '░',
    showPercentage = true
  } = options;
  
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = filledChar.repeat(filled) + emptyChar.repeat(empty);
  const percentText = showPercentage ? ` ${Math.round(percentage)}%` : '';
  
  return `${bar}${percentText}`;
}

/**
 * Create a formatted list with numbering or bullets
 */
export function createList(
  items: string[],
  options?: { numbered?: boolean; emoji?: string }
): string {
  const { numbered = false, emoji } = options || {};
  
  return items
    .map((item, index) => {
      const prefix = numbered
        ? `${index + 1}\\. `
        : emoji
        ? `${emoji} `
        : '• ';
      return `${prefix}${escapeMarkdown(item)}`;
    })
    .join('\n');
}

/**
 * Create a key-value pair display
 */
export function createKeyValue(
  pairs: Record<string, string | number>,
  options?: { separator?: string; align?: boolean }
): string {
  const { separator = ': ', align = false } = options || {};
  
  const entries = Object.entries(pairs);
  
  if (align) {
    const maxKeyLength = Math.max(...entries.map(([k]) => k.length));
    return entries
      .map(([key, value]) => {
        const paddedKey = key.padEnd(maxKeyLength);
        return `${escapeMarkdown(paddedKey)}${separator}${escapeMarkdown(String(value))}`;
      })
      .join('\n');
  }
  
  return entries
    .map(([key, value]) => `${escapeMarkdown(key)}${separator}${escapeMarkdown(String(value))}`)
    .join('\n');
}

/**
 * Create a formatted divider
 */
export function createDivider(
  type: 'light' | 'medium' | 'heavy' = 'medium',
  length: number = 20
): string {
  const chars = {
    light: '─',
    medium: '━',
    heavy: '═'
  };
  
  return chars[type].repeat(length);
}

/**
 * Create a status indicator with emoji
 */
export function createStatus(
  status: 'success' | 'error' | 'warning' | 'info' | 'loading',
  message: string
): string {
  const emojis = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳'
  };
  
  return `${emojis[status]} ${escapeMarkdown(message)}`;
}

/**
 * Create a badge with background
 */
export function createBadge(text: string, emoji?: string): string {
  const prefix = emoji ? `${emoji} ` : '';
  return `\`${prefix}${text}\``;
}

/**
 * Truncate text with smart ellipsis
 */
export function truncateText(
  text: string,
  maxLength: number,
  options?: { ellipsis?: string; breakWords?: boolean }
): string {
  const { ellipsis = '...', breakWords = false } = options || {};
  
  if (text.length <= maxLength) {
    return text;
  }
  
  const cutLength = maxLength - ellipsis.length;
  
  if (breakWords) {
    return text.substring(0, cutLength) + ellipsis;
  }
  
  // Find last space within limit
  const lastSpace = text.lastIndexOf(' ', cutLength);
  const cutPoint = lastSpace > cutLength / 2 ? lastSpace : cutLength;
  
  return text.substring(0, cutPoint).trim() + ellipsis;
}

/**
 * Format duration (seconds to human readable)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}с`;
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins < 60) {
    return secs > 0 ? `${mins}м ${secs}с` : `${mins}м`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  return remainingMins > 0
    ? `${hours}ч ${remainingMins}м`
    : `${hours}ч`;
}

/**
 * Format file size (bytes to human readable)
 */
export function formatFileSize(bytes: number): string {
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  });
}

// ============================================================================
// Template Builders
// ============================================================================

/**
 * Build a complete message from template
 */
export function buildMessage(template: MessageTemplate): string {
  const parts: string[] = [];
  
  // Add title
  if (template.title) {
    parts.push(createHeader(template.title, template.emoji, 1));
  }
  
  // Add description
  if (template.description) {
    parts.push(`\n${escapeMarkdown(template.description)}`);
  }
  
  // Add sections
  if (template.sections) {
    template.sections.forEach(section => {
      parts.push(createSection(section));
    });
  }
  
  // Add footer
  if (template.footer) {
    parts.push(`\n${createDivider('light')}`);
    parts.push(escapeMarkdown(template.footer));
  }
  
  return parts.join('\n');
}

/**
 * Create a welcome message
 */
export function createWelcomeMessage(username?: string): string {
  const greeting = username ? `Привет, ${username}` : 'Добро пожаловать';
  
  return buildMessage({
    title: `${greeting}!`,
    emoji: '👋',
    description: 'Создавайте профессиональную музыку с помощью AI',
    sections: [
      {
        title: 'Возможности',
        content: [
          'Генерация треков по описанию',
          'Анализ и обработка аудио',
          'Библиотека ваших композиций',
          'Управление проектами'
        ],
        emoji: '✨',
        style: 'list'
      },
      {
        title: 'Быстрый старт',
        content: 'Просто опишите желаемую музыку или выберите действие из меню ниже 👇',
        emoji: '🚀'
      }
    ]
  });
}

/**
 * Create a track info message
 */
export function createTrackInfoMessage(track: {
  title: string;
  artist?: string;
  duration?: number;
  style?: string;
  created?: Date;
}): string {
  const details: Record<string, string | number> = {};
  
  if (track.artist) details['Исполнитель'] = track.artist;
  if (track.duration) details['Длительность'] = formatDuration(track.duration);
  if (track.style) details['Стиль'] = track.style;
  if (track.created) details['Создан'] = formatRelativeTime(track.created);
  
  return buildMessage({
    title: track.title,
    emoji: '🎵',
    sections: [
      {
        title: 'Информация',
        content: createKeyValue(details),
        emoji: 'ℹ️'
      }
    ]
  });
}

/**
 * Create an error message
 */
export function createErrorMessage(
  error: string,
  suggestions?: string[]
): string {
  const sections: MessageSection[] = [
    {
      title: 'Что произошло',
      content: error,
      emoji: '❌'
    }
  ];
  
  if (suggestions && suggestions.length > 0) {
    sections.push({
      title: 'Попробуйте',
      content: suggestions,
      emoji: '💡',
      style: 'list'
    });
  }
  
  return buildMessage({
    title: 'Ошибка',
    emoji: '⚠️',
    sections
  });
}

/**
 * Create a loading message with progress
 */
export function createLoadingMessage(
  operation: string,
  progress?: ProgressBar
): string {
  const sections: MessageSection[] = [
    {
      title: operation,
      content: 'Пожалуйста, подождите...',
      emoji: '⏳'
    }
  ];
  
  if (progress) {
    sections.push({
      title: 'Прогресс',
      content: createProgressBar(progress),
      emoji: '📊'
    });
  }
  
  return buildMessage({
    sections
  });
}

/**
 * Create a success message
 */
export function createSuccessMessage(
  title: string,
  description?: string,
  details?: Record<string, string | number>
): string {
  const sections: MessageSection[] = [];
  
  if (details && Object.keys(details).length > 0) {
    sections.push({
      title: 'Детали',
      content: createKeyValue(details),
      emoji: 'ℹ️'
    });
  }
  
  return buildMessage({
    title,
    emoji: '✅',
    description,
    sections
  });
}
