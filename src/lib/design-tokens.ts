/**
 * Design Tokens for Mobile-First Minimalist UI Redesign
 * Feature: 001-mobile-ui-redesign
 *
 * This file consolidates all design system constants for TypeScript usage.
 * These values mirror the CSS custom properties defined in src/index.css.
 *
 * Design System:
 * - 8px spatial grid system
 * - 3-level typography scale (H1: 24px, H2: 20px, H3: 16px)
 * - Consistent border radius (8-12px)
 * - Touch targets (44-56px minimum)
 */

// ============================================================================
// SPACING SCALE (8px Grid System)
// ============================================================================

export const spacing = {
  xs: 4,   // 0.25rem - Extra small (1/2 grid unit)
  sm: 8,   // 0.5rem  - Small (1 grid unit)
  md: 12,  // 0.75rem - Medium (1.5 grid units)
  lg: 16,  // 1rem    - Large (2 grid units)
  xl: 24,  // 1.5rem  - Extra large (3 grid units)
  '2xl': 32, // 2rem  - 2X large (4 grid units)
  '3xl': 48, // 3rem  - 3X large (6 grid units)
} as const;

export type SpacingValue = typeof spacing[keyof typeof spacing];

// ============================================================================
// TAILWIND SPACING CLASSES
// ============================================================================

/**
 * Tailwind spacing class tokens for consistent margins/paddings
 * Usage: className={spacingClass.section}
 */
export const spacingClass = {
  /** Between major page sections */
  section: 'mb-4 sm:mb-6',
  sectionY: 'my-4 sm:my-6',
  /** Inside card components */
  card: 'p-3 sm:p-4',
  cardCompact: 'p-2.5 sm:p-3',
  cardLarge: 'p-4 sm:p-6',
  /** Gap between flex/grid items */
  gap: 'gap-2 sm:gap-3',
  gapSm: 'gap-1.5 sm:gap-2',
  gapLg: 'gap-3 sm:gap-4',
  /** Inline spacing */
  inline: 'gap-1.5 sm:gap-2',
  /** Page padding */
  page: 'px-3 sm:px-4 md:px-6',
  pageY: 'py-3 sm:py-4',
} as const;

// ============================================================================
// TYPOGRAPHY SCALE (3-Level System)
// ============================================================================

export const typography = {
  // Heading levels - Mobile-first minimalist approach
  h1: {
    fontSize: 24,    // px - Primary page headings
    lineHeight: 1.2,
    fontWeight: 700,
  },
  h2: {
    fontSize: 20,    // px - Section headings
    lineHeight: 1.3,
    fontWeight: 600,
  },
  h3: {
    fontSize: 16,    // px - Card/subsection headings
    lineHeight: 1.4,
    fontWeight: 600,
  },

  // Body text
  body: {
    fontSize: 14,    // px - Standard body text (mobile)
    lineHeight: 1.5,
    fontWeight: 400,
  },

  // Small text
  small: {
    fontSize: 12,    // px - Metadata, captions
    lineHeight: 1.5,
    fontWeight: 400,
  },

  // Caption
  caption: {
    fontSize: 10,    // px - Tiny labels
    lineHeight: 1.4,
    fontWeight: 400,
  },
} as const;

export type TypographyLevel = keyof typeof typography;

// ============================================================================
// TAILWIND TYPOGRAPHY CLASSES
// ============================================================================

/**
 * Tailwind typography class tokens for consistent text styling
 * Usage: className={typographyClass.heading.h1}
 */
