/**
 * Route preloading utilities for faster navigation
 * Preloads route components on hover/focus
 */

// Map of routes to their lazy import functions
const routeImporters: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/library': () => import('@/pages/Library'),
  '/projects': () => import('@/pages/Projects'),
  '/generate': () => import('@/pages/Generate'),
  '/profile': () => import('@/pages/ProfilePage'),
  '/settings': () => import('@/pages/Settings'),
  '/playlists': () => import('@/pages/Playlists'),
  '/artists': () => import('@/pages/Artists'),
  '/templates': () => import('@/pages/Templates'),
  '/rewards': () => import('@/pages/Rewards'),
  '/analytics': () => import('@/pages/Analytics'),
  '/guitar-studio': () => import('@/pages/GuitarStudio'),
  '/music-lab': () => import('@/pages/MusicLab'),
  '/community': () => import('@/pages/Community'),
  '/blog': () => import('@/pages/Blog'),
};

// Track which routes have been preloaded
const preloadedRoutes = new Set<string>();

/**
 * Preload a route component by path
 */
export function preloadRoute(path: string): void {
  // Skip if already preloaded
  if (preloadedRoutes.has(path)) return;
  
  const importer = routeImporters[path];
  if (importer) {
    preloadedRoutes.add(path);
    // Use requestIdleCallback for non-blocking preload
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importer(), { timeout: 3000 });
    } else {
      setTimeout(() => importer(), 100);
    }
  }
}

/**
 * Preload multiple routes
 */
export function preloadRoutes(paths: string[]): void {
  paths.forEach(preloadRoute);
}

/**
 * Preload critical routes after initial load
 */
export function preloadCriticalRoutes(): void {
  // Wait for initial render, then preload common routes
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadRoutes(['/', '/library', '/projects', '/generate']);
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      preloadRoutes(['/', '/library', '/projects', '/generate']);
    }, 2000);
  }
}
