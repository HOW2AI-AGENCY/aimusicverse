/**
 * Automatic Retry Hook with Exponential Backoff
 * Feature: Sprint 032 - US-004 Automatic Retry
 *
 * Automatically retries failed operations with exponential backoff
 * Provides UI feedback during retry attempts
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { isRetryableError, getRetryDelay } from '@/lib/suno-error-mapper';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number) => void;
  onRetrySuccess?: (attempt: number) => void;
  onRetryFailed?: (error: any) => void;
}

export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: any | null;
  nextRetryIn: number | null;
}

/**
 * Automatic retry hook
 *
 * @example
 * ```tsx
 * const { retry, state } = useAutomaticRetry({
 *   maxRetries: 3,
 *   onRetry: (attempt) => toast.info(`Retry attempt ${attempt}...`),
 * });
 *
 * await retry(() => fetchGeneration());
 * ```
 */
export function useAutomaticRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 16000,
    onRetry,
    onRetrySuccess,
    onRetryFailed,
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    nextRetryIn: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { trackEvent } = useAnalyticsTracking();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update countdown
  useEffect(() => {
    if (state.nextRetryIn === null || state.nextRetryIn <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        nextRetryIn: prev.nextRetryIn !== null ? Math.max(0, prev.nextRetryIn - 1) : null,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.nextRetryIn]);

  const executeWithRetry = useCallback(
    async <T,>(
      operation: (signal?: AbortSignal) => Promise<T>,
      attempt: number = 0
    ): Promise<T> => {
      try {
        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Execute operation
        const result = await operation(signal);

        // Success - log if this was a retry
        if (attempt > 0) {
          logger.info('Retry successful', { attempt });
          trackEvent('generation_retry_success', { attempt });

          if (onRetrySuccess) {
            onRetrySuccess(attempt);
          }

          setState({
            isRetrying: false,
            retryCount: 0,
            lastError: null,
            nextRetryIn: null,
          });
        }

        return result;
      } catch (error: any) {
        // Check if error is retryable
        if (!isRetryableError(error) || attempt >= maxRetries) {
          // Max retries reached or non-retryable error
          logger.error('Operation failed after retries', {
            attempt,
            maxRetries,
            error: error.message,
            retryable: isRetryableError(error),
          });

          trackEvent('generation_retry_failed', {
            attempt,
            maxRetries,
            retryable: isRetryableError(error),
          });

          if (onRetryFailed) {
            onRetryFailed(error);
          }

          setState((prev) => ({
            ...prev,
            isRetrying: false,
            lastError: error,
            nextRetryIn: null,
          }));

          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        logger.warn('Retrying operation', {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: error.message,
        });

        trackEvent('generation_retry_attempt', {
          attempt: attempt + 1,
          delay,
        });

        // Update retry state
        setState({
          isRetrying: true,
          retryCount: attempt + 1,
          lastError: error,
          nextRetryIn: Math.ceil(delay / 1000), // Convert to seconds for countdown
        });

        // Notify callback
        if (onRetry) {
          onRetry(attempt + 1);
        }

        // Wait before retry
        await new Promise<void>((resolve) => {
          timeoutRef.current = setTimeout(resolve, delay);
        });

        // Recursive retry
        return executeWithRetry(operation, attempt + 1);
      }
    },
    [
      maxRetries,
      baseDelay,
      maxDelay,
      onRetry,
      onRetrySuccess,
      onRetryFailed,
      trackEvent,
    ]
  );

  /**
   * Execute an operation with automatic retry
   */
  const retry = useCallback(
    async <T,>(operation: (signal?: AbortSignal) => Promise<T>): Promise<T> => {
      return executeWithRetry(operation);
    },
    [executeWithRetry]
  );

  /**
   * Cancel ongoing retry
   */
  const cancelRetry = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: null,
    });

    logger.info('Retry cancelled');
  }, []);

  /**
   * Reset retry state
   */
  const resetRetry = useCallback(() => {
    cancelRetry();
  }, [cancelRetry]);

  return {
    retry,
    state,
    cancelRetry,
    resetRetry,
  };
}

/**
 * Hook for retrying generation specifically
 */
export function useGenerationRetry() {
  const { retry, state, cancelRetry } = useAutomaticRetry({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000, // Max 8 seconds between retries
    onRetry: (attempt) => {
      logger.info('Generation retry attempt', { attempt });
    },
  });

  return {
    retryGeneration: retry,
    retryState: state,
    cancelRetry,
  };
}
