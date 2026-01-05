/**
 * Accessibility utilities and hooks
 *
 * Provides utilities for respecting user accessibility preferences,
 * particularly motion preferences per constitution Principle VII.
 */

import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 *
 * Per constitution Principle VII (Accessibility & UX Standards):
 * - Must respect prefers-reduced-motion setting
 * - Disabled animations for users who prefer reduced motion
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 *
 * <motion.div
 *   animate={!prefersReducedMotion ? { opacity: 1 } : {}}
 * />
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial value
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation config based on reduced motion preference
 *
 * @example
 * ```tsx
 * const animation = useReducedMotionConfig({
 *   normal: { opacity: 1, y: 0 },
 *   reduced: { opacity: 1 },
 * });
 *
 * <motion.div animate={animation} />
 * ```
 */
export function useReducedMotionConfig<T extends Record<string, any>>(
  config: {
    normal: T;
    reduced?: T;
  }
): T {
  const prefersReduced = usePrefersReducedMotion();

  return (prefersReduced && config.reduced ? config.reduced : config.normal) as T;
}
