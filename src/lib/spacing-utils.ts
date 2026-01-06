/**
 * Spacing Utilities
 * Feature: 032-professional-ui
 *
 * Helper functions for consistent spacing using the design system.
 * Provides TypeScript utilities for calculating layout spacing.
 */

import { spacing } from './design-tokens';

// Spacing scale values (in pixels)
export const SPACING_SCALE = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 12,   // 0.75rem
  lg: 16,   // 1rem
  xl: 24,   // 1.5rem
  '2xl': 32, // 2rem
} as const;

export type SpacingValue = keyof typeof SPACING_SCALE;

/**
 * Get spacing value in pixels
 *
 * Usage:
 *   getSpacingValue('lg') // 16
 */
export const getSpacingValue = (size: SpacingValue): number => {
  return SPACING_SCALE[size];
};

/**
 * Get spacing value in rem
 *
 * Usage:
 *   getSpacingRem('lg') // '1rem'
 */
export const getSpacingRem = (size: SpacingValue): string => {
  const px = SPACING_SCALE[size];
  return `${px / 16}rem`;
};

/**
 * Calculate gap between elements
 *
 * Usage:
 *   getGapClass('sm') // 'gap-2'
 */
export const getGapClass = (size: SpacingValue): string => {
  const gapMap = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
    '2xl': 'gap-8',
  };
  return gapMap[size];
};

/**
 * Calculate padding for container
 *
 * Usage:
 *   getPaddingClass('md') // 'p-3'
 */
export const getPaddingClass = (size: SpacingValue, all?: boolean): string => {
  const paddingMap = {
    xs: all ? 'p-1' : 'p-1',
    sm: all ? 'p-2' : 'p-2',
    md: all ? 'p-3' : 'p-3',
    lg: all ? 'p-4' : 'p-4',
    xl: all ? 'p-6' : 'p-6',
    '2xl': all ? 'p-8' : 'p-8',
  };
  return paddingMap[size];
};

/**
 * Calculate vertical spacing (margin-top/bottom)
 *
 * Usage:
 *   getVerticalSpacingClass('lg') // 'my-4'
 */
export const getVerticalSpacingClass = (size: SpacingValue): string => {
  const spacingMap = {
    xs: 'my-1',
    sm: 'my-2',
    md: 'my-3',
    lg: 'my-4',
    xl: 'my-6',
    '2xl': 'my-8',
  };
  return spacingMap[size];
};

/**
 * Calculate horizontal spacing (margin-left/right)
 *
 * Usage:
 *   getHorizontalSpacingClass('lg') // 'mx-4'
 */
export const getHorizontalSpacingClass = (size: SpacingValue): string => {
  const spacingMap = {
    xs: 'mx-1',
    sm: 'mx-2',
    md: 'mx-3',
    lg: 'mx-4',
    xl: 'mx-6',
    '2xl': 'mx-8',
  };
  return spacingMap[size];
};

/**
 * Stack spacing for vertical layouts
 *
 * Usage:
 *   <div className={getStackClass('lg')}>...</div>
 */
export const getStackClass = (size: SpacingValue): string => {
  const stackMap = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
    xl: 'space-y-6',
    '2xl': 'space-y-8',
  };
  return stackMap[size];
};

/**
 * Inline spacing for horizontal layouts
 *
 * Usage:
 *   <div className={getInlineClass('lg')}>...</div>
 */
export const getInlineClass = (size: SpacingValue): string => {
  const inlineMap = {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-3',
    lg: 'space-x-4',
    xl: 'space-x-6',
    '2xl': 'space-x-8',
  };
  return inlineMap[size];
};

/**
 * Safe area padding for notches/islands
 *
 * Usage:
 *   <div className={getSafeAreaClass('bottom')}>...</div>
 */
export const getSafeAreaClass = (edge: 'top' | 'bottom' | 'left' | 'right' | 'all'): string => {
  const safeAreaMap = {
    top: 'safe-top',
    bottom: 'safe-bottom',
    left: 'safe-left',
    right: 'safe-right',
    all: 'safe',
  };
  return safeAreaMap[edge];
};

/**
 * Calculate touch target spacing (8px minimum between interactive elements)
 *
 * Usage:
 *   getTouchTargetSpacingClass() // 'gap-2'
 */
export const getTouchTargetSpacingClass = (): string => {
  return 'gap-2'; // 8px minimum
};

export default {
  getSpacingValue,
  getSpacingRem,
  getGapClass,
  getPaddingClass,
  getVerticalSpacingClass,
  getHorizontalSpacingClass,
  getStackClass,
  getInlineClass,
  getSafeAreaClass,
  getTouchTargetSpacingClass,
};
