/**
 * Design System Exports
 * Feature: 032-professional-ui
 * 
 * Central export for all design system utilities
 * WCAG AA compliant color system
 */

// Design tokens (numeric values and utility functions)
export * from './design-tokens';

// Semantic color utilities
export * from './design-colors';

// Contrast utilities for runtime checks
export {
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAAA,
  getAccessibleForeground,
  contrastSafeColors,
} from './contrast-utils';

// Style utilities (CSS class generators)
export {
  textStyles,
  getTextStyle,
  animationStyles,
  getAnimation,
  touchTargetStyles,
  getTouchTarget,
  focusStyles,
  colorStyles,
  bgColorStyles,
  gradientStyles,
  spacingStyles,
  cardStyles,
  loadingStyles,
  interactiveStyles,
  elevationStyles,
  getElevation,
  radiusStyles,
  getInteractiveClasses,
} from '@/styles/style-utils';

// Type exports
export type {
  TextStyle,
  AnimationStyle,
  TouchTargetStyle,
  FocusStyle,
  CardStyle,
  ElevationLevel,
  RadiusStyle,
  InteractiveStyle,
} from '@/styles/style-utils';
