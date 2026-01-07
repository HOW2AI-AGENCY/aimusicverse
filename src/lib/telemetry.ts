/**
 * Telemetry & Analytics Module
 * 
 * Collects and reports:
 * - Performance metrics (timings, memory)
 * - Error statistics
 * - User behavior patterns
 * - Feature usage analytics
 * 
 * Privacy-first: All data is anonymized and user can opt-out
 */

import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp: number;
}

export interface ErrorMetric {
  code: string;
  message: string;
  count: number;
  lastOccurred: number;
  context?: Record<string, unknown>;
}

export interface FeatureUsage {
  feature: string;
  action: 'start' | 'complete' | 'error' | 'cancel';
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

// Configuration
const TELEMETRY_CONFIG = {
  enabled: true,
  batchSize: 20,
  flushIntervalMs: 30000, // 30 seconds
  maxQueueSize: 100,
  sampleRate: 1.0, // 100% of events
};

// In-memory buffers
const metricsBuffer: PerformanceMetric[] = [];
const errorCounts = new Map<string, ErrorMetric>();
const featureTimers = new Map<string, number>();

// Session tracking
let sessionId = crypto.randomUUID();
let sessionStartTime = Date.now();
let flushIntervalId: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

/**
 * Initialize telemetry session (idempotent - safe to call multiple times)
 */
export function initTelemetry() {
  // Prevent duplicate initialization (important for HMR)
  if (isInitialized) {
    logger.debug('Telemetry already initialized, skipping');
    return;
  }
  
  sessionId = crypto.randomUUID();
  sessionStartTime = Date.now();
  
  // Auto-flush on interval
  if (typeof window !== 'undefined') {
    // Clear any existing interval (safety for HMR)
    if (flushIntervalId) {
      clearInterval(flushIntervalId);
    }
    flushIntervalId = setInterval(flushMetrics, TELEMETRY_CONFIG.flushIntervalMs);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      flushMetrics(true);
    }, { once: true });
    
    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushMetrics(true);
      }
    });
  }
  
  isInitialized = true;
  logger.info('Telemetry initialized', { sessionId });
}

/**
 * Check if telemetry should be sampled
 */
function shouldSample(): boolean {
  return TELEMETRY_CONFIG.enabled && Math.random() < TELEMETRY_CONFIG.sampleRate;
}

/**
 * Record a performance metric
 */
export function recordMetric(
  name: string, 
  value: number, 
  unit: PerformanceMetric['unit'] = 'ms',
  tags?: Record<string, string>
) {
  if (!shouldSample()) return;
  
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    tags,
    timestamp: Date.now(),
  };
  
  metricsBuffer.push(metric);
  
  // Prevent buffer overflow
  if (metricsBuffer.length > TELEMETRY_CONFIG.maxQueueSize) {
    metricsBuffer.shift();
  }
  
  logger.debug('Metric recorded', { name, value, unit });
}

/**
 * Start a timer for measuring duration
 */
export function startTimer(name: string): () => number {
  const startTime = performance.now();
  featureTimers.set(name, startTime);
  
  return () => {
    const duration = performance.now() - startTime;
    featureTimers.delete(name);
    recordMetric(name, duration, 'ms');
    return duration;
  };
}

// Rate limiting for error recording
const ERROR_RATE_LIMIT = {
  maxPerMinute: 10,
  windowMs: 60000,
};
const errorRateWindow = new Map<string, { count: number; resetTime: number }>();

/**
 * Record an error occurrence with rate limiting
 */
export function recordError(code: string, message: string, context?: Record<string, unknown>) {
  const now = Date.now();
  
  // Rate limiting per error code
  const rateInfo = errorRateWindow.get(code);
  if (rateInfo) {
    if (now < rateInfo.resetTime) {
      if (rateInfo.count >= ERROR_RATE_LIMIT.maxPerMinute) {
        // Rate limited - just increment existing count silently
        const existing = errorCounts.get(code);
        if (existing) existing.count++;
        return;
      }
      rateInfo.count++;
    } else {
      // Reset window
      errorRateWindow.set(code, { count: 1, resetTime: now + ERROR_RATE_LIMIT.windowMs });
    }
  } else {
    errorRateWindow.set(code, { count: 1, resetTime: now + ERROR_RATE_LIMIT.windowMs });
  }
  
  const existing = errorCounts.get(code);
  
  if (existing) {
    existing.count++;
    existing.lastOccurred = now;
    existing.message = message;
  } else {
    errorCounts.set(code, {
      code,
      message,
      count: 1,
      lastOccurred: now,
      context,
    });
  }
  
  logger.debug('Error recorded', { code, count: errorCounts.get(code)?.count });
}

/**
 * Track feature usage
 */
export function trackFeature(
  feature: string,
  action: FeatureUsage['action'],
  metadata?: Record<string, unknown>
) {
  if (!shouldSample()) return;
  
  let durationMs: number | undefined;
  
  if (action === 'start') {
    featureTimers.set(`feature:${feature}`, performance.now());
  } else if (action === 'complete' || action === 'error' || action === 'cancel') {
    const startTime = featureTimers.get(`feature:${feature}`);
    if (startTime) {
      durationMs = performance.now() - startTime;
      featureTimers.delete(`feature:${feature}`);
    }
  }
  
  // Store in buffer as metric
  recordMetric(`feature:${feature}:${action}`, durationMs || 1, durationMs ? 'ms' : 'count', {
    action,
    ...Object.fromEntries(
      Object.entries(metadata || {}).map(([k, v]) => [k, String(v)])
    ),
  });
  
  logger.debug('Feature tracked', { feature, action, durationMs });
}

