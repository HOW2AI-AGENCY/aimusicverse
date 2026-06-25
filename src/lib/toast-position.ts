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
    // Symmetric gutters: position the toaster as a full-width container with
    // 16px insets, then constrain each toast via Sonner's `--width` CSS var.
    // This avoids Sonner's internal centering drifting on narrow viewports.
    return {
      bottom: `calc(var(--bottom-stack-h, 0px) + 1rem + ${telegramOffset}px)`,
      left: '1rem',
      right: '1rem',
      width: 'auto',
      transform: 'none',
      // Each toast fills the container minus its own internal margins
      ['--width' as string]: 'min(28rem, calc(100vw - 2rem))',
      ['--mobile-offset' as string]: '0px',
    };
  }

  return {
    // Top positioning with Telegram safe area
    top: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))',
    left: '50%',
    right: 'auto',
    transform: 'translateX(-50%)',
    width: 'auto',
    maxWidth: '24rem',
    ['--width' as string]: '24rem',
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
  player: 60,         // Mini player
  floatingButton: 70, // Floating action buttons
  tooltips: 80,       // Smart hints, tooltips
  dialogs: 140,       // Modal dialogs
  sheet: 150,         // Bottom sheets
  fullscreen: 160,    // Major fullscreen experiences
  dropdown: 200,      // Select, popover, dropdown menus
  system: 300,        // System notifications (toasts)
  critical: 9999,     // Critical alerts, context menus
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
