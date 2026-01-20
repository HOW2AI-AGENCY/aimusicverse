/**
 * Route preloading utilities for faster navigation
 * Preloads route components on hover/focus with priority system
 */

// Priority levels for route preloading
type Priority = 'critical' | 'high' | 'normal' | 'low';

interface RouteConfig {
  importer: () => Promise<unknown>;
  priority: Priority;
}

// Map of routes to their lazy import functions with priority
const routeConfigs: Record<string, RouteConfig> = {
  // Critical - preload immediately after mount
  '/': { importer: () => import('@/pages/Index'), priority: 'critical' },
  '/library': { importer: () => import('@/pages/Library'), priority: 'critical' },

  // High - preload during idle time (common navigation)
  '/projects': { importer: () => import('@/pages/Projects'), priority: 'high' },
  // '/generate' removed - redirect handled by GenerateRedirect in App.tsx
  '/profile': { importer: () => import('@/pages/ProfilePage'), priority: 'high' },
  
  // Normal - preload on hover or when approaching
  '/settings': { importer: () => import('@/pages/Settings'), priority: 'normal' },
  '/playlists': { importer: () => import('@/pages/Playlists'), priority: 'normal' },
  '/artists': { importer: () => import('@/pages/Artists'), priority: 'normal' },
  '/community': { importer: () => import('@/pages/Community'), priority: 'normal' },
  '/rewards': { importer: () => import('@/pages/Rewards'), priority: 'normal' },
  
  // Low - only preload on hover
  '/templates': { importer: () => import('@/pages/Templates'), priority: 'low' },
  '/analytics': { importer: () => import('@/pages/Analytics'), priority: 'low' },
  '/guitar-studio': { importer: () => import('@/pages/GuitarStudio'), priority: 'low' },
  '/music-lab': { importer: () => import('@/pages/MusicLab'), priority: 'low' },
  '/blog': { importer: () => import('@/pages/Blog'), priority: 'low' },
};

// Track which routes have been preloaded
const preloadedRoutes = new Set<string>();
let preloadQueue: string[] = [];
let isProcessingQueue = false;

/**
 * Process preload queue in batches during idle time
 */
function processQueue(): void {
  if (isProcessingQueue || preloadQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  const processNext = () => {
    if (preloadQueue.length === 0) {
      isProcessingQueue = false;
      return;
    }
    
    const path = preloadQueue.shift()!;
    const config = routeConfigs[path];
    
    if (config && !preloadedRoutes.has(path)) {
      preloadedRoutes.add(path);
      config.importer().catch(() => {
        // Silently fail - component will load when needed
      });
    }
    
    // Continue processing with small delay to not block main thread
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processNext, { timeout: 1000 });
    } else {
      setTimeout(processNext, 50);
    }
  };
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(processNext, { timeout: 2000 });
  } else {
    setTimeout(processNext, 100);
  }
}

/**
 * Preload a route component by path (queued)
 */
export function preloadRoute(path: string): void {
  if (preloadedRoutes.has(path) || preloadQueue.includes(path)) return;
  
  const config = routeConfigs[path];
  if (!config) return;
  
  // Critical routes load immediately
  if (config.priority === 'critical') {
    preloadedRoutes.add(path);
    config.importer().catch(() => {});
    return;
  }
  
  // High priority goes to front of queue
  if (config.priority === 'high') {
    preloadQueue.unshift(path);
  } else {
    preloadQueue.push(path);
  }
  
  processQueue();
}

/**
 * Preload multiple routes
 */
export function preloadRoutes(paths: string[]): void {
  paths.forEach(preloadRoute);
}

/**
 * Preload critical routes immediately after initial load
 */
export function preloadCriticalRoutes(): void {
  // Immediate preload of most critical routes
  const criticalPaths = Object.entries(routeConfigs)
    .filter(([, config]) => config.priority === 'critical')
    .map(([path]) => path);
  
  criticalPaths.forEach(path => {
    preloadedRoutes.add(path);
    routeConfigs[path].importer().catch(() => {});
  });
  
  // Queue high priority routes for idle time
  const highPriorityPaths = Object.entries(routeConfigs)
    .filter(([, config]) => config.priority === 'high')
    .map(([path]) => path);
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadRoutes(highPriorityPaths);
    }, { timeout: 3000 });
  } else {
    setTimeout(() => {
      preloadRoutes(highPriorityPaths);
    }, 1500);
  }
}

/**
 * Preload route on link hover (for Link components)
 */
export function preloadOnHover(path: string): () => void {
  let timeoutId: number | undefined;
  
  return () => {
    // Small delay to avoid preloading on quick mouse movements
    timeoutId = window.setTimeout(() => {
      preloadRoute(path);
    }, 100);
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  };
}

/**
 * Check if route is preloaded
 */
export function isRoutePreloaded(path: string): boolean {
  return preloadedRoutes.has(path);
}
