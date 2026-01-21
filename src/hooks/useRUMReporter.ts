/**
 * Real User Monitoring Reporter Hook
 * Collects and reports Core Web Vitals to the backend
 * 
 * Uses web-vitals library for accurate metric collection
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface RUMMetrics {
  session_id: string;
  page_path: string;
  lcp_ms?: number;
  fid_ms?: number;
  cls?: number;
  fcp_ms?: number;
  ttfb_ms?: number;
  inp_ms?: number;
  device_type: 'mobile' | 'tablet' | 'desktop';
  connection_type?: string;
  viewport_width: number;
  viewport_height: number;
  user_agent: string;
}

// Get or create session ID
function getSessionId(): string {
  const key = 'rum_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// Detect device type
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Get connection type if available
function getConnectionType(): string | undefined {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  return nav.connection?.effectiveType;
}

// Store for accumulated metrics
const metricsStore: Partial<RUMMetrics> = {};

/**
 * Hook to enable Real User Monitoring
 * Call once at app root level
 */
export function useRUMReporter(): void {
  const location = useLocation();
  const reportedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send metrics to backend
  const sendMetrics = useCallback(async () => {
    const metricKeys = Object.keys(metricsStore);
    if (metricKeys.length === 0) return;

    const metrics: RUMMetrics = {
      session_id: getSessionId(),
      page_path: location.pathname,
      device_type: getDeviceType(),
      connection_type: getConnectionType(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      user_agent: navigator.userAgent,
      ...metricsStore,
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rum-collector`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(metrics),
        }
      );

      if (!response.ok) {
        throw new Error(`RUM report failed: ${response.status}`);
      }

      logger.debug('RUM metrics sent', { path: metrics.page_path });
      
      // Clear accumulated metrics after successful send
      (Object.keys(metricsStore) as (keyof RUMMetrics)[]).forEach(key => {
        delete metricsStore[key];
      });
    } catch (error) {
      logger.warn('Failed to send RUM metrics', error instanceof Error ? { message: error.message } : undefined);
    }
  }, [location.pathname]);

  // Initialize web-vitals collection
  useEffect(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;

    // Dynamically import web-vitals to keep bundle size down
    import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB, onINP }) => {
      // Largest Contentful Paint
      onLCP((metric) => {
        metricsStore.lcp_ms = metric.value;
        logger.debug('LCP collected', { value: metric.value });
      });

      // First Input Delay
      onFID((metric) => {
        metricsStore.fid_ms = metric.value;
        logger.debug('FID collected', { value: metric.value });
      });

      // Cumulative Layout Shift
      onCLS((metric) => {
        metricsStore.cls = metric.value;
        logger.debug('CLS collected', { value: metric.value });
      });

      // First Contentful Paint
      onFCP((metric) => {
        metricsStore.fcp_ms = metric.value;
        logger.debug('FCP collected', { value: metric.value });
      });

      // Time to First Byte
      onTTFB((metric) => {
        metricsStore.ttfb_ms = metric.value;
        logger.debug('TTFB collected', { value: metric.value });
      });

      // Interaction to Next Paint
      onINP((metric) => {
        metricsStore.inp_ms = metric.value;
        logger.debug('INP collected', { value: metric.value });
      });
    }).catch(err => {
      logger.warn('Failed to load web-vitals', err);
    });

    // Send metrics after 30 seconds of page load
    timeoutRef.current = setTimeout(() => {
      sendMetrics();
    }, 30000);

    // Also send on page unload
    const handleUnload = () => {
      // Use sendBeacon for reliable delivery on unload
      if (Object.keys(metricsStore).length > 0) {
        const metrics: RUMMetrics = {
          session_id: getSessionId(),
          page_path: location.pathname,
          device_type: getDeviceType(),
          connection_type: getConnectionType(),
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          user_agent: navigator.userAgent,
          ...metricsStore,
        };

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rum-collector`;
        const blob = new Blob([JSON.stringify(metrics)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sendMetrics, location.pathname]);
}

/**
 * Get RUM metrics summary for admin dashboard
 */
export async function fetchRUMMetricsSummary(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<{
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  avgFCP: number;
  avgTTFB: number;
  avgINP: number;
  totalSessions: number;
  deviceBreakdown: Record<string, number>;
}> {
  const intervals: Record<string, string> = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };

  const interval = intervals[timeRange];
  const cutoff = new Date();
  cutoff.setTime(cutoff.getTime() - parseInterval(interval));

  const { data, error } = await supabase
    .from('rum_metrics')
    .select('lcp_ms, fid_ms, cls, fcp_ms, ttfb_ms, inp_ms, device_type, session_id')
    .gte('created_at', cutoff.toISOString());

  if (error) {
    logger.error('Failed to fetch RUM metrics', error);
    throw error;
  }

  const metrics = data || [];
  const uniqueSessions = new Set(metrics.map(m => m.session_id)).size;
  
  const deviceBreakdown: Record<string, number> = {};
  metrics.forEach(m => {
    const device = m.device_type || 'unknown';
    deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
  });

  return {
    avgLCP: average(metrics.map(m => m.lcp_ms)),
    avgFID: average(metrics.map(m => m.fid_ms)),
    avgCLS: average(metrics.map(m => m.cls)),
    avgFCP: average(metrics.map(m => m.fcp_ms)),
    avgTTFB: average(metrics.map(m => m.ttfb_ms)),
    avgINP: average(metrics.map(m => m.inp_ms)),
    totalSessions: uniqueSessions,
    deviceBreakdown,
  };
}

function average(values: (number | null)[]): number {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function parseInterval(interval: string): number {
  const match = interval.match(/(\d+)\s*(hour|day|hours|days)/);
  if (!match) return 24 * 60 * 60 * 1000;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  if (unit.startsWith('hour')) return value * 60 * 60 * 1000;
  if (unit.startsWith('day')) return value * 24 * 60 * 60 * 1000;
  
  return 24 * 60 * 60 * 1000;
}
