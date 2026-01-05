/**
 * UnifiedTrackCard Variant Configuration
 *
 * Per research.md Task 1: Component Consolidation Patterns
 * Discriminated union pattern with 7 variants
 */

import type { UnifiedTrackCardVariantConfig } from './track-card.types';

/**
 * Variant configuration for each UnifiedTrackCard variant
 *
 * Defines the visual presentation, features, and animations for each variant.
 */
export const VARIANT_CONFIG: Record<string, UnifiedTrackCardVariantConfig> = {
  /**
   * Grid variant
   * Default for home/library grids
   */
  grid: {
    layout: 'grid',
    showCover: true,
    showTitle: true,
    showActions: true,
    showVersionToggle: false,
    showStemCount: true,
    compact: false,
    animations: {
      enter: 'fade-in scale-in',
      hover: 'hover-lift',
      tap: 'press-scale',
    },
  },

  /**
   * List variant
   * For track lists, search results
   */
  list: {
    layout: 'list',
    showCover: true,
    showTitle: true,
    showActions: true,
    showVersionToggle: true,
    showStemCount: true,
    compact: false,
    animations: {
      enter: 'slide-in-right',
      hover: 'hover-lift',
      tap: 'press-scale',
    },
  },

  /**
   * Compact variant
   * For tight spaces, horizontal lists
   */
  compact: {
    layout: 'grid',
    showCover: true,
    showTitle: true,
    showActions: false,
    showVersionToggle: false,
    showStemCount: false,
    compact: true,
    animations: {
      enter: 'fade-in',
      hover: 'hover-lift',
      tap: 'press-scale',
    },
  },

  /**
   * Minimal variant
   * No actions, just display
   */
  minimal: {
    layout: 'grid',
    showCover: true,
    showTitle: true,
    showActions: false,
    showVersionToggle: false,
    showStemCount: false,
    compact: true,
    animations: {
      enter: 'fade-in',
      hover: 'none',
      tap: 'press-scale',
    },
  },

  /**
   * Default variant
   * Balanced feature set
   */
  default: {
    layout: 'grid',
    showCover: true,
    showTitle: true,
    showActions: true,
    showVersionToggle: false,
    showStemCount: true,
    compact: false,
    animations: {
      enter: 'fade-in scale-in',
      hover: 'hover-lift',
      tap: 'press-scale',
    },
  },

  /**
   * Enhanced variant
   * With social features (follow, share, add to playlist)
   */
  enhanced: {
    layout: 'grid',
    showCover: true,
    showTitle: true,
    showActions: true,
    showVersionToggle: true,
    showStemCount: true,
    compact: false,
    animations: {
      enter: 'fade-in scale-in',
      hover: 'hover-lift',
      tap: 'press-scale',
    },
  },

  /**
   * Professional variant
   * With MIDI status and version pills
   */
  professional: {
    layout: 'grid',
    showCover: true,
    showTitle: true,
    showActions: true,
    showVersionToggle: true,
    showStemCount: true,
    compact: false,
    animations: {
      enter: 'fade-in scale-in',
      hover: 'hover-lift',
      tap: 'press-scale',
    },
  },
};

/**
 * Get variant config by variant name
 */
export function getVariantConfig(variant: string): UnifiedTrackCardVariantConfig {
  return VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;
}

/**
 * Layout-specific styles
 */
export const LAYOUT_STYLES = {
  grid: {
    container: 'grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    card: 'aspect-square',
  },
  list: {
    container: 'flex flex-col gap-3',
    card: 'w-full h-20',
  },
} as const;

/**
 * Touch target sizes (per constitution Principle VII)
 */
export const TOUCH_TARGETS = {
  min: 44, // Minimum touch target (iOS HIG)
  max: 56, // Maximum comfortable touch target
} as const;

/**
 * Animation durations
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Gesture thresholds
 */
export const GESTURE_THRESHOLDS = {
  swipe: 80, // Minimum swipe distance in pixels
  longPress: 500, // Long press duration in ms
  doubleTap: 300, // Max time between taps for double-tap
} as const;

/**
 * Haptic feedback patterns (per Telegram Web App SDK)
 */
export const HAPTIC_PATTERNS = {
  tap: 'light',
  swipe: 'medium',
  like: 'light',
  error: 'error',
  success: 'success',
} as const;
