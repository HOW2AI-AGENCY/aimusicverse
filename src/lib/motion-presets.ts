/**
 * Motion Presets — Phase 7 UI unification
 *
 * Canonical animation variants for the whole app. Components must use these
 * instead of inlining custom `whileHover` / `initial` / `animate` objects, so
 * timings and easings stay consistent.
 *
 * Durations and easings are aligned with the CSS tokens in `src/index.css`:
 *   --motion-fast (100ms) / --motion-base (200ms) / --motion-slow (300ms)
 *
 * Re-exports the legacy variants defined in `@/lib/motion` so existing code
 * keeps working while new code imports from this file.
 */

import type { Variants, Transition } from '@/lib/motion';
import {
  fadeIn,
  slideUp,
  slideDown,
  slideInFromLeft,
  slideInFromRight,
  scaleIn,
  scaleUp,
  staggerContainer,
  staggerItem,
  shake,
  pulse,
  smoothTransition,
  quickTransition,
  slowTransition,
  bounceTransition,
  MOTION_DURATION,
  MOTION_EASING,
} from '@/lib/motion';

// Canonical preset names used by Phase 7 codemods.
// Aliases mapped to existing variants so we keep one implementation.
export const presets = {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft: slideInFromLeft,
  slideRight: slideInFromRight,
  scaleIn,
  scaleUp,
  shake,
  pulse,
  /** Use on a parent to stagger children that use `staggerItem`. */
  listStagger: staggerContainer,
  /** Use on direct children of a `listStagger` parent. */
  listItem: staggerItem,
} satisfies Record<string, Variants>;

export const transitions = {
  fast: quickTransition,
  base: smoothTransition,
  slow: slowTransition,
  bounce: bounceTransition,
} satisfies Record<string, Transition>;

/** Standard hover/press feedback for interactive surfaces. */
export const interactiveTap = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 25 } as Transition,
} as const;

export { MOTION_DURATION, MOTION_EASING };
