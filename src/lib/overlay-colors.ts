/**
 * Theme-aware overlay color utilities
 * Feature: 032-professional-ui (P2 Theming)
 *
 * Replaces hardcoded bg-black/X and bg-white/X with theme-aware alternatives
 * that properly adapt to light/dark mode.
 */

import { cn } from "@/lib/utils";

/**
 * Backdrop overlay styles (for modals, sheets, dialogs)
 * Uses CSS variables that adapt to theme
 */
export const backdrop = {
  /** Light backdrop (40% opacity) */
  light: "bg-background/40 dark:bg-black/40",
  /** Medium backdrop (50% opacity) - default for modals */
  medium: "bg-background/50 dark:bg-black/50",
  /** Heavy backdrop (60% opacity) */
  heavy: "bg-background/60 dark:bg-black/60",
  /** Dark backdrop (80% opacity) - for drawers */
  dark: "bg-background/80 dark:bg-black/80",
  /** Unified sheet/dialog backdrop (Sprint 047) — 70% + blur, theme-aware */
  sheet: "bg-background/70 backdrop-blur-sm dark:bg-black/70",
} as const;

/**
 * Surface overlay styles (for cards, images, hover states)
 * Adaptive to light/dark mode
 */
export const surface = {
  /** Subtle surface overlay (10%) */
  subtle: "bg-foreground/5 dark:bg-white/5",
  /** Light surface overlay (10-15%) */
  light: "bg-foreground/10 dark:bg-white/10",
  /** Medium surface overlay (20%) */
  medium: "bg-foreground/20 dark:bg-white/20",
  /** Heavy surface overlay (30%) */
  heavy: "bg-foreground/30 dark:bg-white/30",
  /** Dark surface for image overlays */
  imageDark: "bg-black/40",
  /** Gradient fade for image overlays */
  imageGradient: "bg-gradient-to-t from-black/60 via-black/20 to-transparent",
} as const;

/**
 * Text colors on overlays (for contrast)
 */
export const overlayText = {
  /** Primary text on dark overlays */
  primary: "text-white",
  /** Secondary text on dark overlays */
  secondary: "text-white/80",
  /** Muted text on dark overlays */
  muted: "text-white/60",
  /** Adaptive text that works on any overlay */
  adaptive: "text-foreground dark:text-white",
} as const;

/**
 * Interactive overlay states
 */
export const interactive = {
  /** Hover state overlay */
  hover: "hover:bg-foreground/5 dark:hover:bg-white/5",
  /** Active/pressed state overlay */
  active: "active:bg-foreground/10 dark:active:bg-white/10",
  /** Selected state overlay */
  selected: "bg-primary/10",
  /** Focus overlay */
  focus: "focus-visible:bg-primary/5",
} as const;

/**
 * Pill/badge background styles
 */
export const pill = {
  /** Glass pill on dark backgrounds */
  glassDark: cn("bg-black/40 backdrop-blur-sm", "border border-white/10", "text-white"),
  /** Glass pill on light backgrounds */
  glassLight: cn("bg-white/80 backdrop-blur-sm", "border border-border/50", "text-foreground"),
  /** Adaptive glass pill */
  glass: cn("bg-background/60 dark:bg-black/40", "backdrop-blur-sm", "border border-border/50 dark:border-white/10"),
} as const;

/**
 * Player/media overlay styles
 */
export const media = {
  /** Play button overlay on cover images */
  playOverlay: cn("bg-black/40 backdrop-blur-sm", "flex items-center justify-center", "transition-opacity"),
  /** Seek feedback overlay */
  seekFeedback: cn("bg-black/60 backdrop-blur-md", "rounded-full", "shadow-lg"),
  /** Volume/progress bar track */
  track: "bg-white/20",
  /** Volume/progress bar fill */
  fill: "bg-white",
} as const;

/**
 * Hardware/Studio UI styles (drum machines, mixers, etc.)
 * These maintain dark aesthetics regardless of theme
 */
export const hardware = {
  /** LED display panel background */
  ledPanel: "bg-black/40 border border-white/10",
  /** Status badge (mute/solo/etc) */
  statusBadge: "bg-black/60",
  /** VU meter background */
  meterBg: "bg-black/30",
  /** Step indicator */
  stepIndicator: "bg-black/30 border border-white/5",
} as const;

/**
 * Get backdrop class for a given opacity level
 */
export function getBackdrop(opacity: 40 | 50 | 60 | 80 = 50): string {
  const map = {
    40: backdrop.light,
    50: backdrop.medium,
    60: backdrop.heavy,
    80: backdrop.dark,
  };
  return map[opacity];
}

/**
 * Create a consistent overlay for image cards
 */
export function imageOverlay(showOnHover = true): string {
  return cn(
    surface.imageDark,
    "flex items-center justify-center",
    "transition-opacity",
    showOnHover && "opacity-0 group-hover:opacity-100",
  );
}

export default {
  backdrop,
  surface,
  overlayText,
  interactive,
  pill,
  media,
  hardware,
  getBackdrop,
  imageOverlay,
};
