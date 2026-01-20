/**
 * Development debugging utilities
 * 
 * These utilities are designed for development-time debugging only.
 * They automatically disable in production builds for zero runtime overhead.
 * 
 * @module lib/debug
 * @see docs/DEVELOPER_GUIDE.md for usage examples
 */

import { useRef, useEffect } from 'react';

/**
 * Log component render with props diff
 * 
 * Helps identify unnecessary re-renders by logging which props changed.
 * Only active in development mode (import.meta.env.DEV).
 * 
 * @param componentName - Name for logging identification
 * @param props - Current props to compare against previous render
 * 
 * @example
 * ```tsx
 * function MyComponent(props: Props) {
 *   useDebugRender('MyComponent', props);
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDebugRender(componentName: string, props: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  
  const prevPropsRef = useRef<Record<string, unknown>>(props);
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current += 1;
    const changed = getChangedKeys(prevPropsRef.current, props);
    
    if (changed.length > 0) {
      console.log(
        `%c[${componentName}]%c render #${renderCountRef.current}`,
        'color: #9333ea; font-weight: bold;',
        'color: inherit;',
        { changed, props }
      );
    }
    
    prevPropsRef.current = props;
  });
}

/**
 * Measure and log component render time
 * 
 * Logs render duration in milliseconds to identify slow components.
 * Only active in development mode.
 * 
 * @param componentName - Name for logging identification
 * 
 * @example
 * ```tsx
 * function HeavyComponent() {
 *   useRenderTime('HeavyComponent');
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderTime(componentName: string): void {
  if (!import.meta.env.DEV) return;
  
  const startTime = performance.now();
  
  useEffect(() => {
    const duration = performance.now() - startTime;
    
    // Only log if render takes more than 5ms
    if (duration > 5) {
      console.log(
        `%c[${componentName}]%c render time: %c${duration.toFixed(2)}ms`,
        'color: #9333ea; font-weight: bold;',
        'color: inherit;',
        duration > 16 ? 'color: #ef4444;' : 'color: #22c55e;'
      );
    }
  });
}

/**
 * Create a performance timer for async operations
 * 
 * @param label - Label for the timer
 * @returns Function to call when operation completes
 * 
 * @example
 * ```ts
 * const timer = createTimer('API Call');
 * await fetchData();
 * timer(); // Logs: "[API Call] 250ms"
 * ```
 */
export function createTimer(label: string): () => void {
  if (!import.meta.env.DEV) return () => {};
  
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    console.log(
      `%c[${label}]%c ${duration.toFixed(2)}ms`,
      'color: #3b82f6; font-weight: bold;',
      duration > 1000 ? 'color: #ef4444;' : 'color: inherit;'
    );
  };
}

/**
 * Get keys that changed between two objects
 * 
 * @param prev - Previous object state
 * @param next - Next object state
 * @returns Array of changed key names
 */
function getChangedKeys(
  prev: Record<string, unknown>,
  next: Record<string, unknown>
): string[] {
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changed: string[] = [];
  
  allKeys.forEach((key) => {
    if (!Object.is(prev[key], next[key])) {
      changed.push(key);
    }
  });
  
  return changed;
}

/**
 * Log a debug message only in development
 * 
 * @param tag - Category tag for the message
 * @param message - Message to log
 * @param data - Optional data to include
 */
export function debugLog(
  tag: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!import.meta.env.DEV) return;
  
  console.log(
    `%c[${tag}]%c ${message}`,
    'color: #6366f1; font-weight: bold;',
    'color: inherit;',
    data || ''
  );
}

/**
 * Log a warning only in development
 * 
 * @param tag - Category tag for the warning
 * @param message - Warning message
 * @param data - Optional data to include
 */
export function debugWarn(
  tag: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!import.meta.env.DEV) return;
  
  console.warn(`[${tag}] ${message}`, data || '');
}
