/**
 * Performance Utility Functions
 * 
 * Provides performance optimization utilities for the music player:
 * - Debouncing and throttling
 * - Memory management helpers
 * - Performance monitoring
 * - Resource cleanup utilities
 * 
 * @module performance-utils
 */

/**
 * Debounce function - delays function execution until after wait time has elapsed
 * since the last call. Useful for expensive operations triggered frequently.
 * 
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before executing
 * @returns Debounced function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query) => searchAPI(query), 300);
 * // Will only call searchAPI 300ms after user stops typing
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period.
 * Useful for rate-limiting expensive operations.
 * 
 * @param func - Function to throttle
 * @param limit - Minimum milliseconds between calls
 * @returns Throttled function
 * 
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => updateScrollPosition(), 100);
 * // Will only call updateScrollPosition at most once per 100ms
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;

  return function throttled(...args: Parameters<T>): void {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Debounce for React refs - special debounce that works with React refs
 * 
 * @param callback - Callback function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced callback with cleanup
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [(...args: Parameters<T>) => void, () => void] {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedCallback = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return [debouncedCallback, cleanup];
}

/**
 * Create a memoized function that caches results based on arguments
 * Useful for expensive computations with repeated inputs
 * 
 * @param fn - Function to memoize
 * @param getCacheKey - Optional function to generate cache key from arguments
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getCacheKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = getCacheKey ? getCacheKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  } as T;
}

/**
 * Performance marker utility - measures execution time of operations
 * 
 * @example
 * ```typescript
 * const measure = markPerformance('audio-load');
 * await loadAudio();
 * const duration = measure.end();
 * console.log('Audio loaded in', duration, 'ms');
 * ```
 */
export function markPerformance(markName: string) {
  const startMark = `${markName}-start`;
  const endMark = `${markName}-end`;
  const measureName = markName;

  performance.mark(startMark);

  return {
    /**
     * End the performance measurement
     * @returns Duration in milliseconds
     */
    end: (): number => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);

      const measure = performance.getEntriesByName(measureName)[0];
      const duration = measure ? measure.duration : 0;

      // Cleanup marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);

      return duration;
    },

    /**
     * Cancel the measurement without recording
     */
    cancel: (): void => {
      performance.clearMarks(startMark);
    },
  };
}

/**
 * Batch updates to prevent multiple rapid state changes
 * Collects multiple calls and executes once at the end
 * 
 * @param callback - Function to batch
 * @param delay - Milliseconds to wait before executing
 * @returns Batched function
 */
export function batchUpdates<T>(
  callback: (updates: T[]) => void,
  delay: number = 16
): (update: T) => void {
  let updates: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  return (update: T) => {
    updates.push(update);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(updates);
      updates = [];
      timeoutId = null;
    }, delay);
  };
}

/**
 * Request idle callback wrapper with fallback for unsupported browsers
 * 
 * @param callback - Function to execute when idle
 * @param options - Idle callback options
 * @returns Cancel function
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, options);
    return () => window.cancelIdleCallback(id);
  } else {
    // Fallback for Safari and older browsers
    const id = setTimeout(callback, 1);
    return () => clearTimeout(id);
  }
}

/**
 * Preload audio file into browser cache
 * Useful for preloading next track in queue
 * 
 * @param url - Audio URL to preload
 * @returns Promise that resolves when loaded or rejects on error
 */
export function preloadAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';

    audio.addEventListener('canplaythrough', () => {
      resolve();
    }, { once: true });

    audio.addEventListener('error', (e) => {
      reject(new Error(`Failed to preload audio: ${url}`));
    }, { once: true });

    audio.src = url;
    audio.load();
  });
}

/**
 * Estimate memory usage of object (rough estimation)
 * Useful for monitoring queue size
 * 
 * @param obj - Object to measure
 * @returns Estimated size in bytes
 */
export function estimateMemorySize(obj: any): number {
  const str = JSON.stringify(obj);
  // Rough estimation: 2 bytes per character in UTF-16
  return str.length * 2;
}

/**
 * Format bytes to human-readable string
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if audio format is supported by browser
 * 
 * @param mimeType - MIME type to check (e.g., 'audio/mpeg')
 * @returns True if supported
 */
export function isAudioFormatSupported(mimeType: string): boolean {
  const audio = new Audio();
  const support = audio.canPlayType(mimeType);
  return support === 'probably' || support === 'maybe';
}

/**
 * Network Information API type definitions
 */
interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Get optimal audio quality based on network connection
 * 
 * @returns Recommended quality ('high' | 'medium' | 'low')
 */
export function getOptimalAudioQuality(): 'high' | 'medium' | 'low' {
  // Check Network Information API support with proper typing
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection || !connection.effectiveType) {
    return 'medium'; // Default if API not available
  }

  const effectiveType = connection.effectiveType;

  switch (effectiveType) {
    case '4g':
      return 'high';
    case '3g':
      return 'medium';
    case '2g':
    case 'slow-2g':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Performance Memory API type definitions (Chrome-specific)
 */
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Monitor memory usage and warn if threshold exceeded
 * 
 * @param thresholdMB - Threshold in megabytes
 * @param callback - Function to call when threshold exceeded
 * @returns Cleanup function
 */
export function monitorMemoryUsage(
  thresholdMB: number,
  callback: (usage: number) => void
): () => void {
  const perf = performance as PerformanceWithMemory;
  
  // Check if performance.memory is available (Chrome only)
  if (!perf.memory) {
    console.warn('Memory monitoring not available in this browser');
    return () => {};
  }

  const check = () => {
    if (!perf.memory) return;
    const usedMB = perf.memory.usedJSHeapSize / 1024 / 1024;

    if (usedMB > thresholdMB) {
      callback(usedMB);
    }
  };

  const intervalId = setInterval(check, 5000); // Check every 5 seconds

  return () => clearInterval(intervalId);
}

/**
 * Calculate queue memory usage
 * 
 * @param queue - Array of tracks
 * @returns Memory usage statistics
 */
export function calculateQueueMemory(queue: any[]) {
  const totalSize = estimateMemorySize(queue);
  const avgTrackSize = queue.length > 0 ? totalSize / queue.length : 0;

  return {
    totalBytes: totalSize,
    totalFormatted: formatBytes(totalSize),
    averageTrackBytes: avgTrackSize,
    averageTrackFormatted: formatBytes(avgTrackSize),
    trackCount: queue.length,
  };
}
