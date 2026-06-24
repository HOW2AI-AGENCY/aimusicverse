/**
 * AnimatedCounter Component
 * Feature: 032-professional-ui
 * 
 * Declarative counter animation component.
 */

import { memo } from 'react';
import { useSmoothCounter } from '@/hooks/useSmoothCounter';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'spring';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * AnimatedCounter - Animates a number counting up
 * 
 * @example
 * <AnimatedCounter to={1500} suffix=" треков" className="text-2xl" />
 */
export const AnimatedCounter = memo(function AnimatedCounter({
  from = 0,
  to,
  duration = 1000,
  easing = 'easeOut',
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const { displayValue } = useSmoothCounter({
    from,
    to,
    duration,
    easing,
    decimals,
  });

  return (
    <span className={cn(className)}>
      {prefix}{displayValue}{suffix}
    </span>
  );
});

export default AnimatedCounter;
