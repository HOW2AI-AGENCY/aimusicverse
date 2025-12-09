import { memo, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useIntersectionObserver, useReducedMotion } from '@/hooks/usePerformanceOptimization';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  rootMargin?: string;
  animate?: boolean;
}

/**
 * Lazy load component when it enters viewport
 */
export const LazyComponent = memo(function LazyComponent({
  children,
  fallback,
  className,
  rootMargin = '100px',
  animate = true,
}: LazyComponentProps) {
  const [ref, isVisible] = useIntersectionObserver({ 
    rootMargin, 
    triggerOnce: true 
  });
  const { shouldAnimate } = useReducedMotion();

  const defaultFallback = (
    <div className={cn("w-full h-32", className)}>
      <Skeleton className="w-full h-full" />
    </div>
  );

  if (!isVisible) {
    return <div ref={ref}>{fallback || defaultFallback}</div>;
  }

  if (animate && shouldAnimate) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return <div ref={ref} className={className}>{children}</div>;
});

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  emptyState?: ReactNode;
}

/**
 * Optimized animated list with staggered animations
 */
export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemClassName,
  staggerDelay = 0.05,
  emptyState,
}: AnimatedListProps<T>) {
  const { shouldAnimate } = useReducedMotion();

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  if (!shouldAnimate) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={keyExtractor(item)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * staggerDelay }}
            className={itemClassName}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Simple fade-in wrapper respecting reduced motion
 */
export const FadeIn = memo(function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: FadeInProps) {
  const { shouldAnimate } = useReducedMotion();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scale-in animation wrapper
 */
export const ScaleIn = memo(function ScaleIn({
  children,
  delay = 0,
  className,
}: ScaleInProps) {
  const { shouldAnimate } = useReducedMotion();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

/**
 * Slide-in animation wrapper
 */
export const SlideIn = memo(function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  className,
}: SlideInProps) {
  const { shouldAnimate } = useReducedMotion();

  const offsets = {
    left: { x: -20, y: 0 },
    right: { x: 20, y: 0 },
    up: { x: 0, y: 20 },
    down: { x: 0, y: -20 },
  };

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
});
