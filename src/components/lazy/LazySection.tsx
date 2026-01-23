import { useRef, useState, useEffect, ReactNode, Suspense, memo, useLayoutEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: ReactNode;
  /** Custom fallback while loading */
  fallback?: ReactNode;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Minimum height for skeleton - should match expected content height */
  minHeight?: string;
  /** Class name for wrapper */
  className?: string;
  /** Threshold for intersection (0-1) */
  threshold?: number;
  /** Skip Suspense wrapper if children handle their own loading */
  skipSuspense?: boolean;
  /** Eager load - render immediately without waiting for visibility */
  eager?: boolean;
  /** Preserve space after loading to prevent layout shifts */
  preserveHeight?: boolean;
}

/**
 * LazySection - renders children only when visible in viewport
 * Uses Intersection Observer for optimal performance
 * 
 * FIXED: Scroll anchoring issues resolved by:
 * 1. Using contain-intrinsic-size for content-visibility optimization
 * 2. Setting overflow-anchor: none on loading state to prevent scroll jumps
 * 3. Preserving container height after loading to prevent layout collapse
 */
export const LazySection = memo(function LazySection({
  children,
  fallback,
  rootMargin = '300px', // Increased for earlier trigger
  minHeight = '120px',
  className,
  threshold = 0,
  skipSuspense = false,
  eager = false,
  preserveHeight = true,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(eager);
  const [isReady, setIsReady] = useState(eager);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // Measure content height after render to prevent layout shifts
  const measureHeight = useCallback(() => {
    if (preserveHeight && ref.current && isReady) {
      const height = ref.current.offsetHeight;
      if (height > 0) {
        setMeasuredHeight(height);
      }
    }
  }, [preserveHeight, isReady]);

  // Measure after ready state changes
  useEffect(() => {
    if (isReady) {
      // Use RAF to ensure DOM has updated
      requestAnimationFrame(() => {
        measureHeight();
      });
    }
  }, [isReady, measureHeight]);

  // Synchronous initial visibility check to avoid flash
  useLayoutEffect(() => {
    if (eager || hasBeenVisible) return;
    
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const margin = 400; // Large margin for faster trigger
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
          // Immediate ready for faster content display
          setIsReady(true);
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

  // Default skeleton fallback - optimized for scroll performance
  const defaultFallback = (
    <div className="space-y-3" style={{ contain: 'layout paint' }}>
      <Skeleton className="h-5 w-32" shimmer={false} />
      <div className="flex gap-3 overflow-hidden">
        <Skeleton className="h-32 w-32 rounded-xl shrink-0" shimmer={false} />
        <Skeleton className="h-32 w-32 rounded-xl shrink-0" shimmer={false} />
      </div>
    </div>
  );

  // Use provided fallback or default
  const loadingFallback = fallback ?? defaultFallback;

  // Not visible yet - show fallback
  // Key fix: overflow-anchor: none prevents scroll position jumps when content changes
  if (!hasBeenVisible) {
    return (
      <div 
        ref={ref} 
        className={cn(className)}
        style={{ 
          minHeight: fallback === null ? undefined : minHeight,
          // Prevent scroll anchoring to this element while loading
          overflowAnchor: 'none',
          // Hint to browser about intrinsic size for scroll calculations
          containIntrinsicSize: `auto ${minHeight}`,
          contentVisibility: 'auto',
        }}
      >
        {loadingFallback}
      </div>
    );
  }

  // Visible and ready - render children
  return (
    <div 
      ref={ref} 
      className={cn(className)}
      style={{
        // Once loaded, allow anchoring and preserve height
        overflowAnchor: 'auto',
        // If we measured height, use it to prevent collapse during re-renders
        minHeight: measuredHeight ? `${measuredHeight}px` : undefined,
      }}
    >
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
