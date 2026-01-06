/**
 * Dynamic import utilities for code splitting
 *
 * Per constitution Principle IX (Screen Development Patterns):
 * - Route-level code splitting mandatory
 * - Lazy loading for heavy components
 *
 * @example
 * ```tsx
 * // Lazy load a component
 * const HeavyComponent = lazyLoad(() => import('./HeavyComponent'));
 *
 * // With error handling
 * const HeavyComponent = lazyLoad(
 *   () => import('./HeavyComponent'),
 *   { fallback: <Loading /> }
 * );
 * ```
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { logger } from '@/lib/logger';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Lazily load a component with error handling
 *
 * @param importFn - Function that returns a dynamic import
 * @param options - Optional configuration
 * @returns Lazy-loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const { onError } = options;

  return lazy(() => {
    return importFn().catch((error) => {
      logger.error('Failed to load lazy component', { error: error.message });

      if (onError) {
        onError(error);
      }

      // Re-throw to let React's error boundary handle it
      throw error;
    });
  });
}

/**
 * Create a lazy-loaded route component
 *
 * @example
 * ```tsx
 * const StudioPage = createLazyRoute(() => import('./pages/studio-v2/UnifiedStudioPage'));
 * ```
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazyLoad(importFn, {
    onError: (error) => {
      logger.error('Failed to load route', { error: error.message });
    },
  });
}

/**
 * Lazily load a library with timeout protection
 *
 * @example
 * ```tsx
 * const WaveSurfer = await lazyLibrary(() => import('wavesurfer.js'), 5000);
 * ```
 */
export async function lazyLibrary<T>(
  importFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    importFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Library load timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Batch lazy loading for multiple components
 *
 * @example
 * ```tsx
 * const [ComponentA, ComponentB, ComponentC] = await batchLoad([
 *   () => import('./ComponentA'),
 *   () => import('./ComponentB'),
 *   () => import('./ComponentC'),
 * ]);
 * ```
 */
export async function batchLoad<T>(importFns: Array<() => Promise<T>>): Promise<T[]> {
  return Promise.all(importFns.map((fn) => fn()));
}
