import { useRef, useState, useEffect, ReactNode, Suspense, memo, useLayoutEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: ReactNode;
  /** Custom fallback while loading */
  fallback?: ReactNode;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Minimum height for skeleton */
  minHeight?: string;
  /** Class name for wrapper */
  className?: string;
  /** Threshold for intersection (0-1) */
  threshold?: number;
  /** Skip Suspense wrapper if children handle their own loading */
  skipSuspense?: boolean;
  /** Eager load - render immediately without waiting for visibility */
  eager?: boolean;
}

/**
 * LazySection - renders children only when visible in viewport
 * Uses Intersection Observer for optimal performance
 * FIXED: No double skeleton, faster initial visibility check
 */
export const LazySection = memo(function LazySection({
  children,
  fallback,
  rootMargin = '200px', // Increased for earlier trigger
  minHeight = '100px',
  className,
  threshold = 0,
  skipSuspense = false,
  eager = false,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(eager);
  const [isReady, setIsReady] = useState(eager);

  // Synchronous initial visibility check to avoid flash
  useLayoutEffect(() => {
    if (eager || hasBeenVisible) return;
    
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const margin = 300; // Large margin for faster trigger
    const isInitiallyVisible = rect.top < window.innerHeight + margin;
    
    if (isInitiallyVisible) {
      setHasBeenVisible(true);
      setIsReady(true);
    }
  }, [eager, hasBeenVisible]);

  useEffect(() => {
    if (eager || hasBeenVisible) return;
    
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
          // Small delay to ensure smooth transition
          requestAnimationFrame(() => setIsReady(true));
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, threshold, eager, hasBeenVisible]);

  // Default skeleton fallback - minimal
  const defaultFallback = (
    <div className="space-y-3 animate-pulse">
      <Skeleton className="h-5 w-32" />
      <div className="flex gap-3 overflow-hidden">
        <Skeleton className="h-32 w-32 rounded-xl shrink-0" />
        <Skeleton className="h-32 w-32 rounded-xl shrink-0" />
      </div>
    </div>
  );

  // Use provided fallback or default
  const loadingFallback = fallback ?? defaultFallback;

  // Not visible yet - show fallback (or nothing if fallback is null)
  if (!hasBeenVisible) {
    return (
      <div 
        ref={ref} 
        className={cn(className)}
        style={{ minHeight: fallback === null ? undefined : minHeight }}
      >
        {loadingFallback}
      </div>
    );
  }

  // Visible and ready - render children WITHOUT double Suspense
  // The key change: we don't wrap in Suspense if skipSuspense is true OR if already ready
  return (
    <div ref={ref} className={cn(className)}>
      {skipSuspense || isReady ? (
        children
      ) : (
        <Suspense fallback={loadingFallback}>
          {children}
        </Suspense>
      )}
    </div>
  );
});

/**
 * Skeleton for section header with icon
 */
export function SectionSkeleton({ height = '200px' }: { height?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="rounded-xl shrink-0" style={{ height, width: '144px' }} />
        ))}
      </div>
    </div>
  );
}
