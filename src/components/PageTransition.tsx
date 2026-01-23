/**
 * PageTransition - Animated wrapper for page transitions
 * OPTIMIZED: Uses CSS animations for better performance
 */

import { memo, ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  /** Animation variant */
  variant?: 'fade' | 'slide-up' | 'slide-left' | 'scale';
  /** Animation duration in ms */
  duration?: number;
}

const variantClasses = {
  fade: 'page-fade',
  'slide-up': 'page-slide-up',
  'slide-left': 'page-slide-left',
  scale: 'page-scale',
};

export const PageTransition = memo(function PageTransition({
  children,
  className,
  variant = 'fade',
  duration = 200,
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on next frame for smooth entry
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "w-full",
        variantClasses[variant],
        isVisible && "page-visible",
        className
      )}
      style={{ 
        '--page-duration': `${duration}ms`,
        willChange: 'opacity, transform',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
});

/**
 * Staggered children animation wrapper
 * Uses CSS stagger delays for performance
 */
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = memo(function StaggerContainer({
  children,
  className,
  staggerDelay = 50,
}: StaggerContainerProps) {
  return (
    <div 
      className={cn("stagger-container", className)}
      style={{ '--stagger-delay': `${staggerDelay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
});

/**
 * Stagger item - use inside StaggerContainer
 */
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export const StaggerItem = memo(function StaggerItem({ 
  children, 
  className,
  index = 0,
}: StaggerItemProps) {
  return (
    <div
      className={cn("stagger-item", className)}
      style={{ 
        animationDelay: `calc(var(--stagger-delay, 50ms) * ${index})`,
      }}
    >
      {children}
    </div>
  );
});
