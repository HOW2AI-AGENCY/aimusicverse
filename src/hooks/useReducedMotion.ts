/**
 * useReducedMotion - Hook to detect user's motion preference
 * 
 * Respects prefers-reduced-motion media query for accessibility.
 * Use this to disable or simplify animations for users who prefer reduced motion.
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * // Disable animation
 * <motion.div animate={prefersReducedMotion ? {} : { scale: 1.1 }} />
 * 
 * // Or use simpler animation
 * const animationDuration = prefersReducedMotion ? 0 : 0.3;
 * 
 * @example Using useMotionPreference for advanced patterns
 * const { prefersReducedMotion, safeVariants, safeTransition } = useMotionPreference();
 * <motion.div variants={safeVariants(myVariants)} transition={safeTransition(myTransition)} />
 */

import { useState, useEffect, useMemo } from 'react';
import type { Variants, Transition } from '@/lib/motion';

const QUERY = '(prefers-reduced-motion: reduce)';

function getInitialState(): boolean {
  // SSR safety check
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialState);

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers (Safari < 14)
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

// Instant transition for reduced motion
const instantTransition: Transition = { duration: 0 };

// Minimal fade-only variants for reduced motion
const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: instantTransition },
  exit: { opacity: 0, transition: instantTransition },
};

/**
 * Advanced hook for motion preference with helper utilities
 */
export function useMotionPreference() {
  const prefersReducedMotion = useReducedMotion();

  return useMemo(() => ({
    prefersReducedMotion,
    
    /**
     * Returns motion-safe variants
     * Replaces complex animations with simple fade when reduced motion is preferred
     */
    safeVariants: (variants: Variants): Variants => {
      if (!prefersReducedMotion) return variants;
      return reducedMotionVariants;
    },

    /**
     * Returns motion-safe transition
     */
    safeTransition: (transition: Transition): Transition => {
      if (!prefersReducedMotion) return transition;
      return instantTransition;
    },

    /**
     * Get animation duration (0 if reduced motion preferred)
     */
    safeDuration: (duration: number): number => {
      return prefersReducedMotion ? 0 : duration;
    },

    reducedMotionVariants,
    instantTransition,
  }), [prefersReducedMotion]);
}

/**
 * Get motion-safe animation values
 * Returns animation values or empty/instant values based on user preference
 */
export function useMotionSafe<T>(animationValues: T, fallback: T): T {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? fallback : animationValues;
}

/**
 * Get motion-safe duration
 * Returns 0 for users who prefer reduced motion
 */
export function useMotionDuration(duration: number): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : duration;
}

// ============================================================================
// CSS ANIMATION UTILITIES
// ============================================================================

/**
 * CSS classes with built-in reduced motion support
 */
export const safeAnimationClasses = {
  fadeIn: 'animate-fade-in motion-reduce:animate-none motion-reduce:opacity-100',
  fadeOut: 'animate-fade-out motion-reduce:animate-none',
  slideUp: 'animate-slide-up motion-reduce:animate-none motion-reduce:opacity-100',
  slideDown: 'animate-slide-down motion-reduce:animate-none motion-reduce:opacity-100',
  slideLeft: 'animate-slide-left motion-reduce:animate-none motion-reduce:opacity-100',
  slideRight: 'animate-slide-right motion-reduce:animate-none motion-reduce:opacity-100',
  scaleIn: 'animate-scale-in motion-reduce:animate-none motion-reduce:opacity-100',
  spin: 'animate-spin motion-reduce:animate-none',
  pulse: 'animate-pulse-subtle motion-reduce:animate-none',
  shimmer: 'animate-shimmer motion-reduce:animate-none',
} as const;

/**
 * Get CSS stagger delay style
 * Returns empty object for reduced motion users
 */
export function getStaggerStyle(
  index: number,
  prefersReducedMotion: boolean = false,
  baseDelay: number = 50
): React.CSSProperties {
  if (prefersReducedMotion) return {};
  return { animationDelay: `${index * baseDelay}ms` };
}

/**
 * Hook to get stagger delay for CSS animations
 */
export function useStaggerDelay(index: number, baseDelay: number = 50): React.CSSProperties {
  const prefersReducedMotion = useReducedMotion();
  return getStaggerStyle(index, prefersReducedMotion, baseDelay);
}

export default useReducedMotion;
