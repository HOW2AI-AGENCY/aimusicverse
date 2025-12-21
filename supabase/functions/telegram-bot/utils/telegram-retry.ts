/**
 * Telegram API Retry Logic with Exponential Backoff
 * Provides resilient API calls with automatic retry and failed notification storage
 */

import { createLogger } from '../../_shared/logger.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const logger = createLogger('telegram-retry');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

/**
 * Determines if a Telegram API error is retryable
 */
export function isRetryableError(error: unknown, config: RetryConfig = {}): boolean {
  const { retryableStatusCodes = DEFAULT_CONFIG.retryableStatusCodes } = config;
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (message.includes('fetch failed') ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('socket')) {
      return true;
    }
    
    // Check for status code in error message
    for (const code of retryableStatusCodes) {
      if (message.includes(`${code}`)) {
        return true;
      }
    }
    
    // Telegram-specific retryable errors
    if (message.includes('too many requests') ||
        message.includes('retry_after') ||
        message.includes('flood_wait')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract retry-after seconds from Telegram error
 */
export function extractRetryAfter(error: unknown): number | null {
  if (error instanceof Error) {
    const match = error.message.match(/retry.?after[:\s]+(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

/**
 * Execute a Telegram API call with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_CONFIG.maxRetries,
    initialDelayMs = DEFAULT_CONFIG.initialDelayMs,
    maxDelayMs = DEFAULT_CONFIG.maxDelayMs,
    backoffMultiplier = DEFAULT_CONFIG.backoffMultiplier,
  } = config;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      if (attempt >= maxRetries || !isRetryableError(error, config)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      // Use retry_after if provided by Telegram
      const retryAfter = extractRetryAfter(error);
      if (retryAfter) {
        delay = Math.max(delay, retryAfter * 1000);
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 500;
      delay += jitter;

      logger.warn('Retrying Telegram API call', {
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: lastError.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Store a failed notification for later retry
 */
export async function storeFailedNotification(
  chatId: number,
  method: string,
  payload: Record<string, unknown>,
  errorMessage: string,
  retryCount: number = 0
): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Calculate next retry time with exponential backoff
    const delayMs = Math.min(
      DEFAULT_CONFIG.initialDelayMs * Math.pow(DEFAULT_CONFIG.backoffMultiplier, retryCount),
      DEFAULT_CONFIG.maxDelayMs
    );
    const nextRetryAt = new Date(Date.now() + delayMs);

    const { error } = await supabase
      .from('failed_telegram_notifications')
      .insert({
        chat_id: chatId,
        method,
        payload,
        error_message: errorMessage,
        retry_count: retryCount,
        next_retry_at: nextRetryAt.toISOString(),
      });

    if (error) {
      logger.error('Failed to store notification for retry', { error });
    } else {
      logger.info('Stored failed notification for retry', { chatId, method, retryCount });
    }
  } catch (error) {
    logger.error('Exception storing failed notification', { error });
  }
}

/**
 * Mark a notification as successfully sent
 */
export async function markNotificationSuccess(notificationId: string): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    await supabase
      .from('failed_telegram_notifications')
      .update({ status: 'success' })
      .eq('id', notificationId);
  } catch (error) {
    logger.error('Failed to mark notification as success', { error });
  }
}

/**
 * Mark a notification as permanently failed
 */
export async function markNotificationFailed(
  notificationId: string,
  errorMessage: string
): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    await supabase
      .from('failed_telegram_notifications')
      .update({ 
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', notificationId);
  } catch (error) {
    logger.error('Failed to mark notification as failed', { error });
  }
}

/**
 * Update retry count and schedule next retry
 */
export async function scheduleRetry(
  notificationId: string,
  retryCount: number,
  errorMessage: string
): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const delayMs = Math.min(
      DEFAULT_CONFIG.initialDelayMs * Math.pow(DEFAULT_CONFIG.backoffMultiplier, retryCount),
      DEFAULT_CONFIG.maxDelayMs
    );
    const nextRetryAt = new Date(Date.now() + delayMs);

    await supabase
      .from('failed_telegram_notifications')
      .update({
        status: 'pending',
        retry_count: retryCount,
        next_retry_at: nextRetryAt.toISOString(),
        error_message: errorMessage,
      })
      .eq('id', notificationId);
  } catch (error) {
    logger.error('Failed to schedule retry', { error });
  }
}

/**
 * Get pending retries for processing
 */
export async function getPendingRetries(batchSize: number = 10): Promise<Array<{
  id: string;
  chat_id: number;
  method: string;
  payload: Record<string, unknown>;
  retry_count: number;
  max_retries: number;
}>> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase
      .rpc('get_pending_telegram_retries', { batch_size: batchSize });

    if (error) {
      logger.error('Failed to get pending retries', { error });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception getting pending retries', { error });
    return [];
  }
}