export const typographyClass = {
  /** Page and section headings */
  heading: {
    h1: 'text-2xl sm:text-3xl font-bold leading-tight tracking-tight',
    h2: 'text-xl sm:text-2xl font-semibold leading-snug',
    h3: 'text-lg sm:text-xl font-semibold leading-snug',
    h4: 'text-base sm:text-lg font-medium leading-normal',
    h5: 'text-sm sm:text-base font-medium leading-normal',
  },
  /** Body text variations */
  body: {
    lg: 'text-base sm:text-lg leading-relaxed',
    md: 'text-sm sm:text-base leading-relaxed',
    sm: 'text-xs sm:text-sm leading-normal',
    xs: 'text-[11px] sm:text-xs leading-normal',
  },
  /** Form labels and metadata */
  label: 'text-xs sm:text-sm font-medium text-muted-foreground',
  /** Small captions and timestamps */
  caption: 'text-[10px] sm:text-[11px] text-muted-foreground leading-tight',
  /** Interactive text */
  interactive: 'text-sm font-medium hover:underline underline-offset-2',
  /** Monospace */
  mono: 'font-mono text-xs sm:text-sm',
} as const;

/**
 * Russian text handling - Prevents layout breaks with longer text
 * Usage: className={textBalance.ru}
 */
export const textBalance = {
  /** Balanced text wrapping */
  balance: 'text-balance',
  /** Safe word breaking for Russian */
  breakSafe: 'break-words [overflow-wrap:anywhere] hyphens-auto',
  /** Combined for long Russian text */
  ru: 'text-balance break-words hyphens-auto',
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  sm: 8,      // 0.5rem  - Small radius (cards, buttons)
  md: 12,     // 0.75rem - Medium radius (default)
  lg: 16,     // 1rem    - Large radius (modals, sheets)
  xl: 20,     // 1.25rem - Extra large radius
  full: 9999, // Fully rounded (pills, avatar)
} as const;

export type BorderRadiusValue = typeof borderRadius[keyof typeof borderRadius];

// ============================================================================
// TOUCH TARGETS (Mobile)
// ============================================================================

export const touchTargets = {
  min: 44,         // px - iOS HIG minimum
  comfortable: 48, // px - Comfortable touch target
  large: 56,       // px - Large touch target (Material Design)
} as const;

export type TouchTargetValue = typeof touchTargets[keyof typeof touchTargets];

// ============================================================================
// MOTION DURATION
// ============================================================================

export const duration = {
  instant: 0,
  fast: 100,      // ms - Visual feedback
  normal: 200,    // ms - Standard transitions
  slow: 300,      // ms - Navigation transitions
  slower: 400,    // ms - Complex animations
  slowest: 500,   // ms - Hero animations
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
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
  dropdown: 200,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  xs: 375,    // Small phones
  sm: 640,    // Medium phones
  md: 768,    // Tablets
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
  '2xl': 1536, // Extra large desktop
} as const;

// ============================================================================
// CARD DIMENSIONS
// ============================================================================

export const card = {
  height: {
    list: 72,        // px - Track card list view height
    listCompact: 64, // px - Compact list view
  },
  padding: {
    xs: 8,      // px - Tight cards
    sm: 12,     // px - Small cards
    md: 16,     // px - Medium cards (default)
    lg: 20,     // px - Large cards
  },
  gap: {
    xs: 8,      // px - Tight grid
    sm: 12,     // px - Small grid
    md: 16,     // px - Medium grid
    lg: 24,     // px - Large grid
  },
} as const;

// ============================================================================
// NAVIGATION
// ============================================================================

export const navigation = {
  tabBar: {
    height: 56,    // px - Bottom navigation bar height
    iconSize: 24,  // px - Icon size
    labelSize: 11, // px - Label font size
  },
  fab: {
    size: 56,      // px - FAB diameter
    iconSize: 24,  // px - FAB icon size
  },
} as const;

// ============================================================================
// PLAYER
// ============================================================================

export const player = {
  compact: {
    height: 64,        // px - Compact player height
    expandedHeight: 72, // px - Expanded compact player
  },
  expanded: {
    minHeight: 280,    // px - Expanded player minimum height
  },
  fullscreen: {
    minHeight: '100vh', // Fullscreen player
  },
} as const;

// ============================================================================
// SAFE AREAS (CSS Variable Names)
// ============================================================================

