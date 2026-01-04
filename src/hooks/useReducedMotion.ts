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
 */

import { useState, useEffect } from 'react';

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

export default useReducedMotion;
