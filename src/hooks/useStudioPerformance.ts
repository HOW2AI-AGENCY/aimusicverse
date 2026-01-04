/**
 * useStudioPerformance - Performance monitoring and optimization for studio
 * Tracks memory usage, render counts, and provides optimization utilities
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsageMB: number | null;
}

interface UseStudioPerformanceResult {
  metrics: PerformanceMetrics;
  trackRender: () => void;
  logMetrics: () => void;
  isMemoryWarning: boolean;
}

const MEMORY_WARNING_THRESHOLD_MB = 150;
const MAX_RENDER_SAMPLES = 10;

export function useStudioPerformance(componentName: string): UseStudioPerformanceResult {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderStart = useRef<number>(0);

  // Track render start
  const trackRender = useCallback(() => {
    lastRenderStart.current = performance.now();
  }, []);

  // Measure render completion
  useEffect(() => {
    if (lastRenderStart.current > 0) {
      const renderTime = performance.now() - lastRenderStart.current;
      renderTimes.current.push(renderTime);
      
      // Keep only last N samples
      if (renderTimes.current.length > MAX_RENDER_SAMPLES) {
        renderTimes.current.shift();
      }
      
      renderCount.current++;
    }
  });

  // Get memory usage (when available)
  const getMemoryUsage = useCallback((): number | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory?.usedJSHeapSize) {
        return Math.round(memory.usedJSHeapSize / (1024 * 1024));
      }
    }
    return null;
  }, []);

  // Calculate average render time
  const averageRenderTime = useMemo(() => {
    if (renderTimes.current.length === 0) return 0;
    const sum = renderTimes.current.reduce((a, b) => a + b, 0);
    return sum / renderTimes.current.length;
  }, [renderCount.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const memoryUsageMB = getMemoryUsage();
  const isMemoryWarning = memoryUsageMB !== null && memoryUsageMB > MEMORY_WARNING_THRESHOLD_MB;

  // Log warning if memory is high
  useEffect(() => {
    if (isMemoryWarning) {
      logger.warn(`[${componentName}] High memory usage: ${memoryUsageMB}MB`, { 
        threshold: MEMORY_WARNING_THRESHOLD_MB 
      });
    }
  }, [isMemoryWarning, memoryUsageMB, componentName]);

  const logMetrics = useCallback(() => {
    logger.debug(`[${componentName}] Performance metrics`, {
      renderCount: renderCount.current,
      averageRenderTime: `${averageRenderTime.toFixed(2)}ms`,
      memoryUsageMB,
    });
  }, [componentName, averageRenderTime, memoryUsageMB]);

  const metrics: PerformanceMetrics = {
    renderCount: renderCount.current,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
    averageRenderTime,
    memoryUsageMB,
  };

  return {
    metrics,
    trackRender,
    logMetrics,
    isMemoryWarning,
  };
}

/**
 * useThrottledCallback - Throttle a callback to prevent excessive calls
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  const lastCall = useRef<number>(0);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastResult = useRef<ReturnType<T> | undefined>(undefined);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      lastResult.current = callback(...args);
      return lastResult.current;
    } else {
      // Schedule for later
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      timeoutId.current = setTimeout(() => {
        lastCall.current = Date.now();
        lastResult.current = callback(...args);
      }, delay - (now - lastCall.current));
      return undefined;
    }
  }, [callback, delay]);
}

/**
 * useDeferredValue - Similar to React 18's useDeferredValue but with custom delay
 */
export function useCustomDeferredValue<T>(value: T, delay: number = 100): T {
  const deferredValue = useRef<T>(value);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    
    timeoutId.current = setTimeout(() => {
      deferredValue.current = value;
    }, delay);

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [value, delay]);

  return deferredValue.current;
}
