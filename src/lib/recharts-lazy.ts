/**
 * Lazy-loaded Recharts module
 * 
 * This module provides a hook for dynamically importing Recharts
 * to reduce initial bundle size. Recharts is ~200KB and should
 * only be loaded when chart components are actually rendered.
 * 
 * Usage:
 * ```tsx
 * import { useRecharts } from '@/lib/recharts-lazy';
 * 
 * function MyChart() {
 *   const { recharts, isLoading } = useRecharts();
 *   
 *   if (isLoading || !recharts) return <Skeleton />;
 *   
 *   const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } = recharts;
 *   return (
 *     <ResponsiveContainer>
 *       <LineChart data={data}>
 *         <XAxis dataKey="name" />
 *         <YAxis />
 *         <Tooltip />
 *         <Line type="monotone" dataKey="value" />
 *       </LineChart>
 *     </ResponsiveContainer>
 *   );
 * }
 * ```
 */

import { useState, useEffect } from 'react';

// Type for the recharts module
export type RechartsModule = typeof import('recharts');

// Cached module reference to avoid re-importing
let cachedModule: RechartsModule | null = null;
let loadingPromise: Promise<RechartsModule> | null = null;

/**
 * Hook to lazily load Recharts module
 * Returns { recharts, isLoading, error }
 */
export function useRecharts(): {
  recharts: RechartsModule | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [recharts, setRecharts] = useState<RechartsModule | null>(cachedModule);
  const [isLoading, setIsLoading] = useState(!cachedModule);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Already cached
    if (cachedModule) {
      setRecharts(cachedModule);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadModule = async () => {
      try {
        // Reuse existing promise if already loading
        if (!loadingPromise) {
          loadingPromise = import('recharts');
        }
        
        const mod = await loadingPromise;
        cachedModule = mod;
        
        if (mounted) {
          setRecharts(mod);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadModule();

    return () => {
      mounted = false;
    };
  }, []);

  return { recharts, isLoading, error };
}

/**
 * Preload Recharts module (call on hover/focus of chart container)
 * Returns a promise that resolves when loaded
 */
export function preloadRecharts(): Promise<RechartsModule> {
  if (cachedModule) {
    return Promise.resolve(cachedModule);
  }
  
  if (!loadingPromise) {
    loadingPromise = import('recharts').then((mod) => {
      cachedModule = mod;
      return mod;
    });
  }
  
  return loadingPromise;
}

/**
 * Check if Recharts is already loaded
 */
export function isRechartsLoaded(): boolean {
  return cachedModule !== null;
}
