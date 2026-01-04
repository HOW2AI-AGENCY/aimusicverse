/**
 * Performance optimization utilities
 * Bundle size reduction and runtime performance helpers
 */

import { lazy, ComponentType, LazyExoticComponent, Suspense, ReactNode } from 'react';

/**
 * Enhanced lazy loading with retry logic
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        
        // Wait before retry
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    // After all retries failed, throw the last error
    throw lastError;
  });
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): void {
  importFn().catch(() => {
    // Silently fail preload - component will load when needed
  });
}

/**
 * Create a lazy component with preload capability
 */
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> & { preload: () => void } {
  const LazyComponent = lazy(importFn) as LazyExoticComponent<T> & { preload: () => void };
  LazyComponent.preload = () => preloadComponent(importFn);
  return LazyComponent;
}

/**
 * Intersection Observer based lazy loading for components
 */
export function useLazyLoad(
  callback: () => void,
  options: IntersectionObserverInit = {}
): (element: Element | null) => void {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '100px',
    threshold: 0,
    ...options,
  };

  let observer: IntersectionObserver | null = null;

  return (element: Element | null) => {
    if (observer) {
      observer.disconnect();
    }

    if (!element) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          observer?.disconnect();
        }
      });
    }, defaultOptions);

    observer.observe(element);
  };
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Request Idle Callback polyfill with fallback
 */
export const requestIdleCallback =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback) => setTimeout(() => cb({ 
        didTimeout: false, 
        timeRemaining: () => 50 
      } as IdleDeadline), 1);

/**
 * Cancel Idle Callback polyfill
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number) => clearTimeout(id);

/**
 * Run expensive computation during idle time
 */
export function runWhenIdle<T>(
  fn: () => T,
  timeout = 2000
): Promise<T> {
  return new Promise((resolve) => {
    requestIdleCallback(
      () => {
        resolve(fn());
      },
      { timeout }
    );
  });
}

/**
 * Memory-efficient memoization with LRU cache
 */
export function memoizeWithLimit<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    keys.push(key);

    // LRU eviction
    if (keys.length > maxSize) {
      const oldestKey = keys.shift()!;
      cache.delete(oldestKey);
    }

    return result;
  }) as T;
}

/**
 * Chunk array for batch processing
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process items in batches to avoid blocking UI
 */
export async function processBatched<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  batchSize = 10,
  delayBetweenBatches = 0
): Promise<R[]> {
  const chunks = chunkArray(items, batchSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);

    if (delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

/**
 * Virtual scroll helper - calculate visible range
 */
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}

/**
 * Image lazy loading utility
 */
export function createImageLoader(
  src: string,
  options: {
    onLoad?: () => void;
    onError?: (error: Error) => void;
    priority?: boolean;
  } = {}
): HTMLImageElement {
  const img = new Image();

  if (options.priority) {
    img.fetchPriority = 'high';
  }

  img.onload = () => options.onLoad?.();
  img.onerror = () => options.onError?.(new Error(`Failed to load image: ${src}`));
  img.src = src;

  return img;
}

/**
 * Prefetch resources during idle time
 */
export function prefetchResources(urls: string[]): void {
  if (typeof document === 'undefined') return;

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Detect slow network connection
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const connection = (navigator as Navigator & { 
    connection?: { 
      effectiveType?: string;
      saveData?: boolean;
    } 
  }).connection;

  if (!connection) return false;

  // Check for save-data mode or slow connection types
  if (connection.saveData) return true;

  const slowTypes = ['slow-2g', '2g', '3g'];
  return slowTypes.includes(connection.effectiveType || '');
}

/**
 * Adaptive quality based on connection
 */
export function getAdaptiveQuality(): 'low' | 'medium' | 'high' {
  if (isSlowConnection()) return 'low';
  
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as Navigator & { 
      connection?: { effectiveType?: string } 
    }).connection;
    
    if (connection?.effectiveType === '4g') return 'high';
  }

  return 'medium';
}