export const safeAreaVars = {
  top: '--tg-safe-area-inset-top',
  bottom: '--tg-safe-area-inset-bottom',
  left: '--tg-safe-area-inset-left',
  right: '--tg-safe-area-inset-right',
  contentTop: '--tg-content-safe-area-inset-top',
  contentBottom: '--tg-content-safe-area-inset-bottom',
} as const;

// Helper to get safe area value from CSS variable
export const getSafeAreaInset = (varName: string): string => {
  if (typeof window === 'undefined') return '0px';
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim() || '0px';
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert rem value to pixels
 * @param rem - Value in rem
 * @param baseFontSize - Base font size in px (default: 16)
 */
export const remToPx = (rem: number, baseFontSize = 16): number => {
  return rem * baseFontSize;
};

/**
 * Convert pixels to rem
 * @param px - Value in pixels
 * @param baseFontSize - Base font size in px (default: 16)
 */
export const pxToRem = (px: number, baseFontSize = 16): number => {
  return px / baseFontSize;
};

/**
 * Get spacing value as CSS string (px or rem)
 * @param value - Spacing token value
 * @param unit - Unit to use ('px' | 'rem')
 */
export const getSpacing = (
  value: SpacingValue,
  unit: 'px' | 'rem' = 'px'
): string => {
  return unit === 'px' ? `${value}px` : `${value / 16}rem`;
};

/**
 * Check if device is mobile based on viewport width
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
};

/**
 * Check if device should use touch interactions
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - vendor prefix
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Get appropriate touch target size based on device
 */
export const getTouchTargetSize = (): number => {
  return isTouchDevice() ? touchTargets.min : 32; // 32px for desktop
};

// ============================================================================
// COMPONENT PATTERN CLASSES
// ============================================================================

/**
 * Common component pattern classes
 * Usage: className={patterns.glassCard}
 */
export const patterns = {
  /** Glass morphism card */
  glassCard: 'glass-card rounded-xl border border-border/50 backdrop-blur-sm',
  /** Interactive card with hover */
  interactiveCard: 'glass-card rounded-xl border border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-md',
  /** Muted background section */
  mutedSection: 'bg-muted/30 rounded-lg p-3 sm:p-4',
  /** Gradient text (primary color) */
  gradientText: 'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
  /** Truncated single-line text */
  truncate: 'truncate overflow-hidden text-ellipsis',
  /** Multi-line clamped text */
  lineClamp2: 'line-clamp-2',
  lineClamp3: 'line-clamp-3',
} as const;

/**
 * Touch target classes for buttons and interactive elements
 * Usage: className={touchTargetClass.icon}
 */
export const touchTargetClass = {
  /** Standard icon button (44x44px) */
  icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
  /** Smaller icon that still meets touch target */
  iconSm: 'h-10 w-10 min-h-[44px] min-w-[44px]',
  /** Standard button height */
  button: 'h-11 min-h-[44px]',
  /** Larger comfortable button (48px) */
  buttonLg: 'h-12 min-h-[48px]',
  /** List item minimum height */
  listItem: 'min-h-[48px] py-2',
  /** Navigation item */
  nav: 'min-h-[44px] py-2',
} as const;

// ============================================================================
// ANIMATION CLASSES (prefers-reduced-motion aware)
// ============================================================================

export const animations = {
  /** Fade in with subtle upward motion */
  fadeIn: 'animate-fade-in motion-reduce:animate-none',
  /** Fade out with subtle downward motion */
  fadeOut: 'animate-fade-out motion-reduce:animate-none',
  /** Scale in for modals/popups */
  scaleIn: 'animate-scale-in motion-reduce:animate-none',
  /** Pulse for attention/loading */
  pulse: 'animate-pulse motion-reduce:animate-none',
  /** Spin for loading indicators */
  spin: 'animate-spin motion-reduce:animate-none',
} as const;

// ============================================================================
// TRANSITION CLASSES (GPU-accelerated)
// ============================================================================

export const transitions = {
  /** Default transition for most elements */
  default: 'transition-all duration-200 ease-out',
  /** Fast transition for hover effects */
  fast: 'transition-all duration-150 ease-out',
  /** Slow transition for complex animations */
  slow: 'transition-all duration-300 ease-out',
  /** Transform-only for performance */
  transform: 'transition-transform duration-200 ease-out',
  /** GPU-optimized with will-change */
  gpu: 'transition-transform duration-200 ease-out will-change-transform',
} as const;

// ============================================================================
// LOADING STATE CLASSES
// ============================================================================

export const loadingStates = {
  /** Skeleton shimmer effect */
  skeleton: 'animate-pulse bg-muted rounded',
  /** Skeleton with rounded corners */
  skeletonCard: 'animate-pulse bg-muted rounded-lg',
  /** Skeleton circle for avatars */
  skeletonCircle: 'animate-pulse bg-muted rounded-full',
  /** Skeleton text line */
  skeletonLine: 'animate-pulse bg-muted rounded h-4 w-full',
  /** Skeleton short text */
  skeletonShort: 'animate-pulse bg-muted rounded h-4 w-2/3',
  /** Disabled state during loading */
  disabled: 'opacity-50 pointer-events-none',
  /** Loading overlay */
  overlay: 'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
} as const;

// ============================================================================
// EMPTY STATE PATTERNS
// ============================================================================

export const emptyStates = {
  /** Container for empty state */
  container: 'flex flex-col items-center justify-center py-12 px-4 text-center',
  /** Icon wrapper */
  icon: 'w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4',
  /** Title text */
  title: 'text-lg font-medium text-foreground mb-2',
  /** Description text */
  description: 'text-sm text-muted-foreground mb-6 max-w-sm',
} as const;

// ============================================================================
// INTERACTIVE STATE PATTERNS
// ============================================================================

export const interactiveStates = {
  /** Hover scale effect */
  hoverScale: 'hover:scale-105 active:scale-95 transition-transform duration-150',
  /** Hover with background */
  hoverBg: 'hover:bg-accent transition-colors duration-150',
  /** Pressed state */
  pressed: 'active:scale-[0.98] transition-transform duration-100',
  /** Disabled state */
  disabled: 'disabled:opacity-50 disabled:pointer-events-none',
} as const;

// ============================================================================
// CARD PATTERNS
// ============================================================================

export const cardPatterns = {
  /** Base card */
  base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
  /** Interactive card */
  interactive: 'rounded-lg border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors cursor-pointer',
  /** Selected card */
  selected: 'rounded-lg border-2 border-primary bg-card text-card-foreground shadow-sm',
} as const;

// ============================================================================
// FOCUS STYLES (Accessibility)
// ============================================================================

export const focusStyles = {
  /** Default focus ring */
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  /** Focus ring without offset */
  ringNoOffset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  /** Inset focus ring (for buttons) */
  ringInset: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  /** Glow focus (for primary actions) */
  glow: 'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.4)]',
} as const;

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

export const a11y = {
  /** Screen reader only text */
  srOnly: 'sr-only',
  /** Skip to content link */
  skipLink: 'skip-to-content',
  /** Ensure touch target size */
  touchTarget: 'touch-target',
  /** High contrast text */
  highContrast: 'text-muted-high-contrast',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if high contrast is preferred
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Get appropriate animation duration based on user preferences
 */
export function getAnimationDuration(baseDuration: number): number {
  if (prefersReducedMotion()) return 0;
  return baseDuration;
}

/**
 * Generate CSS class for minimum contrast ratio
 * @param ratio - WCAG contrast ratio (AA = 4.5, AAA = 7)
 */
export function getContrastClass(ratio: 'AA' | 'AAA' = 'AA'): string {
  return ratio === 'AAA' ? 'text-muted-high-contrast' : 'text-muted-foreground';
}
