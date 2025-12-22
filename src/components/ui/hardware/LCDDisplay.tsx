/**
 * LCDDisplay - LCD-style digital display
 * Mimics classic audio equipment displays
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

export interface LCDDisplayProps {
  text: string;
  secondaryText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'green' | 'blue' | 'amber' | 'white';
  width?: number | string;
  className?: string;
  animated?: boolean;
}

const variantStyles = {
  green: {
    bg: 'bg-gradient-to-b from-lime-950 via-lime-900 to-lime-950',
    text: 'text-lime-300',
    glow: 'drop-shadow-[0_0_2px_rgba(190,242,100,0.8)]',
    scanline: 'bg-lime-400/5',
  },
  blue: {
    bg: 'bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950',
    text: 'text-blue-300',
    glow: 'drop-shadow-[0_0_2px_rgba(147,197,253,0.8)]',
    scanline: 'bg-blue-400/5',
  },
  amber: {
    bg: 'bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950',
    text: 'text-amber-300',
    glow: 'drop-shadow-[0_0_2px_rgba(252,211,77,0.8)]',
    scanline: 'bg-amber-400/5',
  },
  white: {
    bg: 'bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900',
    text: 'text-zinc-100',
    glow: 'drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]',
    scanline: 'bg-white/3',
  },
};

const sizeStyles = {
  sm: { padding: 'px-2 py-1', fontSize: 'text-xs', secondary: 'text-[9px]' },
  md: { padding: 'px-3 py-1.5', fontSize: 'text-sm', secondary: 'text-[10px]' },
  lg: { padding: 'px-4 py-2', fontSize: 'text-base', secondary: 'text-xs' },
};

export const LCDDisplay = memo(function LCDDisplay({
  text,
  secondaryText,
  size = 'md',
  variant = 'green',
  width,
  className,
  animated = false,
}: LCDDisplayProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <div
      className={cn(
        'relative rounded-md overflow-hidden',
        styles.bg,
        'border border-zinc-700',
        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.05)]',
        className
      )}
      style={{ width }}
    >
      {/* Scanline effect */}
      <div 
        className={cn(
          'absolute inset-0 pointer-events-none',
          'bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,var(--scanline-color)_2px,var(--scanline-color)_4px)]',
        )}
        style={{ '--scanline-color': 'rgba(0,0,0,0.1)' } as React.CSSProperties}
      />
      
      {/* Content */}
      <div className={cn('relative', sizes.padding)}>
        {/* Main text */}
        <div className={cn(
          'font-mono font-bold uppercase tracking-wider',
          styles.text,
          styles.glow,
          sizes.fontSize,
          animated && 'animate-pulse'
        )}>
          {text}
        </div>
        
        {/* Secondary text */}
        {secondaryText && (
          <div className={cn(
            'font-mono mt-0.5 opacity-70',
            styles.text,
            sizes.secondary
          )}>
            {secondaryText}
          </div>
        )}
      </div>

      {/* Glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
    </div>
  );
});

// Segmented display for numbers
export interface SegmentedDisplayProps {
  value: string | number;
  digits?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'green' | 'blue' | 'amber' | 'white';
  showSign?: boolean;
  label?: string;
  className?: string;
}

export const SegmentedDisplay = memo(function SegmentedDisplay({
  value,
  digits = 4,
  size = 'md',
  variant = 'green',
  showSign = false,
  label,
  className,
}: SegmentedDisplayProps) {
  const styles = variantStyles[variant];
  
  // Format value to fixed digits
  const formattedValue = typeof value === 'number' 
    ? (showSign && value >= 0 ? '+' : '') + value.toString().padStart(digits, ' ')
    : value.toString().padStart(digits, ' ');

  const fontSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label && (
        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
      )}
      
      <div className={cn(
        'relative rounded-md overflow-hidden',
        styles.bg,
        'border border-zinc-700',
        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]',
        'px-3 py-1'
      )}>
        <span className={cn(
          'font-mono font-bold tabular-nums tracking-[0.15em]',
          styles.text,
          styles.glow,
          fontSizes[size]
        )}>
          {formattedValue}
        </span>
        
        {/* Glass effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
});

export default LCDDisplay;
