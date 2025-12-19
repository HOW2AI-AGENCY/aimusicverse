/**
 * Telegram Bot Metrics and Monitoring
 * Tracks delivery rates, error rates, and response times
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Event types for tracking
export type MetricEventType = 
  | 'message_sent'
  | 'message_failed'
  | 'callback_processed'
  | 'callback_failed'
  | 'notification_sent'
  | 'notification_failed'
  | 'audio_sent'
  | 'audio_failed'
  | 'photo_sent'
  | 'photo_failed'
  | 'inline_query_processed'
  | 'rate_limited'
  | 'cover_started'
  | 'cover_failed'
  | 'extend_started'
  | 'extend_failed'
  | 'audio_processing_error'
  | 'upload_started'
  | 'upload_completed'
  | 'upload_completed_with_analysis'
  | 'upload_failed'
  | 'cover_from_reference'
  | 'extend_from_reference'
  | 'analyze_command'
  | 'analyze_transcription'
  | 'analyze_chords'
  | 'analyze_beats'
  | 'analyze_full'
  | 'lyrics_shown'
  | 'lyrics_transcribed'
  | 'voice_transcribed'
  | 'voice_transcription_failed'
  | 'voice_generation_started'
  | 'wizard_started'
  | 'wizard_cancelled'
  | 'wizard_completed'
  | 'quick_generation_started';

interface MetricData {
  eventType: MetricEventType;
  success: boolean;
  userId?: string;
  telegramChatId?: number;
  errorMessage?: string;
  responseTimeMs?: number;
  metadata?: Record<string, unknown>;
}

// In-memory buffer for batch inserts (performance optimization)
const metricsBuffer: MetricData[] = [];
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;

let flushTimeout: number | null = null;

/**
 * Record a metric event
 */
export async function trackMetric(data: MetricData): Promise<void> {
  metricsBuffer.push(data);
  
  // Flush immediately if buffer is full or if it's an error
  if (metricsBuffer.length >= BUFFER_SIZE || !data.success) {
    await flushMetrics();
  } else if (!flushTimeout) {
    // Schedule a flush
    flushTimeout = setTimeout(() => flushMetrics(), FLUSH_INTERVAL_MS) as unknown as number;
  }
}

/**
 * Flush all buffered metrics to the database
 */
export async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return;
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  const metricsToInsert = [...metricsBuffer];
  metricsBuffer.length = 0;
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const records = metricsToInsert.map(m => ({
      event_type: m.eventType,
      success: m.success,
      user_id: m.userId || null,
      telegram_chat_id: m.telegramChatId || null,
      error_message: m.errorMessage || null,
      response_time_ms: m.responseTimeMs || null,
      metadata: m.metadata || null,
    }));
    
    const { error } = await supabase
      .from('telegram_bot_metrics')
      .insert(records);
    
    if (error) {
      console.error('Failed to insert metrics:', error);
    }
  } catch (err) {
    console.error('Metrics flush error:', err);
  }
}

/**
 * Helper to measure and track API call performance
 */
export async function withMetrics<T>(
  eventType: MetricEventType,
  operation: () => Promise<T>,
  context: {
    userId?: string;
    telegramChatId?: number;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const responseTimeMs = Date.now() - startTime;
    
    trackMetric({
      eventType,
      success: true,
      responseTimeMs,
      ...context,
    });
    
    return result;
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Change event type to failed variant
    const failedEventType = eventType.replace('_sent', '_failed')
      .replace('_processed', '_failed') as MetricEventType;
    
    trackMetric({
      eventType: failedEventType,
      success: false,
      responseTimeMs,
      errorMessage,
      ...context,
    });
    
    throw error;
  }
}

/**
 * Check if error rate exceeds threshold and trigger alert
 */
export async function checkAlerts(): Promise<{
  shouldAlert: boolean;
  alertMessage?: string;
  metrics?: {
    successRate: number;
    errorCount: number;
    avgResponseTime: number;
  };
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get metrics for the last hour
    const { data, error } = await supabase
      .rpc('get_telegram_bot_metrics', { _time_period: '1 hour' });
    
    if (error || !data || data.length === 0) {
      return { shouldAlert: false };
    }
    
    const metrics = data[0];
    const successRate = metrics.success_rate || 100;
    const errorCount = metrics.failed_events || 0;
    const avgResponseTime = metrics.avg_response_time_ms || 0;
    
    // Alert thresholds
    const ERROR_RATE_THRESHOLD = 10; // Alert if error rate > 10%
    const ERROR_COUNT_THRESHOLD = 50; // Alert if > 50 errors in last hour
    const RESPONSE_TIME_THRESHOLD = 5000; // Alert if avg response > 5s
    
    const alerts: string[] = [];
    
    if (successRate < (100 - ERROR_RATE_THRESHOLD)) {
      alerts.push(`⚠️ High error rate: ${(100 - successRate).toFixed(1)}%`);
    }
    
    if (errorCount > ERROR_COUNT_THRESHOLD) {
      alerts.push(`⚠️ High error count: ${errorCount} errors in last hour`);
    }
    
    if (avgResponseTime > RESPONSE_TIME_THRESHOLD) {
      alerts.push(`⚠️ Slow responses: ${avgResponseTime.toFixed(0)}ms average`);
    }
    
    return {
      shouldAlert: alerts.length > 0,
      alertMessage: alerts.join('\n'),
      metrics: {
        successRate,
        errorCount,
        avgResponseTime,
      },
    };
  } catch (err) {
    console.error('Alert check error:', err);
    return { shouldAlert: false };
  }
}
