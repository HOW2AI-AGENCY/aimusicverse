/**
 * Automatic Retry Hook with Exponential Backoff
 * Feature: Sprint 32 - US-004 Automatic Retry
 *
 * Provides retry logic for retryable errors with exponential backoff
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { isRetryableError, getRetryDelay, mapSunoError } from '@/lib/suno-error-mapper';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  nextRetryIn: number | null;
  lastError: Error | null;
}

export interface UseAutomaticRetryOptions {
  maxRetries?: number;
  onRetry?: (attempt: number) => void;
  onRetrySuccess?: (attempt: number) => void;
  onRetryFailed?: (error: Error, attempts: number) => void;
}

const DEFAULT_MAX_RETRIES = 3;

/**
 * Hook for automatic retry with exponential backoff
 */
export function useAutomaticRetry(options: UseAutomaticRetryOptions = {}) {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    onRetry,
    onRetrySuccess,
    onRetryFailed,
  } = options;

  const { trackEvent } = useAnalyticsTracking();

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    maxRetries,
    nextRetryIn: null,
    lastError: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  /**
   * Cancel ongoing retry
   */
  const cancelRetry = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRetrying: false,
      nextRetryIn: null,
    }));

    logger.info('Retry cancelled');
  }, []);

  /**
   * Retry an async operation with exponential backoff
   */
  const retry = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      abortControllerRef.current = new AbortController();
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Check if cancelled
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Retry cancelled');
          }

          // Attempt the operation
          const result = await operation();

          // Success
          if (attempt > 0) {
            onRetrySuccess?.(attempt);
            trackEvent({
              eventType: 'feature_used',
              eventName: 'retry_success',
              metadata: { attempt, maxRetries },
            });
            logger.info('Retry succeeded', { attempt });
          }

          setState(prev => ({
            ...prev,
            isRetrying: false,
            retryCount: 0,
            nextRetryIn: null,
            lastError: null,
          }));

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Check if error is retryable
          if (!isRetryableError(error) || attempt >= maxRetries) {
            // Not retryable or max retries reached
            const mappedError = mapSunoError(error);

            setState({
              isRetrying: false,
              retryCount: attempt,
              maxRetries,
              nextRetryIn: null,
              lastError,
            });

            if (attempt >= maxRetries) {
              onRetryFailed?.(lastError, attempt);
              trackEvent({
                eventType: 'feature_used',
                eventName: 'retry_exhausted',
                metadata: { attempts: attempt, errorCode: mappedError.code },
              });
              logger.error('All retries exhausted', {
                attempts: attempt,
                error: mappedError.technical,
              });
            }

            throw lastError;
          }

          // Wait before retrying
          const delay = getRetryDelay(attempt);

          logger.info('Scheduling retry', {
            attempt: attempt + 1,
            maxRetries,
            delay,
          });

          // Update state
          setState({
            isRetrying: true,
            retryCount: attempt + 1,
            maxRetries,
            nextRetryIn: delay,
            lastError,
          });

          onRetry?.(attempt + 1);
          trackEvent({
            eventType: 'feature_used',
            eventName: 'retry_attempt',
            metadata: { attempt: attempt + 1, maxRetries, delay },
          });

          // Countdown timer
          const startTime = Date.now();
          countdownIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, delay - elapsed);

            setState(prev => ({
              ...prev,
              nextRetryIn: remaining,
            }));

            if (remaining <= 0 && countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
          }, 100);

          // Wait
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              resolve();
            }, delay);

            // Handle abort
            abortControllerRef.current?.signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              reject(new Error('Retry cancelled'));
            });
          });
        }
      }

      // Should never reach here, but TypeScript needs it
      throw lastError || new Error('Unknown error during retry');
    },
    [maxRetries, onRetry, onRetrySuccess, onRetryFailed, trackEvent]
  );

  /**
   * Reset retry state
   */
  const reset = useCallback(() => {
    cancelRetry();
    setState({
      isRetrying: false,
      retryCount: 0,
      maxRetries,
      nextRetryIn: null,
      lastError: null,
    });
  }, [cancelRetry, maxRetries]);

  return {
    retry,
    cancelRetry,
    reset,
    state,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    nextRetryIn: state.nextRetryIn,
    canRetry: state.retryCount < maxRetries,
  };
}

/**
 * Simple retry wrapper without state management
 * Useful for one-off retry operations
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; onRetry?: (attempt: number) => void } = {}
): Promise<T> {
  const { maxRetries = DEFAULT_MAX_RETRIES, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error;
      }

      const delay = getRetryDelay(attempt);
      onRetry?.(attempt + 1);

      logger.info('Retrying operation', { attempt: attempt + 1, delay });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
