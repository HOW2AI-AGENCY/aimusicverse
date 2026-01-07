/**
 * Telegram Mini App Safe Area Constants
 * Unified formulas for consistent header/content positioning
 */

/**
 * Safe area CSS formulas for Telegram Mini App
 * Uses max() to pick the largest value between:
 * - Telegram-specific variables (--tg-*)
 * - Standard env() fallbacks
 */
export const TELEGRAM_SAFE_AREA = {
  /**
   * Full padding-top for headers with content below
   * Combines content + device safe areas + base padding
   */
  headerTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 0.75rem)`,

  /**
   * For sticky headers that need to account for native controls
   * Includes minimum fallback of 44px for status bar
   */
  stickyHeaderTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 0.75rem)`,

  /**
   * Minimal safe area (just the device insets, no extra padding)
   */
  minimalTop: `max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))`,

  /**
   * Bottom safe area for navigation and controls
   */
  bottom: `max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))`,

  /**
   * Bottom with content padding
   */
  bottomWithPadding: `calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 1rem)`,
} as const;

/**
 * Get safe area value with custom additional padding
 */
export function getSafeAreaTop(extraPx: number = 12): string {
  const extra = extraPx > 0 ? ` + ${extraPx}px` : '';
  return `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))${extra})`;
}

/**
 * Get safe area bottom with custom additional padding
 */
export function getSafeAreaBottom(extraPx: number = 0): string {
  const extra = extraPx > 0 ? ` + ${extraPx}px` : '';
  return `calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))${extra})`;
}
