/**
 * Design System Exports
 * Feature: 032-professional-ui
 * 
 * Central export for all design system utilities
 */

// Design tokens (numeric values and utility functions)
export * from './design-tokens';

// Semantic color utilities
export * from './design-colors';

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
} from '@/styles/style-utils';

// Type exports
export type {
  TextStyle,
  AnimationStyle,
  TouchTargetStyle,
  FocusStyle,
  CardStyle,
} from '@/styles/style-utils';
