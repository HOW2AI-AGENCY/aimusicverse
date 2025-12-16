/**
 * Retry utility with exponential backoff
 * Use for network requests and other operations that might fail temporarily
 */

import { NetworkError, ServiceUnavailableError } from './errors';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  shouldRetry: (error: unknown) => {
    // Default: retry on network errors and 5xx status codes
    if (error instanceof NetworkError || error instanceof ServiceUnavailableError) {
      return true;
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('timeout') ||
             message.includes('fetch') ||
             message.includes('econnrefused');
    }
    
    return false;
  },
  onRetry: () => {}, // No-op by default
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted attempts
      if (attempt === opts.maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!opts.shouldRetry(error, attempt)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );
      
      // Notify about retry
      opts.onRetry(error, attempt + 1, delay);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  throw lastError;
}

/**
 * Retry specifically for fetch requests with better error handling
 */
export async function retryFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(input, init);
      
      // Throw on non-ok responses
      if (!response.ok) {
        if (response.status >= 500) {
          throw new ServiceUnavailableError('API');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    },
    {
      ...options,
      shouldRetry: (error, attempt) => {
        // Retry on 5xx errors and network errors
        if (error instanceof ServiceUnavailableError) {
          return true;
        }
        
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return message.includes('network') || 
                 message.includes('timeout') ||
                 message.includes('fetch') ||
                 message.includes('http 5');
        }
        
        return false;
      },
    }
  );
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce helper for user actions
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle helper for frequent events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
