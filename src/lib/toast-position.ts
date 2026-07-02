/**
 * Centralized Toast/Notification Positioning
 * Ensures consistent positioning across all notification types
 *
 * Z-index tokens live in tailwind.config.ts (z-toast, z-notification) — the
 * single source of truth. Use those class names instead of importing numbers.
 * The Z_INDEX shim below is kept for inline-style consumers (where Tailwind
 * classes don't apply). Any change here MUST be mirrored in tailwind.config.ts.
 */

/**
 * Inline-style z-index shim — mirrors tailwind.config.ts theme.extend.zIndex.
 * Use Tailwind classes (z-toast, z-notification, z-max, etc.) in className;
 * use this only where you must set zIndex via the style prop.
 */
export const Z_INDEX = {
  base: 0,
  raised: 10,
  sticky: 20,
  floating: 30,
  overlay: 40,
  navigation: 50,
  player: 60,
  contextual: 70,
  dialog: 80,
  fullscreen: 90,
  system: 100,
  sheetBackdrop: 150,
  sheetContent: 151,
  dropdown: 200,
  popover: 200,
  tooltip: 250,
  toast: 300,
  notification: 300,
  max: 9999,
} as const;

/**
 * Get CSS position styles for toasts
 * Mobile: bottom-center with safe area support
 * Desktop: top-center with safe area support
 */
export function getToastStyles(isMobile: boolean, telegramOffset: number = 0) {
  // Symmetric horizontal inset that honours iOS/Android notch + Telegram safe areas.
  // Works in both LTR and RTL because left/right are mirrored equally.
  const sideInset =
    "max(1rem, env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px), var(--tg-safe-area-inset-left, 0px), var(--tg-safe-area-inset-right, 0px))";

  if (isMobile) {
    return {
      bottom: `calc(var(--bottom-stack-h, 0px) + 1rem + ${telegramOffset}px)`,
      left: sideInset,
      right: sideInset,
      width: "auto",
      transform: "none",
      ["--width" as string]: `min(28rem, calc(100vw - 2 * ${sideInset}))`,
      ["--mobile-offset" as string]: "0px",
    };
  }

  return {
    top: "max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))",
    left: "50%",
    right: "auto",
    transform: "translateX(-50%)",
    width: "auto",
    maxWidth: "24rem",
    ["--width" as string]: "24rem",
  };
}

/**
 * Get Tailwind classes for toast positioning
 * Use this for components that prefer className over style
 */
export function getToastClasses(isMobile: boolean): string {
  if (isMobile) {
    // Fixed bottom with symmetric margins
    return "fixed left-4 right-4 z-50";
  }

  // Desktop: fixed top, centered
  return "fixed left-1/2 -translate-x-1/2 z-50 max-w-sm w-auto";
}

// Z-index tokens live in tailwind.config.ts (single source of truth).
// Use the z-* Tailwind classes directly (z-toast, z-notification, z-max).
// The Z_INDEX shim at the top of this file is the only exception — it's
// for inline-style consumers where Tailwind classes don't apply.
/**
 * Get safe area padding styles for fullscreen overlays
 */
export function getFullscreenSafeAreaStyles() {
  return {
    paddingTop:
      "max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px)), env(safe-area-inset-top, 0px))",
    paddingBottom: "max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))",
  };
}

/**
 * Get bottom safe area with navigation offset
 */
export function getBottomSafeAreaWithNav(navHeight: string = "5rem") {
  return `calc(${navHeight} + max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))`;
}
