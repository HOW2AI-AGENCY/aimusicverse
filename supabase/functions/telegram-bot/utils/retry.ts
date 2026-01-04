/**
 * Retry Utility with Exponential Backoff
 * Provides resilient API calls with automatic retry on transient failures
 */

import { createLogger } from '../../_shared/logger.ts';

const logger = createLogger('retry-util');

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxAttempts?: number;

  /**
   * Initial delay in milliseconds (default: 1000ms)
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds (default: 10000ms)
   */
  maxDelay?: number;

  /**
   * Multiplier for exponential backoff (default: 2)
   */
  backoffMultiplier?: number;

  /**
   * Function to determine if error is retryable (default: checks for network/5xx errors)
   */
  isRetryable?: (error: Error) => boolean;

  /**
   * Callback called on each retry attempt
   */
  onRetry?: (attempt: number, error: Error) => void | Promise<void>;
}

/**
 * Default retry checker for network and temporary errors
 */
function defaultIsRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors
  if (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('socket')
  ) {
    return true;
  }

  // HTTP errors (check if error has status code)
  const errorWithStatus = error as Error & { status?: number };
  if (errorWithStatus.status) {
    const status = errorWithStatus.status;
    // Retry on 5xx (server errors) and 429 (rate limit)
    return status >= 500 || status === 429 || status === 408;
  }

  return false;
}

/**
 * Execute a function with automatic retry on failures
 * @param fn Function to execute
 * @param options Retry options
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    isRetryable = defaultIsRetryable,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = attempt < maxAttempts - 1 && isRetryable(lastError);

      if (!shouldRetry) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      logger.warn('Retry attempt', {
        attempt: attempt + 1,
        maxAttempts,
        delay,
        error: lastError.message,
      });

      // Call onRetry callback if provided
      if (onRetry) {
        await onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Retry fetch request with automatic retry on network errors
 * @param url URL to fetch
 * @param options Fetch options
 * @param retryOptions Retry configuration
 * @returns Fetch response
 */
export async function retryFetch(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);

      // Check if response indicates a retryable error
      if (!response.ok) {
        const errorWithStatus = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        ) as Error & { status: number; response: Response };
        errorWithStatus.status = response.status;
        errorWithStatus.response = response;
        throw errorWithStatus;
      }

      return response;
    },
    {
      ...retryOptions,
      isRetryable: retryOptions.isRetryable || ((error: Error) => {
        const errorWithStatus = error as Error & { status?: number };
        if (errorWithStatus.status) {
          const status = errorWithStatus.status;
          // Retry on 5xx, 429, 408, and 503
          return status >= 500 || status === 429 || status === 408;
        }
        return defaultIsRetryable(error);
      }),
    }
  );
}

/**
 * Retry a JSON API call
 * @param url URL to fetch
 * @param options Fetch options
 * @param retryOptions Retry configuration
 * @returns Parsed JSON response
 */
export async function retryJsonFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const response = await retryFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }, retryOptions);

  return await response.json() as T;
}

/**
 * Retry with jitter to prevent thundering herd problem
 * @param fn Function to execute
 * @param options Retry options
 * @returns Result of the function
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    // Add random jitter to delay (±25%)
    onRetry: async (attempt, error) => {
      if (options.onRetry) {
        await options.onRetry(attempt, error);
      }
      // Add small random delay to prevent all clients retrying at once
      const jitter = Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, jitter));
    },
  });
}

/**
 * Circuit breaker pattern
 * Stops retrying after too many consecutive failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly halfOpenRequests: number = 1
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // If circuit is open, check if we should try half-open
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        logger.info('Circuit breaker entering half-open state');
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }

    try {
      const result = await fn();

      // Success - reset if we were half-open
      if (this.state === 'half-open') {
        logger.info('Circuit breaker closing - request succeeded');
        this.state = 'closed';
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold reached
      if (this.failureCount >= this.threshold) {
        logger.warn('Circuit breaker OPENING', {
          failures: this.failureCount,
          threshold: this.threshold,
        });
        this.state = 'open';
      }

      throw error;
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}
