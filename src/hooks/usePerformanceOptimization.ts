import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface UseReducedMotionReturn {
  prefersReducedMotion: boolean;
  shouldAnimate: boolean;
}

/**
 * Hook to detect if user prefers reduced motion
 * and provide animation control based on device capability
 */
export function useReducedMotion(): UseReducedMotionReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine if animations should run based on device performance
  const shouldAnimate = !prefersReducedMotion;

  return { prefersReducedMotion, shouldAnimate };
}

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading elements when they enter viewport
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefCallback<HTMLElement>, boolean] {
  const { threshold = 0, rootMargin = '50px', triggerOnce = true } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, threshold, rootMargin, triggerOnce]);

  return [ref, isIntersecting];
}

/**
 * Hook for prefetching data on hover/focus
 */
export function usePrefetch<T>(
  fetchFn: () => Promise<T>,
  enabled: boolean = true
): { prefetch: () => void; data: T | null } {
  const [data, setData] = useState<T | null>(null);
  const [hasPrefetched, setHasPrefetched] = useState(false);

  const prefetch = useCallback(() => {
    if (!enabled || hasPrefetched) return;
    
    setHasPrefetched(true);
    fetchFn().then(setData).catch(() => setHasPrefetched(false));
  }, [enabled, hasPrefetched, fetchFn]);

  return { prefetch, data };
}

/**
 * Debounced resize observer for performance
 */
export function useResizeObserver(
  callback: (entry: ResizeObserverEntry) => void,
  debounceMs: number = 100
): React.RefCallback<HTMLElement> {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!element) return;

    let timeoutId: NodeJS.Timeout;
    
    const observer = new ResizeObserver(([entry]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(entry), debounceMs);
    });

    observer.observe(element);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [element, callback, debounceMs]);

  return useCallback((node: HTMLElement | null) => setElement(node), []);
}

/**
 * Simple performance monitor for development
 */
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // More than one frame (60fps)
        logger.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`, {
          componentName,
          renderTimeMs: renderTime
        });
      }
    };
  });
}

/**
 * Hook for image lazy loading with blur placeholder
 */
export function useLazyImage(
  src: string | undefined,
  options: { threshold?: number; rootMargin?: string } = {}
): { imgRef: React.RefCallback<HTMLImageElement>; isLoaded: boolean; shouldLoad: boolean } {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgRef, shouldLoad] = useIntersectionObserver({
    threshold: options.threshold ?? 0,
    rootMargin: options.rootMargin ?? '100px',
    triggerOnce: true,
  });

  useEffect(() => {
    if (shouldLoad && src) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = src;
    }
  }, [shouldLoad, src]);

  return { 
    imgRef: imgRef as React.RefCallback<HTMLImageElement>, 
    isLoaded, 
    shouldLoad 
  };
}

/**
 * Hook for batching state updates to reduce re-renders
 */
export function useBatchedUpdates<T extends Record<string, unknown>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);

  const batchUpdate = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, batchUpdate];
}

/**
 * Hook for throttling values - useful for scroll/resize handlers
 */
export function useThrottledValue<T>(value: T, limitMs: number = 100): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limitMs) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limitMs - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limitMs]);

  return throttledValue;
}
