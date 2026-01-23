/**
 * Telegram Mini App Safe Area Constants
 * Unified formulas for consistent header/content positioning
 * 
 * USAGE GUIDE:
 * 
 * 1. For page containers, use PageContainer component:
 *    import { PageContainer } from '@/components/layout';
 *    <PageContainer withBottomNav>{children}</PageContainer>
 * 
 * 2. For inline styles, use SAFE_STYLES or build functions:
 *    import { SAFE_STYLES, getSafeAreaTop } from '@/constants/safe-area';
 *    <div style={SAFE_STYLES.headerTop} />
 *    <div style={{ paddingTop: getSafeAreaTop(16) }} />
 * 
 * 3. For headers, use PageHeader or SafeHeader:
 *    import { PageHeader } from '@/components/layout';
 *    <PageHeader>{headerContent}</PageHeader>
 */

// ============================================================================
// CSS FORMULAS - Use in calc() or as CSS property values
// ============================================================================

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
   */
  stickyHeaderTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 0.5rem)`,

  /**
   * For home header with larger padding
   */
  homeHeaderTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 1rem)`,

  /**
   * Minimal safe area (just the device insets, no extra padding)
   */
  minimalTop: `max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))`,

  /**
   * For overlays that need consistent positioning
   */
  overlayTop: `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)) + 0.5rem)`,

  /**
   * Bottom safe area for navigation and controls
   */
  bottom: `max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))`,

  /**
   * Bottom with content padding
   */
  bottomWithPadding: `calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 1rem)`,

  /**
   * Bottom for navigation bar (includes nav height)
   */
  bottomNav: `calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 5rem)`,
} as const;

// ============================================================================
// BUILDER FUNCTIONS - For dynamic safe area calculations
// ============================================================================

/**
 * Get safe area value with custom additional padding
 * @param extraPx - Extra pixels to add after safe area
 * @returns CSS calc() string
 * 
 * @example
 * getSafeAreaTop(16) // "calc(max(...) + 16px)"
 */
export function getSafeAreaTop(extraPx: number = 12): string {
  const extra = extraPx > 0 ? ` + ${extraPx}px` : '';
  return `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))${extra})`;
}

/**
 * Get safe area bottom with custom additional padding
 * @param extraPx - Extra pixels (includes nav height if needed)
 * @returns CSS calc() string
 * 
 * @example
 * getSafeAreaBottom(80) // "calc(max(...) + 80px)" - with bottom nav
 */
export function getSafeAreaBottom(extraPx: number = 0): string {
  const extra = extraPx > 0 ? ` + ${extraPx}px` : '';
  return `calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))${extra})`;
}

/**
 * Get minimal safe area (no extra padding)
 */
export function getMinimalSafeAreaTop(): string {
  return `max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))`;
}

/**
 * Get minimal bottom safe area
 */
export function getMinimalSafeAreaBottom(): string {
  return `max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))`;
}

// ============================================================================
// STYLE OBJECTS - Ready-to-use CSSProperties
// ============================================================================

/**
 * Safe area inline style objects for common patterns
 * Usage: <div style={SAFE_STYLES.headerTop} />
 */
export const SAFE_STYLES = {
  // Headers
  headerTop: { paddingTop: TELEGRAM_SAFE_AREA.headerTop },
  stickyHeader: { paddingTop: TELEGRAM_SAFE_AREA.stickyHeaderTop },
  homeHeader: { paddingTop: TELEGRAM_SAFE_AREA.homeHeaderTop },
  minimalTop: { paddingTop: TELEGRAM_SAFE_AREA.minimalTop },
  overlayTop: { paddingTop: TELEGRAM_SAFE_AREA.overlayTop },

  // Bottom
  bottom: { paddingBottom: TELEGRAM_SAFE_AREA.bottom },
  bottomWithPadding: { paddingBottom: TELEGRAM_SAFE_AREA.bottomWithPadding },
  bottomNav: { paddingBottom: TELEGRAM_SAFE_AREA.bottomNav },

  // Combined styles for common patterns
  pageWithNav: {
    paddingTop: getSafeAreaTop(12),
    paddingBottom: getSafeAreaBottom(80),
    minHeight: 'var(--tg-viewport-stable-height, 100vh)',
  },
  pageNoNav: {
    paddingTop: getSafeAreaTop(12),
    paddingBottom: getSafeAreaBottom(16),
    minHeight: 'var(--tg-viewport-stable-height, 100vh)',
  },
  fullscreen: {
    paddingTop: getMinimalSafeAreaTop(),
    paddingBottom: getMinimalSafeAreaBottom(),
    minHeight: 'var(--tg-viewport-stable-height, 100vh)',
  },
  centeredOverlay: {
    paddingTop: getMinimalSafeAreaTop(),
    paddingBottom: getMinimalSafeAreaBottom(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // For player controls
  playerTop: { paddingTop: TELEGRAM_SAFE_AREA.headerTop },
  playerBottom: { paddingBottom: TELEGRAM_SAFE_AREA.bottomWithPadding },

  // For sheets/modals
  sheetTop: { paddingTop: TELEGRAM_SAFE_AREA.minimalTop },
  sheetBottom: { paddingBottom: TELEGRAM_SAFE_AREA.bottom },
} as const;

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

/**
 * Fixed element heights for layout calculations
 */
export const LAYOUT_HEIGHTS = {
  bottomNav: 80,
  miniPlayer: 64,
  header: 56,
  touchTarget: 44,
  mainButton: 60,
} as const;

/**
 * Standard spacing values
 */
export const LAYOUT_SPACING = {
  pageX: 16,
  pageXSm: 12,
  pageXLg: 24,
  sectionGap: 24,
  cardGap: 12,
  itemGap: 8,
} as const;

// ============================================================================
// CSS CLASS HELPERS (for Tailwind integration)
// ============================================================================

/**
 * CSS class names for safe areas (to be used with cn() utility)
 */
export const SAFE_AREA_CLASSES = {
  safeTop: 'safe-top',
  safeTopCompact: 'safe-top-compact',
  safeTopSpacious: 'safe-top-spacious',
  safeBottom: 'safe-bottom',
  safeBottomNav: 'safe-bottom-nav',
  safeVertical: 'safe-vertical',
  safeAll: 'safe-all',
} as const;

/**
 * Helper function to get safe area className
 * Usage: getSafeAreaClass('top', 'spacious')
 */
export function getSafeAreaClass(
  position: 'top' | 'bottom' | 'vertical' | 'all',
  variant: 'minimal' | 'compact' | 'normal' | 'spacious' = 'normal'
): string {
  const variants = {
    minimal: 'minimal',
    compact: 'compact',
    normal: '',
    spacious: 'spacious',
  };

  const suffix = variants[variant];

  switch (position) {
    case 'top':
      return suffix ? `safe-top-${suffix}` : 'safe-top';
    case 'bottom':
      return variant === 'spacious' ? 'safe-bottom-nav' : 'safe-bottom';
    case 'vertical':
      return suffix ? `safe-vertical-${suffix}` : 'safe-vertical';
    case 'all':
      return suffix ? `safe-all-${suffix}` : 'safe-all';
  }
}
