/**
 * OptimizedVolumeSlider - High-performance volume control
 * Uses CSS transforms and throttled updates
 */

import React, { memo, useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

interface OptimizedVolumeSliderProps {
  value: number; // 0-1
  onChange: (value: number) => void;
  muted?: boolean;
  onMuteToggle?: () => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
}

const SIZES = {
  sm: { track: 80, thumb: 12, icon: 14 },
  md: { track: 100, thumb: 16, icon: 16 },
  lg: { track: 120, thumb: 20, icon: 18 },
} as const;

export const OptimizedVolumeSlider = memo(function OptimizedVolumeSlider({
  value,
  onChange,
  muted = false,
  onMuteToggle,
  orientation = 'horizontal',
  size = 'md',
  showIcon = true,
  className,
  trackClassName,
  thumbClassName,
}: OptimizedVolumeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastValueRef = useRef(value);
  const throttleRef = useRef<number | undefined>(undefined);
  
  const { track: trackSize, thumb: thumbSize, icon: iconSize } = SIZES[size];
  const isVertical = orientation === 'vertical';
  
  const displayValue = muted ? 0 : value;

  // Calculate position from mouse/touch event
  const getValueFromEvent = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const track = trackRef.current;
    if (!track) return value;
    
    const rect = track.getBoundingClientRect();
    const clientPos = 'touches' in e 
      ? (e.touches[0] || e.changedTouches[0])
      : e;
    
    let newValue: number;
    if (isVertical) {
      const y = clientPos.clientY - rect.top;
      newValue = 1 - (y / rect.height);
    } else {
      const x = clientPos.clientX - rect.left;
      newValue = x / rect.width;
    }
    
    return Math.max(0, Math.min(1, newValue));
  }, [isVertical, value]);

  // Throttled update
  const updateValue = useCallback((newValue: number) => {
    if (Math.abs(newValue - lastValueRef.current) < 0.01) return;
    
    lastValueRef.current = newValue;
    
    if (throttleRef.current) {
      cancelAnimationFrame(throttleRef.current);
    }
    
    throttleRef.current = requestAnimationFrame(() => {
      onChange(newValue);
    });
  }, [onChange]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const newValue = getValueFromEvent(e);
    updateValue(newValue);
    
    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromEvent(e);
      updateValue(newValue);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getValueFromEvent, updateValue]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    
    const newValue = getValueFromEvent(e);
    updateValue(newValue);
    
    const handleTouchMove = (e: TouchEvent) => {
      const newValue = getValueFromEvent(e);
      updateValue(newValue);
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  }, [getValueFromEvent, updateValue]);

  // Get volume icon
  const VolumeIcon = muted || displayValue === 0 
    ? VolumeX 
    : displayValue < 0.5 
      ? Volume1 
      : Volume2;

  // Calculate fill percentage
  const fillPercent = displayValue * 100;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        isVertical && 'flex-col-reverse',
        className
      )}
    >
      {showIcon && (
        <button
          type="button"
          onClick={onMuteToggle}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <VolumeIcon size={iconSize} />
        </button>
      )}
      
      <div
        ref={trackRef}
        className={cn(
          'relative rounded-full bg-muted cursor-pointer touch-none',
          isVertical ? 'w-2' : 'h-2',
          trackClassName
        )}
        style={{
          [isVertical ? 'height' : 'width']: trackSize,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Fill */}
        <div
          className={cn(
            'absolute rounded-full bg-primary transition-[width,height] duration-75',
            isVertical ? 'bottom-0 left-0 right-0' : 'top-0 bottom-0 left-0'
          )}
          style={{
            [isVertical ? 'height' : 'width']: `${fillPercent}%`,
          }}
        />
        
        {/* Thumb */}
        <div
          className={cn(
            'absolute rounded-full bg-primary shadow-md',
            'transform -translate-x-1/2 -translate-y-1/2',
            isDragging && 'scale-110',
            'transition-transform duration-75',
            thumbClassName
          )}
          style={{
            width: thumbSize,
            height: thumbSize,
            [isVertical ? 'bottom' : 'left']: `${fillPercent}%`,
            [isVertical ? 'left' : 'top']: '50%',
            transform: isVertical
              ? `translate(-50%, 50%)`
              : `translate(-50%, -50%)`,
          }}
        />
      </div>
      
      {/* Value display */}
      <span className="text-xs text-muted-foreground min-w-[2.5ch] text-center tabular-nums">
        {Math.round(displayValue * 100)}
      </span>
    </div>
  );
});
