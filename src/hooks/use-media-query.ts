/**
 * Responsive design hook for media query matching
 *
 * Per research.md Task 5: Mobile component strategy requires
 * reliable media query detection for responsive components.
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */

import { useEffect, useState } from 'react';

/**
 * Hook to match media queries
 *
 * @param query - CSS media query string
 * @param defaultValue - Default value if SSR (default: false)
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string, defaultValue: boolean = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    // Check if window is available (SSR check)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // Create MediaQueryList
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Define event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Pre-defined breakpoint hooks per Tailwind config
 *
 * Per CLAUDE.md: Tailwind breakpoints
 * - xs: 375px (small phones)
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

/**
 * Match mobile breakpoint (max-width: 767px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Match tablet breakpoint (min-width: 768px and max-width: 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Match desktop breakpoint (min-width: 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Match small phone breakpoint (max-width: 374px)
 */
export function useIsSmallPhone(): boolean {
  return useMediaQuery('(max-width: 374px)');
}

/**
 * Get current breakpoint
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useBreakpoint(): Breakpoint {
  const is2xl = useMediaQuery('(min-width: 1536px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isSm = useMediaQuery('(min-width: 640px)');
  const isXs = useMediaQuery('(min-width: 375px)');

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

/**
 * Match orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  return useMediaQuery('(orientation: landscape)') ? 'landscape' : 'portrait';
}

/**
 * Match reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
