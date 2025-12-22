/**
 * HardwareKnob - Realistic rotary knob component
 * Inspired by professional audio equipment like synthesizers and mixing consoles
 */

import React, { useCallback, useRef, useState, memo } from 'react';
import { cn } from '@/lib/utils';

export interface HardwareKnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light' | 'vintage' | 'modern';
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  showTicks?: boolean;
  tickCount?: number;
  tickLabels?: string[];
  bipolar?: boolean;
  disabled?: boolean;
  className?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

const sizeMap = {
  xs: { outer: 36, inner: 28, indicator: 3, fontSize: 'text-[9px]' },
  sm: { outer: 48, inner: 38, indicator: 4, fontSize: 'text-[10px]' },
  md: { outer: 64, inner: 52, indicator: 5, fontSize: 'text-xs' },
  lg: { outer: 80, inner: 66, indicator: 6, fontSize: 'text-sm' },
  xl: { outer: 96, inner: 80, indicator: 7, fontSize: 'text-base' },
};

const colorMap = {
  default: 'hsl(var(--primary))',
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
};

export const HardwareKnob = memo(function HardwareKnob({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  size = 'md',
  variant = 'dark',
  label,
  showValue = true,
  valueFormatter,
  showTicks = false,
  tickCount = 11,
  tickLabels,
  bipolar = false,
  disabled = false,
  className,
  color = 'default',
}: HardwareKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(value);

  const { outer, inner, indicator, fontSize } = sizeMap[size];
  const indicatorColor = colorMap[color];

  // Convert value to rotation angle (270° range, from -135° to +135°)
  const normalizedValue = (value - min) / (max - min);
  const rotation = -135 + normalizedValue * 270;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startY.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 150; // Pixels per full range
      let newValue = startValue.current + delta * sensitivity;
      newValue = Math.round(newValue / step) * step;
      newValue = Math.max(min, Math.min(max, newValue));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, value, min, max, step, onChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startValue.current = value;
  }, [disabled, value]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = startY.current - e.touches[0].clientY;
    const range = max - min;
    const sensitivity = range / 150;
    let newValue = startValue.current + delta * sensitivity;
    newValue = Math.round(newValue / step) * step;
    newValue = Math.max(min, Math.min(max, newValue));
    onChange(newValue);
  }, [isDragging, min, max, step, onChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -step : step;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  }, [disabled, value, min, max, step, onChange]);

  const displayValue = valueFormatter ? valueFormatter(value) : 
    bipolar ? (value > 0 ? `+${value}` : `${value}`) : `${value}`;

  // Generate tick marks
  const ticks = showTicks ? Array.from({ length: tickCount }, (_, i) => {
    const angle = -135 + (i / (tickCount - 1)) * 270;
    const isActive = (i / (tickCount - 1)) <= normalizedValue;
    return { angle, isActive, label: tickLabels?.[i] };
  }) : [];

  const variantStyles = {
    dark: {
      outer: 'bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.4)]',
      inner: 'bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.3)]',
      ring: 'border-zinc-600',
    },
    light: {
      outer: 'bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.15)]',
      inner: 'bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.1)]',
      ring: 'border-zinc-300',
    },
    vintage: {
      outer: 'bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 shadow-[inset_0_2px_4px_rgba(255,200,100,0.15),inset_0_-2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.4)]',
      inner: 'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 shadow-[inset_0_1px_2px_rgba(255,200,100,0.2),0_2px_4px_rgba(0,0,0,0.3)]',
      ring: 'border-amber-700',
    },
    modern: {
      outer: 'bg-gradient-to-b from-slate-800 via-slate-900 to-black shadow-[inset_0_2px_4px_rgba(100,150,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.5)]',
      inner: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-[inset_0_1px_2px_rgba(100,150,255,0.15),0_2px_4px_rgba(0,0,0,0.4)]',
      ring: 'border-slate-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label && (
        <span className={cn('text-muted-foreground font-medium uppercase tracking-wider', fontSize)}>
          {label}
        </span>
      )}
      
      <div className="relative" style={{ width: outer + 16, height: outer + 16 }}>
        {/* Tick marks */}
        {showTicks && ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${tick.angle}deg)`,
            }}
          >
            <div
              className={cn(
                'absolute rounded-full transition-colors',
                tick.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
              style={{
                width: 2,
                height: size === 'xs' ? 4 : 6,
                top: -(outer / 2 + 6),
                left: -1,
              }}
            />
          </div>
        ))}

        {/* Outer ring / bezel */}
        <div
          ref={knobRef}
          className={cn(
            'absolute rounded-full cursor-pointer transition-transform',
            styles.outer,
            isDragging && 'scale-105',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            width: outer,
            height: outer,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Inner knob with rotation */}
          <div
            className={cn(
              'absolute rounded-full',
              styles.inner,
              `border ${styles.ring}`
            )}
            style={{
              width: inner,
              height: inner,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Position indicator line */}
            <div
              className="absolute rounded-full"
              style={{
                width: indicator,
                height: inner * 0.35,
                backgroundColor: indicatorColor,
                left: '50%',
                top: 4,
                transform: 'translateX(-50%)',
                boxShadow: `0 0 6px ${indicatorColor}`,
              }}
            />
          </div>
        </div>
      </div>

      {showValue && (
        <span className={cn(
          'font-mono font-semibold tabular-nums',
          fontSize,
          bipolar && value > 0 && 'text-success',
          bipolar && value < 0 && 'text-destructive',
          !bipolar && 'text-foreground'
        )}>
          {displayValue}
        </span>
      )}
    </div>
  );
});

export default HardwareKnob;
