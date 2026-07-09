/**
 * useRetry — hook that retries a failed async call on 524 (Cloudflare timeout).
 * Exposes retry count, error state, and manual retry trigger.
 *
 * ponytail: simple retry-only. Add circuit-breaker or jitter if production
 * calls see burst failures.
 */
import { useState, useCallback, useRef } from "react";

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  /** Called on each retry attempt (total = attempt) */
  onRetry?: (attempt: number, error: Error) => void;
}

interface RetryState<T> {
  execute: (...args: unknown[]) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  attempt: number;
  reset: () => void;
}

function is524(error: unknown): boolean {
  if (error instanceof Response && error.status === 524) return true;
  if (error instanceof Error && /524|timed? ?out|gateway/i.test(error.message)) return true;
  return false;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useRetry<T>(
  fn: (...args: unknown[]) => Promise<T>,
  { maxRetries = 3, baseDelay = 1000, onRetry }: RetryOptions = {},
): RetryState<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(
    async (...args: unknown[]): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setAttempt(0);

      let lastError: Error | null = null;
      for (let i = 0; i <= maxRetries; i++) {
        try {
          const result = await fnRef.current(...args);
          setIsLoading(false);
          setAttempt(0);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          setError(lastError);
          setAttempt(i + 1);

          if (!is524(err) || i >= maxRetries) {
            break; // non-retryable or out of retries
          }

          onRetry?.(i + 1, lastError);
          await delay(baseDelay * Math.pow(2, i)); // 1s, 2s, 4s
        }
      }

      setIsLoading(false);
      throw lastError;
    },
    [maxRetries, baseDelay, onRetry],
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setAttempt(0);
  }, []);

  return { execute, isLoading, error, attempt, reset };
}
