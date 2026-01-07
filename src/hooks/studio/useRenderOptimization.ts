/**
 * useRenderOptimization - Utilities for optimized rendering
 * Provides tools for batching updates and avoiding unnecessary renders
 */

import { useCallback, useRef, useMemo, useEffect, useState } from 'react';

/**
 * Batches multiple state updates into a single render
 */
export function useBatchedUpdates<T extends Record<string, unknown>>(
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  const rafRef = useRef<number | undefined>(undefined);

  const scheduleUpdate = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    
    if (rafRef.current === undefined) {
      rafRef.current = requestAnimationFrame(() => {
        setState(prev => ({ ...prev, ...pendingUpdates.current }));
        pendingUpdates.current = {};
        rafRef.current = undefined;
      });
    }
  }, []);

  const flushUpdates = useCallback(() => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
    if (Object.keys(pendingUpdates.current).length > 0) {
      setState(prev => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return [state, scheduleUpdate, flushUpdates];
}

/**
 * Creates a throttled callback that uses RAF
 */
export function useRAFThrottle<T extends (...args: unknown[]) => void>(
  callback: T
): T {
  const rafRef = useRef<number | undefined>(undefined);
  const argsRef = useRef<unknown[]>([]);

  const throttled = useCallback((...args: unknown[]) => {
    argsRef.current = args;
    
    if (rafRef.current === undefined) {
      rafRef.current = requestAnimationFrame(() => {
        callback(...argsRef.current);
        rafRef.current = undefined;
      });
    }
  }, [callback]) as T;

  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return throttled;
}

/**
 * Memoizes an expensive computation with shallow comparison
 */
export function useShallowMemo<T>(
  factory: () => T,
  deps: unknown[]
): T {
  const prevDepsRef = useRef<unknown[]>([]);
  const resultRef = useRef<T | undefined>(undefined);

  const depsChanged = deps.length !== prevDepsRef.current.length ||
    deps.some((dep, i) => !Object.is(dep, prevDepsRef.current[i]));

  if (depsChanged || resultRef.current === undefined) {
    resultRef.current = factory();
    prevDepsRef.current = deps;
  }

  return resultRef.current;
}

/**
 * Defers a value update to avoid blocking the main thread
 */
export function useDeferredValue<T>(value: T, delay = 0): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (delay === 0) {
      // Use RAF for immediate but non-blocking updates
      rafRef.current = requestAnimationFrame(() => {
        setDeferredValue(value);
      });
      return () => {
        if (rafRef.current !== undefined) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    } else {
      timeoutRef.current = setTimeout(() => {
        setDeferredValue(value);
      }, delay);
      return () => {
        if (timeoutRef.current !== undefined) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [value, delay]);

  return deferredValue;
}

/**
 * Creates a stable callback reference that doesn't cause re-renders
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Tracks which props caused a re-render (development only)
 */
export function useRenderTracker(
  componentName: string,
  props: Record<string, unknown>
): void {
  const prevPropsRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const changedProps: string[] = [];
    const allKeys = new Set([
      ...Object.keys(props),
      ...Object.keys(prevPropsRef.current),
    ]);

    allKeys.forEach(key => {
      if (!Object.is(props[key], prevPropsRef.current[key])) {
        changedProps.push(key);
      }
    });

    if (changedProps.length > 0) {
      console.log(`[RenderTracker] ${componentName} re-rendered due to:`, changedProps);
    }

    prevPropsRef.current = { ...props };
  });
}

/**
 * Creates an object with stable references for unchanged properties
 */
export function useStableObject<T extends Record<string, unknown>>(obj: T): T {
  const cacheRef = useRef<Map<string, unknown>>(new Map());
  
  return useMemo(() => {
    const result = {} as T;
    
    for (const key of Object.keys(obj) as Array<keyof T>) {
      const value = obj[key];
      const cached = cacheRef.current.get(key as string);
      
      if (Object.is(value, cached)) {
        result[key] = cached as T[keyof T];
      } else {
        cacheRef.current.set(key as string, value);
        result[key] = value;
      }
    }
    
    return result;
  }, [obj]);
}
