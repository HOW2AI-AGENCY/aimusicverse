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
}

/**
 * LazySection - renders children only when visible in viewport
 * Uses Intersection Observer for optimal performance
 */
export function LazySection({
  children,
  fallback,
  rootMargin = '400px', // Increased for earlier loading on mobile
  minHeight = '200px',
  className,
  threshold = 0,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if already in viewport on mount (for fast mobile scrolling)
    const rect = element.getBoundingClientRect();
    const isInitiallyVisible = rect.top < window.innerHeight + 400;
    
    if (isInitiallyVisible) {
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
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

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  // Default skeleton fallback
  const defaultFallback = (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        <Skeleton className="h-40 w-36 rounded-xl shrink-0" />
        <Skeleton className="h-40 w-36 rounded-xl shrink-0" />
        <Skeleton className="h-40 w-36 rounded-xl shrink-0" />
      </div>
    </div>
  );

  return (
    <div 
      ref={ref} 
      className={cn(className)}
      style={{ minHeight: hasBeenVisible ? 'auto' : minHeight }}
    >
      {hasBeenVisible ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
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
