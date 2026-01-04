/**
 * LEDIndicator - Realistic LED indicator light
 * For showing on/off states with glow effect
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

export interface LEDIndicatorProps {
  on: boolean;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'primary';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

const colorMap = {
  green: {
    on: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    off: 'bg-emerald-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
    glow: 'rgba(52,211,153,0.6)',
  },
  red: {
    on: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    off: 'bg-red-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
    glow: 'rgba(239,68,68,0.6)',
  },
  yellow: {
    on: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    off: 'bg-yellow-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
    glow: 'rgba(250,204,21,0.6)',
  },
  blue: {
    on: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    off: 'bg-blue-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
    glow: 'rgba(96,165,250,0.6)',
  },
  orange: {
    on: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    off: 'bg-orange-900/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
    glow: 'rgba(251,146,60,0.6)',
  },
  primary: {
    on: 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8),inset_0_1px_2px_rgba(255,255,255,0.4)]',
    off: 'bg-primary/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]',
    glow: 'hsl(var(--primary) / 0.6)',
  },
};

const sizeMap = {
  xs: 'w-2 h-2',
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const LEDIndicator = memo(function LEDIndicator({
  on,
  color = 'green',
  size = 'sm',
  pulse = false,
  label,
  labelPosition = 'right',
  className,
}: LEDIndicatorProps) {
  const colors = colorMap[color];
  const sizeClass = sizeMap[size];

  const led = (
    <div
      className={cn(
        'rounded-full border border-black/30 transition-all duration-150',
        sizeClass,
        on ? colors.on : colors.off,
        pulse && on && 'animate-pulse'
      )}
    >
      {/* Inner highlight */}
      {on && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
      )}
    </div>
  );

  if (!label) {
    return <div className={cn('relative', className)}>{led}</div>;
  }

  const labelClasses = cn(
    'text-[9px] font-medium uppercase tracking-wide',
    on ? 'text-foreground' : 'text-muted-foreground'
  );

  const containerClasses = cn(
    'flex items-center gap-1.5',
    labelPosition === 'top' && 'flex-col-reverse',
    labelPosition === 'bottom' && 'flex-col',
    labelPosition === 'left' && 'flex-row-reverse',
    className
  );

  return (
    <div className={containerClasses}>
      <div className="relative">{led}</div>
      <span className={labelClasses}>{label}</span>
    </div>
  );
});

export default LEDIndicator;
