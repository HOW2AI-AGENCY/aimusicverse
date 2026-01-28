/**
 * usePerformanceTracking - Track app performance metrics
 * 
 * Monitors Core Web Vitals and custom performance metrics.
 * Helps identify slow interactions and optimization opportunities.
 */

import { useCallback, useRef, useEffect } from 'react';
import { trackEvent } from '@/services/analytics';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

interface TimerRef {
  name: string;
  startTime: number;
  marks: Array<{ label: string; time: number }>;
}

// Thresholds based on Core Web Vitals
const THRESHOLDS = {
  // Largest Contentful Paint
  LCP: { good: 2500, poor: 4000 },
  // First Input Delay
  FID: { good: 100, poor: 300 },
  // Cumulative Layout Shift
  CLS: { good: 0.1, poor: 0.25 },
  // Time to First Byte
  TTFB: { good: 800, poor: 1800 },
  // Interaction to Next Paint
  INP: { good: 200, poor: 500 },
  // Custom app metrics
  API_CALL: { good: 500, poor: 2000 },
  GENERATION: { good: 30000, poor: 60000 },
  NAVIGATION: { good: 300, poor: 1000 },
};

function getRating(
  name: keyof typeof THRESHOLDS,
  value: number
): PerformanceMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceTracking() {
  const timers = useRef<Map<string, TimerRef>>(new Map());
  const reportedMetrics = useRef<Set<string>>(new Set());

  /**
   * Start a performance timer
   */
  const startTimer = useCallback((name: string) => {
    timers.current.set(name, {
      name,
      startTime: performance.now(),
      marks: [],
    });
  }, []);

  /**
   * Add a mark to an active timer
   */
  const markTimer = useCallback((name: string, label: string) => {
    const timer = timers.current.get(name);
    if (timer) {
      timer.marks.push({
        label,
        time: performance.now() - timer.startTime,
      });
    }
  }, []);

  /**
   * End a timer and get the duration
   */
  const endTimer = useCallback((
    name: string, 
    thresholdType?: keyof typeof THRESHOLDS
  ): PerformanceMetric | null => {
    const timer = timers.current.get(name);
    if (!timer) return null;

    const duration = performance.now() - timer.startTime;
    timers.current.delete(name);

    const metric: PerformanceMetric = {
      name,
      value: Math.round(duration),
      rating: thresholdType ? getRating(thresholdType, duration) : 'good',
    };

    // Report poor performance
    if (metric.rating === 'poor') {
      trackEvent({
        eventType: 'feature_used',
        eventName: `slow_${name}`,
        metadata: {
          duration: metric.value,
          marks: timer.marks,
          isPerformanceIssue: true,
        },
      });
    }

    return metric;
  }, []);

  /**
   * Measure a function's execution time
   */
  const measureAsync = useCallback(async <T>(
    name: string,
    fn: () => Promise<T>,
    thresholdType?: keyof typeof THRESHOLDS
  ): Promise<{ result: T; metric: PerformanceMetric }> => {
    startTimer(name);
    try {
      const result = await fn();
      const metric = endTimer(name, thresholdType);
      return { result, metric: metric! };
    } catch (error) {
      endTimer(name, thresholdType);
      throw error;
    }
  }, [startTimer, endTimer]);

  /**
   * Report a Core Web Vital metric
   */
  const reportWebVital = useCallback((metric: PerformanceMetric) => {
    // Avoid duplicate reports
    const key = `${metric.name}_${metric.navigationType || 'default'}`;
    if (reportedMetrics.current.has(key)) return;
    reportedMetrics.current.add(key);

    // Log in dev
    if (import.meta.env.DEV) {
      const color = metric.rating === 'good' ? 'green' : 
                    metric.rating === 'needs-improvement' ? 'orange' : 'red';
      console.log(
        `%c[WebVital] ${metric.name}: ${metric.value}ms (${metric.rating})`,
        `color: ${color}`
      );
    }

    // Track poor metrics
    if (metric.rating !== 'good') {
      trackEvent({
        eventType: 'feature_used',
        eventName: `web_vital_${metric.name.toLowerCase()}`,
        metadata: {
          value: metric.value,
          rating: metric.rating,
          navigationType: metric.navigationType,
          isPerformanceIssue: true,
        },
      });
    }
  }, []);

  /**
   * Measure navigation timing
   */
  const measureNavigation = useCallback((from: string, to: string) => {
    const timerName = `nav_${from}_to_${to}`;
    return {
      start: () => startTimer(timerName),
      end: () => endTimer(timerName, 'NAVIGATION'),
    };
  }, [startTimer, endTimer]);

  /**
   * Get current memory usage (if available)
   */
  const getMemoryUsage = useCallback(() => {
    // @ts-expect-error - performance.memory is Chrome-only
    const memory = performance.memory;
    if (!memory) return null;

    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
    };
  }, []);

  return {
    startTimer,
    markTimer,
    endTimer,
    measureAsync,
    reportWebVital,
    measureNavigation,
    getMemoryUsage,
  };
}

/**
 * Hook for automatic Core Web Vitals collection
 */
export function useWebVitalsReporter() {
  const { reportWebVital } = usePerformanceTracking();

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically
    import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
      const handleMetric = ({ name, value, rating, navigationType }: any) => {
        reportWebVital({
          name,
          value: Math.round(value),
          rating,
          navigationType,
        });
      };

      onCLS(handleMetric);
      onFID(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    }).catch(() => {
      // web-vitals not available, skip
    });
  }, [reportWebVital]);
}

export default usePerformanceTracking;
