/**
 * useRAFThrottle - Throttle updates using requestAnimationFrame
 * Provides native 60fps throttling without artificial delays
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';

export interface UseRAFThrottleOptions {
  /**
   * Whether throttling is enabled
   * @default true
   */
  enabled?: boolean;
}

export interface UseRAFThrottleReturn<T extends (...args: any[]) => void> {
  /**
   * Throttled callback function
   */
  throttledCallback: T;

  /**
   * Cancel pending RAF callback
   */
  cancel: () => void;

  /**
   * Check if there's a pending RAF callback
   */
  hasPendingCallback: () => boolean;
}

/**
 * Throttle a callback using requestAnimationFrame
 * Provides smooth 60fps updates without artificial delays
 *
 * @param callback - Function to throttle
 * @param options - Throttle options
 * @returns Throttled callback and control functions
 *
 * @example
 * ```tsx
 * const { throttledCallback } = useRAFThrottle((time: number) => {
 *   console.log('Current time:', time);
 * });
 *
 * // Rapid updates will be throttled to ~60fps
 * throttledCallback(performance.now());
 * throttledCallback(performance.now());
 * throttledCallback(performance.now());
 * // Only last call will execute in next RAF frame
 * ```
 */
export function useRAFThrottle<T extends (...args: any[]) => void>(
  callback: T,
  options: UseRAFThrottleOptions = {}
): UseRAFThrottleReturn<T> {
  const { enabled = true } = options;

  const rafIdRef = useRef<number | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);

  // Cancel any pending RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Throttled callback implementation
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (!enabled) {
        // If throttling is disabled, call immediately
        callback(...args);
        return;
      }

      // Store latest arguments
      argsRef.current = args;

      // If no RAF is pending, schedule one
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;

          // Execute callback with latest arguments
          if (argsRef.current !== null) {
            callback(...argsRef.current);
            argsRef.current = null;
          }
        });
      }
      // If RAF is already pending, new arguments will replace old ones
      // This ensures only the latest call executes
    },
    [callback, enabled]
  ) as T;

  // Cancel pending RAF
  const cancel = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      argsRef.current = null;
    }
  }, []);

  // Check if there's a pending callback
  const hasPendingCallback = useCallback(() => {
    return rafIdRef.current !== null;
  }, []);

  return {
    throttledCallback,
    cancel,
    hasPendingCallback,
  };
}

/**
 * Hook version for throttling updates to state
 * Useful for high-frequency updates like currentTime tracking
 *
 * @param initialValue - Initial value
 * @param onUpdate - Callback when value updates
 * @returns Current value and throttled setter
 *
 * @example
 * ```tsx
 * const [currentTime, setCurrentTimeThrottled] = useRAFThrottledState(0);
 *
 * // Rapid updates will be throttled
 * setCurrentTimeThrottled(audio.currentTime);
 * setCurrentTimeThrottled(audio.currentTime);
 * // Only last value will be set in next RAF frame
 * ```
 */
export function useRAFThrottledState<T>(
  initialValue: T,
  onUpdate?: (value: T) => void
): [T, (value: T) => void] {
  const valueRef = useRef<T>(initialValue);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const setValue = useCallback((newValue: T) => {
    valueRef.current = newValue;

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        onUpdate?.(valueRef.current);
      });
    }
  }, [onUpdate]);

  return [valueRef.current, setValue];
}

/**
 * Throttle multiple callbacks together in a single RAF
 * Useful for batching multiple updates
 *
 * @param callbacks - Object with callbacks to throttle
 * @returns Throttled versions of callbacks
 *
 * @example
 * ```tsx
 * const throttled = useRAFThrottleBatch({
 *   onUpdateA: (value: number) => console.log('A:', value),
 *   onUpdateB: (value: number) => console.log('B:', value),
 * });
 *
 * throttled.onUpdateA(1);
 * throttled.onUpdateB(2);
 * // Both will execute in the same RAF frame
 * ```
 */
export function useRAFThrottleBatch<T extends Record<string, (...args: any[]) => void>>(
  callbacks: T
): T {
  const rafIdRef = useRef<number | null>(null);
  const pendingCallsRef = useRef<Array<{ key: string; args: any[] }>>([]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const scheduleBatch = useCallback(() => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;

      // Execute all pending calls
      const calls = pendingCallsRef.current;
      pendingCallsRef.current = [];

      calls.forEach(({ key, args }) => {
        const callback = callbacks[key];
        if (callback) {
          callback(...args);
        }
      });
    });
  }, [callbacks]);

  // Create throttled versions of all callbacks
  const throttledCallbacks = useMemo(() => {
    const result = {} as T;

    (Object.keys(callbacks) as Array<keyof T>).forEach((key) => {
      result[key] = ((...args: any[]) => {
        // Add to pending calls
        pendingCallsRef.current.push({ key: key as string, args });
        scheduleBatch();
      }) as T[keyof T];
    });

    return result;
  }, [callbacks, scheduleBatch]);

  return throttledCallbacks;
}
