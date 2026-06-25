/**
 * TouchTarget Component
 *
 * A wrapper component that ensures interactive elements meet minimum
 * touch target size requirements (44px per iOS HIG, 48px per WCAG 2.1 AAA).
 *
 * @example
 * ```tsx
 * <TouchTarget>
 *   <button onClick={handleClick}>Click me</button>
 * </TouchTarget>
 * ```
 *
 * @feature Spec 001 - Phase 2: Foundational Components
 * @priority P1 - Component Maintainability
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TouchTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Minimum touch target size
   * @default 'comfortable'
   */
  size?: 'min' | 'comfortable' | 'large';

  /**
   * Child elements that need touch target sizing
   */
  children: React.ReactNode;

  /**
   * Whether to apply circular sizing for buttons/icons
   * @default false
   */
  circular?: boolean;

  /**
   * Whether to add visual feedback on touch
   * @default true
   */
  feedback?: boolean;
}

const sizeStyles = {
  min: 'min-w-touch min-h-touch',
  comfortable: 'min-w-touch-lg min-h-touch-lg',
  large: 'min-w-touch-xl min-h-touch-xl',
};

const circularStyles = {
  min: 'min-w-[44px] min-h-[44px]',
  comfortable: 'min-w-[48px] min-h-[48px]',
  large: 'min-w-[56px] min-h-[56px]',
};

export const TouchTarget = React.forwardRef<HTMLDivElement, TouchTargetProps>(
  ({
    size = 'comfortable',
    circular = false,
    feedback = true,
    className,
    children,
    onClick,
    onTouchStart,
    onTouchEnd,
    ...props
  }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      if (feedback) {
        setIsPressed(true);
      }
      onTouchEnd?.(e);
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
      if (feedback) {
        setIsPressed(false);
      }
      onTouchEnd?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (feedback) {
        // Brief visual feedback on click
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);
      }
      onClick?.(e);
    };

    const sizeClasses = circular ? circularStyles[size] : sizeStyles[size];
    const feedbackClasses = feedback
      ? 'transition-transform active:scale-95'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          sizeClasses,
          feedbackClasses,
          isPressed && 'scale-95',
          className
        )}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TouchTarget.displayName = 'TouchTarget';
