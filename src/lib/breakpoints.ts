/**
 * Breakpoints and Layout Constants
 * Feature: Desktop UI Optimization
 *
 * Standardized breakpoints, grid configurations, and container widths
 * for consistent responsive design across the application.
 */

// ============ Breakpoint Values ============

/**
 * Tailwind breakpoint values in pixels
 * Matches tailwind.config.ts defaults
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============ Grid Configurations ============

/**
 * Standard grid column configurations for different page types
 * Use these for consistent responsive grid layouts
 * 
 * Breakpoint strategy:
 * - Mobile (< 640px): 1-2 columns
 * - Tablet Portrait (640-768px): 2-3 columns
 * - Tablet Landscape (768-1024px): 3-4 columns
 * - Desktop (1024-1280px): 4-5 columns
 * - Large Desktop (> 1280px): 5-6 columns
 */
export const GRID_COLS = {
  /** Dashboard stats and cards - 2 columns on desktop */
  dashboard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6',
  
  /** Card grids - progressive columns based on viewport */
  cards: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
  
  /** Tool/feature grids - balanced for readability */
  tools: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  
  /** Stats/metrics row - 2 on mobile, 3 tablet, 4 on desktop */
  stats: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3',
  
  /** Menu items grid - 3 columns on large screens */
  menu: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3',
  
  /** Compact cards - more density */
  compact: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2',
  
  /** Track cards in library */
  tracks: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3',
  
  /** Project cards - balanced density */
  projects: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4',
} as const;

// ============ Container Widths ============

/**
 * Max-width presets for different content types
 */
export const MAX_WIDTHS = {
  /** Forms, dialogs, narrow content */
  narrow: 'max-w-2xl',
  
  /** Standard content, lists */
  medium: 'max-w-4xl',
  
  /** Dashboards, wide content */
  wide: 'max-w-6xl',
  
  /** Full-width layouts (Studio, graphs) */
  full: 'max-w-7xl',
  
  /** No max-width constraint */
  none: '',
} as const;

// ============ Gap Presets ============

/**
 * Standard gap values for consistent spacing
 */
export const GAPS = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
  '2xl': 'gap-8',
} as const;

// ============ Layout Ratios ============

/**
 * Master-detail layout proportions
 */
export const LAYOUT_RATIOS = {
  /** Default: 60% master, 40% detail */
  default: {
    master: 'w-full lg:w-[60%]',
    detail: 'hidden lg:block lg:w-[40%]',
  },
  /** Equal split */
  equal: {
    master: 'w-full lg:w-1/2',
    detail: 'hidden lg:block lg:w-1/2',
  },
  /** Wide master, narrow detail */
  wide: {
    master: 'w-full lg:w-[70%]',
    detail: 'hidden lg:block lg:w-[30%]',
  },
} as const;

// ============ Sidebar Widths ============

/**
 * Sidebar width configurations
 */
export const SIDEBAR_WIDTHS = {
  /** Collapsed mini sidebar */
  collapsed: 'w-16',
  /** Expanded full sidebar */
  expanded: 'w-64',
  /** Transition classes */
  transition: 'transition-all duration-300 ease-in-out',
} as const;

// ============ Helper Functions ============

/**
 * Get responsive class for hiding elements below a breakpoint
 */
export const hideBelow = (breakpoint: keyof typeof BREAKPOINTS): string => {
  return `hidden ${breakpoint}:block`;
};

/**
 * Get responsive class for showing elements only below a breakpoint
 */
export const showBelow = (breakpoint: keyof typeof BREAKPOINTS): string => {
  return `${breakpoint}:hidden`;
};

/**
 * Check if viewport matches breakpoint (client-side only)
 */
export const matchesBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
};

export type GridColsKey = keyof typeof GRID_COLS;
export type MaxWidthKey = keyof typeof MAX_WIDTHS;
export type GapKey = keyof typeof GAPS;
export type LayoutRatioKey = keyof typeof LAYOUT_RATIOS;