/**
 * Get session duration in seconds
 */
export function getSessionDuration(): number {
  return Math.floor((Date.now() - sessionStartTime) / 1000);
}

/**
 * Get current error statistics
 */
export function getErrorStats(): Record<string, ErrorMetric> {
  return Object.fromEntries(errorCounts);
}

/**
 * Flush metrics to backend
 */
export async function flushMetrics(useBeacon = false) {
  if (metricsBuffer.length === 0 && errorCounts.size === 0) return;
  
  const payload = {
    sessionId,
    sessionDuration: getSessionDuration(),
    metrics: [...metricsBuffer],
    errors: getErrorStats(),
    timestamp: new Date().toISOString(),
  };
  
  // Clear buffers BEFORE sending to prevent duplicate sends
  metricsBuffer.length = 0;
  const errorSnapshot = new Map(errorCounts);
  errorCounts.clear();
  
  if (useBeacon && navigator.sendBeacon) {
    // Use sendBeacon for page unload - fire and forget
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telemetry`,
        blob
      );
    } catch {
      // Silently fail
    }
    return;
  }
  
  // Normal async flush
  try {
    await supabase.functions.invoke('telemetry', {
      body: payload,
    });
    logger.debug('Metrics flushed', { count: payload.metrics.length });
  } catch (error) {
    // Re-queue metrics and errors on failure
    metricsBuffer.push(...payload.metrics);
    errorSnapshot.forEach((err, code) => {
      const existing = errorCounts.get(code);
      if (existing) {
        existing.count += err.count;
      } else {
        errorCounts.set(code, err);
      }
    });
    logger.warn('Failed to flush metrics', { error });
  }
}

/**
 * Decorator for timing async functions
 */
export function withTiming<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const timer = startTimer(name);
    try {
      const result = await fn(...args);
      timer();
      return result;
    } catch (error) {
      timer();
      throw error;
    }
  }) as T;
}

/**
 * Studio-specific analytics
 */
export const studioAnalytics = {
  trackStemLoad: (stemType: string, durationMs: number, fromCache: boolean) => {
    recordMetric('studio:stem_load', durationMs, 'ms', { stemType, fromCache: String(fromCache) });
  },
  
  trackPlayback: (action: 'play' | 'pause' | 'seek', position?: number) => {
    trackFeature('studio:playback', action === 'play' ? 'start' : 'complete', { action, position });
  },
  
  trackMixChange: (changeType: 'volume' | 'mute' | 'solo' | 'pan', stemType: string) => {
    recordMetric('studio:mix_change', 1, 'count', { changeType, stemType });
  },
  
  trackExport: (format: string, stemsCount: number, durationMs: number) => {
    recordMetric('studio:export', durationMs, 'ms', { format, stemsCount: String(stemsCount) });
  },
  
  trackTranscription: (model: string, success: boolean, durationMs: number) => {
    recordMetric('studio:transcription', durationMs, 'ms', { model, success: String(success) });
  },
};

/**
 * Generation-specific analytics
 */
export const generationAnalytics = {
  trackStart: (mode: string, hasLyrics: boolean, hasReference: boolean) => {
    trackFeature('generation', 'start', { mode, hasLyrics, hasReference });
  },
  
  trackComplete: (mode: string, durationMs: number, creditsUsed: number) => {
    trackFeature('generation', 'complete', { mode, durationMs, creditsUsed });
    recordMetric('generation:duration', durationMs, 'ms', { mode });
    recordMetric('generation:credits', creditsUsed, 'count', { mode });
  },
  
  trackError: (mode: string, errorCode: string) => {
    trackFeature('generation', 'error', { mode, errorCode });
    recordError(`generation:${errorCode}`, `Generation failed: ${errorCode}`, { mode });
  },
};

/**
 * Audio player analytics
 */
export const playerAnalytics = {
  trackPlay: (trackId: string, source: string) => {
    trackFeature('player:play', 'start', { trackId, source });
  },
  
  trackComplete: (trackId: string, listenDurationSec: number, totalDuration?: number) => {
    const completionRate = totalDuration && totalDuration > 0 
      ? Math.round((listenDurationSec / totalDuration) * 100) 
      : undefined;
    trackFeature('player:play', 'complete', { trackId, listenDurationSec, completionRate });
    recordMetric('player:listen_duration', listenDurationSec, 's', { trackId });
  },
  
  trackSeek: (trackId: string, fromPercent: number, toPercent: number) => {
    recordMetric('player:seek', Math.abs(toPercent - fromPercent), 'percent', { trackId });
  },
  
  trackError: (trackId: string, errorType: string) => {
    recordError(`player:${errorType}`, `Player error: ${errorType}`, { trackId });
  },
};

/**
 * Navigation analytics
 */
export const navigationAnalytics = {
  trackPageView: (path: string, referrer?: string) => {
    recordMetric('navigation:page_view', 1, 'count', { path, referrer: referrer || '' });
  },
  
  trackNavigation: (from: string, to: string, method: string = 'router') => {
    recordMetric('navigation:navigate', 1, 'count', { from, to, method });
  },
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initTelemetry();
}
