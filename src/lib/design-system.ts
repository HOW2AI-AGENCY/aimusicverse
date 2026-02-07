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

// Glassmorphism utilities
export * from './glass';

// Interaction utilities
export * from './interactions';

// Theme-aware overlay utilities
export * from './overlay-colors';

// Haptic feedback
export { hapticImpact, hapticNotification, smartHaptic, HAPTIC_GUIDE } from './haptic';

// Contrast utilities for runtime checks
export {
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAAA,
  getAccessibleForeground,
  contrastSafeColors,
} from './contrast-utils';

// Accessibility utilities
export {
  generateA11yId,
  prefersReducedMotion,
  prefersDarkMode,
  announceToScreenReader,
  trapFocus,
  getIconA11yLabel,
  meetsWcagAA,
  meetsWcagAAA,
  handleKeyboardNavigation,
  useLiveAnnounce,
  usePrefersReducedMotion,
  useFocusTrap,
  useRovingFocus,
  useFocusVisible,
  focusRingClasses,
} from './a11y-utils';

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

export type { KeyboardHandlers } from './a11y-utils';
