/**
 * Centralized date-fns utilities for better tree-shaking
 * Import from this file instead of 'date-fns' directly
 * 
 * Usage: import { formatDate, formatRelative, ru } from '@/lib/date-utils';
 */

// Core functions - only import what's commonly used
export { 
  format,
  formatDistanceToNow,
  differenceInDays,
  differenceInMinutes,
  differenceInHours,
  differenceInSeconds,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subDays,
  addDays,
  isToday,
  isYesterday,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns';

// Russian locale - commonly needed
export { ru } from 'date-fns/locale';

// Type exports
export type { Locale } from 'date-fns';

/**
 * Format date with Russian locale by default
 */
export function formatDate(date: Date | string | number, formatStr: string = 'dd.MM.yyyy'): string {
  const { format } = require('date-fns');
  const { ru } = require('date-fns/locale');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ru });
}

/**
 * Format relative time (e.g., "2 часа назад")
 */
export function formatRelative(date: Date | string | number): string {
  const { formatDistanceToNow } = require('date-fns');
  const { ru } = require('date-fns/locale');
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ru });
}

// Re-export formatDuration from shared formatters (uses formatTime internally)
export { formatTime as formatDuration } from '@/lib/formatters';
