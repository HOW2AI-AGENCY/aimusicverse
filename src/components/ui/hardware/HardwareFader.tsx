/**
 * HardwareFader - Vertical fader component
 * Styled like professional mixing console faders
 */

import React, { useCallback, useRef, useState, memo } from 'react';
import { cn } from '@/lib/utils';

export interface HardwareFaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  height?: number;
  width?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  showTicks?: boolean;
  tickLabels?: string[];
  disabled?: boolean;
  className?: string;
  variant?: 'dark' | 'light' | 'channel';
}

export const HardwareFader = memo(function HardwareFader({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  height = 160,
  width = 44,
  label,
  showValue = true,
  valueFormatter,
  showTicks = true,
  tickLabels = ['+12', '+6', '0', '-6', '-12', '-24', '-∞'],
  disabled = false,
  className,
  variant = 'dark',
}: HardwareFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const normalizedValue = (value - min) / (max - min);
  const handlePosition = (1 - normalizedValue) * (height - 40); // 40px handle height

  const updateValue = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top - 20; // Center of handle
    const trackHeight = height - 40;
    const normalizedY = Math.max(0, Math.min(1, relativeY / trackHeight));
    const newValue = max - normalizedY * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    onChange(Math.max(min, Math.min(max, steppedValue)));
  }, [height, min, max, step, onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientY);

    const handleMouseMove = (e: MouseEvent) => updateValue(e.clientY);
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, updateValue]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.touches[0].clientY);
  }, [disabled, updateValue]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    updateValue(e.touches[0].clientY);
  }, [isDragging, updateValue]);

  const displayValue = valueFormatter ? valueFormatter(value) : `${value}`;

  const variantStyles = {
    dark: {
      track: 'bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900',
      groove: 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950',
      handle: 'bg-gradient-to-b from-zinc-400 via-zinc-500 to-zinc-600',
      handleHighlight: 'from-zinc-300 to-transparent',
    },
    light: {
      track: 'bg-gradient-to-b from-zinc-200 via-zinc-300 to-zinc-200',
      groove: 'bg-gradient-to-r from-zinc-400 via-zinc-350 to-zinc-400',
      handle: 'bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300',
      handleHighlight: 'from-white to-transparent',
    },
    channel: {
      track: 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800',
      groove: 'bg-gradient-to-r from-black via-slate-950 to-black',
      handle: 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600',
      handleHighlight: 'from-amber-300 to-transparent',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {label && (
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
      )}

      <div className="flex items-stretch gap-1">
        {/* Tick marks / Scale */}
        {showTicks && (
          <div 
            className="flex flex-col justify-between py-5"
            style={{ height }}
          >
            {tickLabels.map((tick, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-px bg-muted-foreground/50" />
                <span className="text-[8px] text-muted-foreground font-mono w-6 text-right">
                  {tick}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Fader track */}
        <div
          ref={trackRef}
          className={cn(
            'relative rounded-md cursor-pointer',
            styles.track,
            'shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),0_1px_2px_rgba(255,255,255,0.1)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ width, height }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* Center groove */}
          <div 
            className={cn(
              'absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-1 rounded-full',
              styles.groove,
              'shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]'
            )}
          />

          {/* Active fill */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 bottom-4 w-1 rounded-full bg-primary/60"
            style={{ 
              height: `${normalizedValue * (height - 32)}px`,
              boxShadow: '0 0 8px hsl(var(--primary) / 0.5)'
            }}
          />

          {/* Fader handle */}
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 rounded-md transition-shadow',
              styles.handle,
              'shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]',
              isDragging && 'shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.4)]'
            )}
            style={{
              width: width - 8,
              height: 40,
              top: handlePosition,
            }}
          >
            {/* Handle highlight */}
            <div className={cn(
              'absolute inset-x-1 top-1 h-1/3 rounded-t bg-gradient-to-b opacity-60',
              styles.handleHighlight
            )} />
            
            {/* Handle grip lines */}
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-px bg-black/20" />
              ))}
            </div>

            {/* Center marker */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-1 rounded-full bg-primary shadow-[0_0_4px_hsl(var(--primary))]" />
          </div>
        </div>
      </div>

      {showValue && (
        <div className="px-2 py-0.5 rounded bg-secondary/50 border border-border/50">
          <span className="text-[10px] font-mono font-semibold tabular-nums">
            {displayValue}
          </span>
        </div>
      )}
    </div>
  );
});

export default HardwareFader;
