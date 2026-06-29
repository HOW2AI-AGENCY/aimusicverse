/**
 * useSafeMotion — Reduced Motion Hook
 * Sprint 038-C: Animation Standards
 *
 * Wraps framer-motion's useReducedMotion() and provides a convenience
 * helper to conditionally disable animations for accessibility.
 *
 * Usage:
 *   const { prefersReduced, safeMotion } = useSafeMotion();
 *   const Component = prefersReduced ? "div" : motion.div;
 *   // or
 *   const animate = prefersReduced ? {} : { opacity: 1 };
 */
import { useReducedMotion } from "@/lib/motion";

export function useSafeMotion() {
  const prefersReduced = useReducedMotion() ?? false;

  return {
    /** true when user prefers reduced motion (accessibility) */
    prefersReduced,
    /** Returns the given value OR an empty object if reduced motion is preferred */
    animate: <T extends Record<string, unknown>>(value: T): T | Record<string, never> => (prefersReduced ? {} : value),
    /** Returns `true` if animations should be applied */
    shouldAnimate: !prefersReduced,
  } as const;
}
