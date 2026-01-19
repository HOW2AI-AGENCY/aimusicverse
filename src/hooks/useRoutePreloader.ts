/**
 * Hook for automatic route preloading
 * Preloads critical routes on app mount
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { preloadCriticalRoutes, preloadRoute } from '@/lib/route-preloader';

// Routes to preload based on current location
const adjacentRoutes: Record<string, string[]> = {
  '/': ['/library', '/projects', '/generate'],
  '/library': ['/', '/projects', '/profile'],
  '/projects': ['/', '/library', '/generate'],
  '/generate': ['/', '/library'],
  '/profile': ['/settings', '/library'],
  '/settings': ['/profile'],
};

/**
 * Hook that preloads routes based on current location
 * Call once at app root level
 */
export function useRoutePreloader(): void {
  const location = useLocation();
  
  // Preload critical routes on mount
  useEffect(() => {
    // Small delay to not block initial render
    const timer = setTimeout(() => {
      preloadCriticalRoutes();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Preload adjacent routes when location changes
  useEffect(() => {
    const adjacent = adjacentRoutes[location.pathname];
    if (adjacent) {
      // Delay preloading to not interfere with current navigation
      const timer = setTimeout(() => {
        adjacent.forEach(path => preloadRoute(path));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);
}

/**
 * Hook for preloading on hover (for navigation links)
 */
export function usePreloadOnHover(path: string): {
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  return {
    onMouseEnter: () => preloadRoute(path),
    onFocus: () => preloadRoute(path),
  };
}
