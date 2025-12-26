/**
 * Telegram Mini App Safe Area Utilities
 * Provides consistent handling of safe areas across the app
 */

/**
 * Get computed safe area insets from CSS variables
 */
export function getTelegramSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0, contentTop: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--tg-safe-area-inset-top') || '0'),
    bottom: parseInt(style.getPropertyValue('--tg-safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--tg-safe-area-inset-left') || '0'),
    right: parseInt(style.getPropertyValue('--tg-safe-area-inset-right') || '0'),
    contentTop: parseInt(style.getPropertyValue('--tg-content-safe-area-inset-top') || '0'),
  };
}

/**
 * Get CSS string for safe area padding
 */
export function getTelegramSafeAreaCSS(direction: 'top' | 'bottom' | 'left' | 'right'): string {
  const directionMap: Record<string, string> = {
    top: 'calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)))',
    bottom: 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  };
  return directionMap[direction];
}

/**
 * Get full padding-top style for Telegram header
 */
export function getTelegramHeaderPaddingTop(extraPx: number = 0): string {
  const extra = extraPx > 0 ? ` + ${extraPx}px` : '';
  return `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px)${extra}, env(safe-area-inset-top, 0px)${extra}))`;
}

/**
 * Check if a position would collide with Telegram safe area
 */
export function wouldCollideWithSafeArea(position: 'top' | 'bottom', elementRect?: DOMRect): boolean {
  if (typeof window === 'undefined') return false;
  
  const insets = getTelegramSafeAreaInsets();
  const totalTopInset = insets.top + insets.contentTop;
  
  if (position === 'top' && elementRect) {
    // If element would be positioned above the safe area
    return elementRect.top < totalTopInset + 50; // 50px buffer
  }
  
  if (position === 'bottom' && elementRect) {
    return elementRect.bottom > window.innerHeight - insets.bottom - 50;
  }
  
  return false;
}
