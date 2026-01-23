/**
 * Layout Utilities
 * Centralized helpers for consistent spacing, safe areas, and layout
 * 
 * Usage:
 * - Import specific utilities for component-level use
 * - Use CSS classes via Tailwind for simple cases
 * - Use style objects for dynamic calculations
 */

import { CSSProperties } from 'react';
import { TELEGRAM_SAFE_AREA, getSafeAreaTop, getSafeAreaBottom } from '@/constants/safe-area';

// ============================================================================
// SAFE AREA STYLES - Ready-to-use style objects
// ============================================================================

/**
 * Pre-built style objects for common safe area patterns
 */
export const safeStyles = {
  // Headers
  header: {
    paddingTop: TELEGRAM_SAFE_AREA.headerTop,
  } as CSSProperties,

  stickyHeader: {
    paddingTop: TELEGRAM_SAFE_AREA.stickyHeaderTop,
  } as CSSProperties,

  homeHeader: {
    paddingTop: TELEGRAM_SAFE_AREA.homeHeaderTop,
  } as CSSProperties,

  // Containers
  pageWithNav: {
    paddingTop: getSafeAreaTop(12),
    paddingBottom: getSafeAreaBottom(80),
    minHeight: 'var(--tg-viewport-stable-height, 100vh)',
  } as CSSProperties,

  pageNoNav: {
    paddingTop: getSafeAreaTop(12),
    paddingBottom: getSafeAreaBottom(16),
    minHeight: 'var(--tg-viewport-stable-height, 100vh)',
  } as CSSProperties,

  fullscreen: {
    paddingTop: getSafeAreaTop(0),
    paddingBottom: getSafeAreaBottom(0),
    minHeight: 'var(--tg-viewport-stable-height, 100vh)',
  } as CSSProperties,

  // Overlays
  overlay: {
    paddingTop: TELEGRAM_SAFE_AREA.minimalTop,
    paddingBottom: TELEGRAM_SAFE_AREA.bottom,
  } as CSSProperties,

  centeredOverlay: {
    paddingTop: getSafeAreaTop(0),
    paddingBottom: getSafeAreaBottom(0),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  // Bottom elements
  bottomNav: {
    paddingBottom: TELEGRAM_SAFE_AREA.bottomNav,
  } as CSSProperties,

  floatingBottom: {
    paddingBottom: getSafeAreaBottom(16),
  } as CSSProperties,
} as const;

// ============================================================================
// STYLE BUILDERS - Functions for dynamic safe area styles
// ============================================================================

/**
 * Build page container styles with options
 */
export function buildPageStyles(options: {
  withBottomNav?: boolean;
  withTopPadding?: boolean;
  extraTop?: number;
  extraBottom?: number;
}): CSSProperties {
  const { 
    withBottomNav = true, 
    withTopPadding = true,
    extraTop = 0, 
    extraBottom = 0 
  } = options;

  const navHeight = withBottomNav ? 80 : 0;

  return {
    paddingTop: withTopPadding ? getSafeAreaTop(12 + extraTop) : undefined,
    paddingBottom: getSafeAreaBottom(navHeight + extraBottom),
    minHeight: 'var(--tg-viewport-stable-height, 100vh)',
  };
}

/**
 * Build header styles with options
 */
export function buildHeaderStyles(options: {
  variant?: 'sticky' | 'home' | 'minimal' | 'overlay';
  extraPadding?: number;
}): CSSProperties {
  const { variant = 'sticky', extraPadding = 0 } = options;

  const variantStyles = {
    sticky: TELEGRAM_SAFE_AREA.stickyHeaderTop,
    home: TELEGRAM_SAFE_AREA.homeHeaderTop,
    minimal: TELEGRAM_SAFE_AREA.minimalTop,
    overlay: TELEGRAM_SAFE_AREA.overlayTop,
  };

  if (extraPadding > 0) {
    return { paddingTop: getSafeAreaTop(extraPadding + 8) };
  }

  return { paddingTop: variantStyles[variant] };
}

/**
 * Build overlay/modal styles
 */
export function buildOverlayStyles(options: {
  centered?: boolean;
  withBottomNav?: boolean;
}): CSSProperties {
  const { centered = true, withBottomNav = false } = options;

  const baseStyle: CSSProperties = {
    paddingTop: getSafeAreaTop(0),
    paddingBottom: getSafeAreaBottom(withBottomNav ? 80 : 0),
  };

  if (centered) {
    return {
      ...baseStyle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }

  return baseStyle;
}

// ============================================================================
// CSS CLASS HELPERS - Tailwind-compatible class strings
// ============================================================================

/**
 * Tailwind classes for safe areas
 * These use CSS variables directly for maximum flexibility
 */
export const safeClasses = {
  // Page containers
  page: 'min-h-[var(--tg-viewport-stable-height,100vh)]',
  
  // Padding variants (use with custom styles for complex cases)
  contentPadding: 'px-4',
  contentPaddingSm: 'px-3',
  contentPaddingLg: 'px-6',

  // Flex layouts
  flexColumn: 'flex flex-col',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',

  // Common patterns
  stickyHeader: 'sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/40',
  fixedBottom: 'fixed bottom-0 left-0 right-0 z-50',
  fixedOverlay: 'fixed inset-0 z-80',
  
  // Touch targets
  touchTarget: 'min-h-touch min-w-touch',
} as const;

// ============================================================================
// SPACING CONSTANTS
// ============================================================================

/**
 * Standard spacing values (in pixels)
 */
export const spacing = {
  bottomNavHeight: 80,
  miniPlayerHeight: 64,
  headerHeight: 56,
  touchTarget: 44,
  
  // Content padding
  pagePaddingX: 16,
  sectionGap: 24,
  cardGap: 12,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate content height accounting for fixed elements
 */
export function getContentHeight(options: {
  withHeader?: boolean;
  withBottomNav?: boolean;
  withMiniPlayer?: boolean;
}): string {
  const { withHeader = false, withBottomNav = true, withMiniPlayer = false } = options;
  
  let subtract = 0;
  if (withHeader) subtract += spacing.headerHeight;
  if (withBottomNav) subtract += spacing.bottomNavHeight;
  if (withMiniPlayer) subtract += spacing.miniPlayerHeight;

  if (subtract === 0) {
    return 'var(--tg-viewport-stable-height, 100vh)';
  }

  return `calc(var(--tg-viewport-stable-height, 100vh) - ${subtract}px)`;
}

/**
 * Get style for sticky positioning below header
 */
export function getStickyBelowHeaderStyle(extraOffset: number = 0): CSSProperties {
  return {
    position: 'sticky',
    top: `calc(${spacing.headerHeight}px + ${extraOffset}px)`,
    zIndex: 30,
  };
}

export default {
  safeStyles,
  safeClasses,
  spacing,
  buildPageStyles,
  buildHeaderStyles,
  buildOverlayStyles,
  getContentHeight,
  getStickyBelowHeaderStyle,
};
