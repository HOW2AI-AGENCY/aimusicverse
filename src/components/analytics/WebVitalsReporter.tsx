/**
 * WebVitalsReporter Component
 * 
 * Automatically reports Core Web Vitals metrics to analytics.
 * Should be mounted once at the app root level.
 */

import { useEffect, memo } from 'react';
import { usePerformanceTracking, type PerformanceMetric } from '@/hooks/analytics';
import { logger } from '@/lib/logger';

interface WebVitalsReporterProps {
  /** Enable verbose logging in development */
  debug?: boolean;
  /** Custom handler for metrics (in addition to default analytics) */
  onMetric?: (metric: PerformanceMetric) => void;
}

/**
 * Component that collects and reports Web Vitals metrics.
 * Mounts invisibly and tracks performance automatically.
 */
export const WebVitalsReporter = memo(function WebVitalsReporter({
  debug = false,
  onMetric,
}: WebVitalsReporterProps) {
  // Use the performance tracking hook for reporting
  const { reportWebVital } = usePerformanceTracking();

  // Set up Web Vitals collection
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically
    import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
      const handleMetric = ({ name, value, rating, navigationType }: any) => {
        const metric: PerformanceMetric = {
          name,
          value: Math.round(value),
          rating,
          navigationType,
        };

        // Report to analytics
        reportWebVital(metric);

        // Log in debug mode
        if (debug && import.meta.env.DEV) {
          logger.debug(`Web Vital: ${name}`, { value: metric.value, rating: metric.rating });
        }

        // Call custom handler
        if (onMetric) {
          onMetric(metric);
        }
      };

      onCLS(handleMetric);
      onFID(handleMetric);
      onLCP(handleMetric);
      onTTFB(handleMetric);
      onINP(handleMetric);
    }).catch(() => {
      // web-vitals not available, skip
    });
  }, [reportWebVital, debug, onMetric]);

  // This component renders nothing
  return null;
});

export default WebVitalsReporter;
