/**
 * Centralized date utilities using dayjs for smaller bundle size
 * Import from this file instead of 'dayjs' or 'date-fns' directly
 * 
 * Migration: date-fns (~40KB) → dayjs (~2KB + plugins ~5KB)
 * 
 * Usage: import { formatDate, formatRelative, dayjs } from '@/lib/date-utils';
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isTodayPlugin from 'dayjs/plugin/isToday';
import isYesterdayPlugin from 'dayjs/plugin/isYesterday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/ru';

// Configure plugins
dayjs.extend(relativeTime);
dayjs.extend(isTodayPlugin);
dayjs.extend(isYesterdayPlugin);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(duration);

// Set Russian locale as default
dayjs.locale('ru');

// Export dayjs instance for advanced usage
export { dayjs };

// Re-export locale for compatibility
export const ru = 'ru';

// ============================================
// date-fns compatible API
// ============================================

/**
 * Format date with Russian locale by default
 * Compatible with date-fns format strings (common patterns)
 */
export function format(
  date: Date | string | number,
  formatStr: string = 'DD.MM.YYYY',
  options?: { locale?: string }
): string {
  // Convert date-fns format tokens to dayjs
  const dayjsFormat = convertDateFnsFormat(formatStr);
  return dayjs(date).locale(options?.locale || 'ru').format(dayjsFormat);
}

/**
 * Format relative time (e.g., "2 часа назад")
 */
export function formatDistanceToNow(
  date: Date | string | number,
  options?: { addSuffix?: boolean; locale?: string }
): string {
  const d = dayjs(date);
  const locale = options?.locale || 'ru';
  
  if (options?.addSuffix !== false) {
    return d.locale(locale).fromNow();
  }
  return d.locale(locale).fromNow(true);
}

/**
 * Format date with Russian locale (helper)
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = 'DD.MM.YYYY'
): string {
  return format(date, formatStr, { locale: 'ru' });
}

/**
 * Format relative time with Russian locale (helper)
 */
export function formatRelative(date: Date | string | number): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: 'ru' });
}

// ============================================
// Difference functions
// ============================================

export function differenceInDays(
  dateLeft: Date | string | number,
  dateRight: Date | string | number
): number {
  return dayjs(dateLeft).diff(dayjs(dateRight), 'day');
}

export function differenceInMinutes(
  dateLeft: Date | string | number,
  dateRight: Date | string | number
): number {
  return dayjs(dateLeft).diff(dayjs(dateRight), 'minute');
}

export function differenceInHours(
  dateLeft: Date | string | number,
  dateRight: Date | string | number
): number {
  return dayjs(dateLeft).diff(dayjs(dateRight), 'hour');
}

export function differenceInSeconds(
  dateLeft: Date | string | number,
  dateRight: Date | string | number
): number {
  return dayjs(dateLeft).diff(dayjs(dateRight), 'second');
}

// ============================================
// Date manipulation
// ============================================

export function subDays(date: Date | string | number, amount: number): Date {
  return dayjs(date).subtract(amount, 'day').toDate();
}

export function addDays(date: Date | string | number, amount: number): Date {
  return dayjs(date).add(amount, 'day').toDate();
}

export function addMonths(date: Date | string | number, amount: number): Date {
  return dayjs(date).add(amount, 'month').toDate();
}

export function startOfDay(date: Date | string | number): Date {
  return dayjs(date).startOf('day').toDate();
}

export function endOfDay(date: Date | string | number): Date {
  return dayjs(date).endOf('day').toDate();
}

export function startOfWeek(
  date: Date | string | number,
  options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
): Date {
  // dayjs isoWeek starts on Monday (1), regular week starts on Sunday (0)
  if (options?.weekStartsOn === 1) {
    return dayjs(date).startOf('isoWeek').toDate();
  }
  return dayjs(date).startOf('week').toDate();
}

export function endOfWeek(
  date: Date | string | number,
  options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
): Date {
  if (options?.weekStartsOn === 1) {
    return dayjs(date).endOf('isoWeek').toDate();
  }
  return dayjs(date).endOf('week').toDate();
}

// ============================================
// Comparison & Parsing
// ============================================

export function isToday(date: Date | string | number): boolean {
  return dayjs(date).isToday();
}

export function isYesterday(date: Date | string | number): boolean {
  return dayjs(date).isYesterday();
}

export function isBefore(
  date: Date | string | number,
  dateToCompare: Date | string | number
): boolean {
  return dayjs(date).isBefore(dayjs(dateToCompare));
}

export function isAfter(
  date: Date | string | number,
  dateToCompare: Date | string | number
): boolean {
  return dayjs(date).isAfter(dayjs(dateToCompare));
}

export function parseISO(dateString: string): Date {
  return dayjs(dateString).toDate();
}

// ============================================
// Format conversion helper
// ============================================

/**
 * Convert common date-fns format tokens to dayjs
 * Not exhaustive but covers common patterns used in this project
 */
function convertDateFnsFormat(formatStr: string): string {
  return formatStr
    // Year
    .replace(/yyyy/g, 'YYYY')
    .replace(/yy/g, 'YY')
    // Month
    .replace(/MMMM/g, 'MMMM')
    .replace(/MMM/g, 'MMM')
    .replace(/MM/g, 'MM')
    .replace(/M(?![a-zA-Z])/g, 'M')
    // Day
    .replace(/dd/g, 'DD')
    .replace(/d(?![a-zA-Z])/g, 'D')
    // Hour
    .replace(/HH/g, 'HH')
    .replace(/H(?![a-zA-Z])/g, 'H')
    .replace(/hh/g, 'hh')
    .replace(/h(?![a-zA-Z])/g, 'h')
    // Minute
    .replace(/mm/g, 'mm')
    .replace(/m(?![a-zA-Z])/g, 'm')
    // Second
    .replace(/ss/g, 'ss')
    .replace(/s(?![a-zA-Z])/g, 's')
    // AM/PM
    .replace(/a/g, 'a')
    .replace(/A/g, 'A');
}

// Re-export formatDuration from shared formatters (uses formatTime internally)
export { formatTime as formatDuration } from '@/lib/formatters';

// Type compatibility
export type Locale = string;
