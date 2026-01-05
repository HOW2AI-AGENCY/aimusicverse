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

      // Force true centering on mobile (Sonner's internal layout can drift in Telegram)
      left: '50%',
      right: 'auto',
      transform: 'translateX(-50%)',

      // IMPORTANT: use 100% (not 100vw) to avoid Telegram/scrollbar viewport quirks
      width: 'calc(100% - 2rem)',
      maxWidth: 'min(28rem, calc(100% - 2rem))',
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
 * Z-index constants per Z_INDEX_HIERARCHY.md
 */
export const Z_INDEX = {
  base: 10,           // Regular page content
  sidebar: 40,        // Background UI elements
  navigation: 50,     // Bottom navigation bar
  floatingButton: 60, // Floating action buttons
  tooltips: 70,       // Smart hints, tooltips
  dialogs: 80,        // Modal dialogs, sheets
  fullscreen: 90,     // Major fullscreen experiences
  system: 100,        // System notifications
  critical: 110,      // Critical alerts
  dropdown: 9999,     // Temporary floating menus
} as const;

/**
 * Z-index constants for notification hierarchy
 * @deprecated Use Z_INDEX instead
 */
export const TOAST_Z_INDEX = {
  standard: Z_INDEX.navigation,
  system: Z_INDEX.system,
  critical: Z_INDEX.critical,
} as const;

/**
 * Get safe area padding styles for fullscreen overlays
 */
export function getFullscreenSafeAreaStyles() {
  return {
    paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px)), env(safe-area-inset-top, 0px))',
    paddingBottom: 'max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))',
  };
}

/**
 * Get bottom safe area with navigation offset
 */
export function getBottomSafeAreaWithNav(navHeight: string = '5rem') {
  return `calc(${navHeight} + max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))`;
}
