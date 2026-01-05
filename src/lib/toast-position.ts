/**
 * Centralized Toast/Notification Positioning
 * Ensures consistent positioning across all notification types
 */

/**
 * Get CSS position styles for toasts
 * Mobile: bottom-center with safe area support
 * Desktop: top-center with safe area support
 */
export function getToastStyles(isMobile: boolean, telegramOffset: number = 0) {
  if (isMobile) {
    return {
      // Bottom positioning - account for nav bar (5rem) + mini-player gap + safe area
      bottom: `max(calc(var(--tg-safe-area-inset-bottom, 0px) + 7rem + ${telegramOffset}px), calc(env(safe-area-inset-bottom, 0px) + 7rem))`,
      // Symmetric left/right margins
      left: '1rem',
      right: '1rem',
      // No width calc needed - auto from left/right
      width: 'auto',
      maxWidth: 'none',
    };
  }

  return {
    // Top positioning with Telegram safe area
    top: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))',
    // Centered on desktop
    left: '50%',
    right: 'auto',
    transform: 'translateX(-50%)',
    width: 'auto',
    maxWidth: '24rem',
  };
}

/**
 * Get Tailwind classes for toast positioning
 * Use this for components that prefer className over style
 */
export function getToastClasses(isMobile: boolean): string {
  if (isMobile) {
    // Fixed bottom with symmetric margins
    return 'fixed left-4 right-4 z-50';
  }
  
  // Desktop: fixed top, centered
  return 'fixed left-1/2 -translate-x-1/2 z-50 max-w-sm w-auto';
}

/**
 * Z-index constants for notification hierarchy
 * Per Z_INDEX_HIERARCHY.md
 */
export const TOAST_Z_INDEX = {
  standard: 50,      // Regular toasts
  system: 100,       // System notifications (Sonner)
  critical: 110,     // Critical alerts
} as const;
