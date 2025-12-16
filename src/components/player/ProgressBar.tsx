/**
 * Progress Bar Component
 * 
 * Interactive audio playback progress bar with buffering visualization.
 * Supports touch and mouse interactions for seeking.
 */

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { motion } from '@/lib/motion';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  buffered?: number;
  className?: string;
  size?: 'compact' | 'default' | 'large';
  showLabels?: boolean;
}

export function ProgressBar({ 
  currentTime, 
  duration, 
  onSeek, 
  buffered = 0,
  className,
  size = 'default',
  showLabels = true
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);
  const [isHovering, setIsHovering] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;
    
    setLocalTime(newTime);
    onSeek(newTime);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSeek(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const progress = duration > 0 ? (localTime / duration) * 100 : 0;
  const bufferedPercent = buffered;

  const trackHeight = size === 'compact' ? 'h-1' : size === 'large' ? 'h-2.5' : 'h-1.5';
  const trackHoverHeight = size === 'compact' ? 'group-hover:h-1.5' : size === 'large' ? 'group-hover:h-3' : 'group-hover:h-2';
  const handleSize = size === 'compact' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="relative cursor-pointer touch-manipulation group py-3"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role="slider"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={localTime}
      >
        {/* Track background */}
        <div className={cn(
          "absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-secondary/60 rounded-full overflow-hidden transition-all duration-200",
          trackHeight,
          trackHoverHeight
        )}>
          {/* Buffered Progress */}
          <div
            className="absolute left-0 top-0 h-full bg-muted-foreground/25 transition-all rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          
          {/* Current Progress with animated gradient */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-primary to-generate rounded-full"
            style={{ width: `${progress}%` }}
            layoutId="progress"
          >
            {/* Animated shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer opacity-60" />
          </motion.div>
        </div>
        
        {/* Draggable handle with glow */}
        <motion.div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-xl transition-all duration-150",
            handleSize,
            (isDragging || isHovering) ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )}
          style={{ 
            left: `calc(${progress}% - ${size === 'large' ? 10 : 8}px)`,
          }}
          animate={{
            boxShadow: isDragging 
              ? '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3)'
              : '0 0 12px hsl(var(--primary) / 0.4)'
          }}
        >
          <div className="absolute inset-1 bg-primary rounded-full" />
        </motion.div>

        {/* Time preview tooltip during drag */}
        {isDragging && (
          <motion.div
            className="absolute -top-8 px-2 py-1 bg-popover text-popover-foreground text-xs font-medium rounded-md shadow-lg border"
            style={{ left: `calc(${progress}% - 20px)` }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {formatTime(localTime)}
          </motion.div>
        )}
      </div>

      {/* Time Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span className="tabular-nums">{formatTime(localTime)}</span>
          <span className="tabular-nums text-muted-foreground/70">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
