/**
 * Optimized Animation Components v2
 * Pure CSS animations with JS fallback for complex cases
 */

import { memo, ReactNode, useRef, useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/usePerformanceOptimization';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  rootMargin?: string;
}

/**
 * Lazy load component using Intersection Observer + CSS animation
 */
export const LazyComponent = memo(function LazyComponent({
  children,
  fallback,
  className,
  rootMargin = '100px',
}: LazyComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (!isVisible) {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        {fallback || <Skeleton className="w-full h-32" />}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("lazy-visible", className)}>
      {children}
    </div>
  );
});

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  itemClassName?: string;
  emptyState?: ReactNode;
}

/**
 * CSS-animated list with stagger effect
 */
export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemClassName,
  emptyState,
}: AnimatedListProps<T>) {
  const { shouldAnimate } = useReducedMotion();

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn(shouldAnimate && "stagger-container", className)}>
      {items.map((item, index) => (
        <div 
          key={keyExtractor(item)} 
          className={cn(shouldAnimate && "stagger-item", itemClassName)}
          style={shouldAnimate ? { animationDelay: `${index * 50}ms` } : undefined}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Simple CSS fade-in
 */
export const FadeIn = memo(function FadeIn({
  children,
  delay = 0,
  className,
}: FadeInProps) {
  const { shouldAnimate } = useReducedMotion();

  return (
    <div 
      className={cn(shouldAnimate && "animate-fade-in", className)}
      style={delay ? { animationDelay: `${delay * 1000}ms` } : undefined}
    >
      {children}
    </div>
  );
});

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * CSS scale-in animation
 */
export const ScaleIn = memo(function ScaleIn({
  children,
  delay = 0,
  className,
}: ScaleInProps) {
  const { shouldAnimate } = useReducedMotion();

  return (
    <div 
      className={cn(shouldAnimate && "animate-scale-in", className)}
      style={delay ? { animationDelay: `${delay * 1000}ms` } : undefined}
    >
      {children}
    </div>
  );
});

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

const slideClasses = {
  left: 'animate-slide-left',
  right: 'animate-slide-right',
  up: 'animate-slide-up',
  down: 'animate-slide-down',
};

/**
 * CSS slide-in animation
 */
export const SlideIn = memo(function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  className,
}: SlideInProps) {
  const { shouldAnimate } = useReducedMotion();

  return (
    <div 
      className={cn(shouldAnimate && slideClasses[direction], className)}
      style={delay ? { animationDelay: `${delay * 1000}ms` } : undefined}
    >
      {children}
    </div>
  );
});
