/**
 * Touch-friendly interactive components
 * Ensures minimum 44x44px touch targets for mobile accessibility
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from '@/lib/motion';

/**
 * Touch-optimized button wrapper
 * Adds invisible touch area expansion for small buttons
 */
export function TouchTarget({ 
  children, 
  className,
  minSize = 44,
}: { 
  children: React.ReactNode;
  className?: string;
  minSize?: number;
}) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {/* Invisible touch target expansion */}
      <span 
        className="absolute -inset-2"
        style={{ minWidth: minSize, minHeight: minSize }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/**
 * Touch-friendly icon button with proper sizing
 */
interface TouchIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
}

export const TouchIconButton = React.forwardRef<HTMLButtonElement, TouchIconButtonProps>(
  ({ icon, label, size = 'md', variant = 'ghost', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'min-w-[44px] min-h-[44px] p-2',
      md: 'min-w-[48px] min-h-[48px] p-2.5',
      lg: 'min-w-[56px] min-h-[56px] p-3',
    };
    
    const variantClasses = {
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      solid: 'bg-primary text-primary-foreground hover:bg-primary/90',
    };
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-95 transition-transform',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-label={label}
        {...props}
      >
        {icon}
      </button>
    );
  }
);
TouchIconButton.displayName = 'TouchIconButton';

/**
 * Swipeable card component for touch gestures
 */
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  threshold?: number;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
  threshold = 100,
}: SwipeableCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [dragX, setDragX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const handleDragEnd = (_: never, info: { offset: { x: number } }) => {
    setIsDragging(false);
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setDragX(0);
  };
  
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Background actions */}
      {leftAction && (
        <div 
          className={cn(
            'absolute inset-y-0 left-0 flex items-center justify-start pl-4 w-24',
            'bg-destructive text-destructive-foreground',
            'transition-opacity',
            dragX < -20 ? 'opacity-100' : 'opacity-0'
          )}
        >
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div 
          className={cn(
            'absolute inset-y-0 right-0 flex items-center justify-end pr-4 w-24',
            'bg-primary text-primary-foreground',
            'transition-opacity',
            dragX > 20 ? 'opacity-100' : 'opacity-0'
          )}
        >
          {rightAction}
        </div>
      )}
      
      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        animate={{ x: isDragging ? undefined : 0 }}
        className="relative bg-background"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Haptic feedback utility (iOS/Android)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  // Check for Vibration API support
  if (!navigator.vibrate) return;
  
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 50, 10],
    error: [50, 30, 50],
  };
  
  try {
    navigator.vibrate(patterns[type]);
  } catch {
    // Silently fail if vibration is not supported
  }
}

/**
 * Hook for haptic feedback on interactions
 */
export function useHaptics() {
  return {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    error: () => triggerHaptic('error'),
  };
}
