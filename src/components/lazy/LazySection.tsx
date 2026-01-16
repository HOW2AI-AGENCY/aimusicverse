import { useRef, useState, useEffect, ReactNode, Suspense } from 'react';
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
}

/**
 * LazySection - renders children only when visible in viewport
 * Uses Intersection Observer for optimal performance
 */
export function LazySection({
  children,
  fallback,
  rootMargin = '100px', // Reduced for faster trigger
  minHeight = '100px',
  className,
  threshold = 0,
  skipSuspense = false,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if already in viewport on mount
    const rect = element.getBoundingClientRect();
    const margin = 150;
    const isInitiallyVisible = rect.top < window.innerHeight + margin;
    
    if (isInitiallyVisible) {
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
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
  }, [rootMargin, threshold]);

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

  // Not visible yet - show fallback
  if (!hasBeenVisible) {
    return (
      <div 
        ref={ref} 
        className={cn(className)}
        style={{ minHeight }}
      >
        {fallback ?? defaultFallback}
      </div>
    );
  }

  // Visible - render children (with optional Suspense)
  return (
    <div ref={ref} className={cn(className)}>
      {skipSuspense ? (
        children
      ) : (
        <Suspense fallback={fallback ?? defaultFallback}>
          {children}
        </Suspense>
      )}
    </div>
  );
}

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
