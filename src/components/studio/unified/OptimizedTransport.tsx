/**
 * OptimizedTransport - Lightweight transport controls
 * Uses RAF for smooth time display updates
 */

import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Repeat,
  Repeat1,
} from 'lucide-react';
import { formatTime } from '@/lib/formatters';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface OptimizedTransportProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  loopMode?: 'none' | 'all' | 'one';
  onLoopModeChange?: (mode: 'none' | 'all' | 'one') => void;
  className?: string;
  compact?: boolean;
}

// Memoized time display with RAF updates
const TimeDisplay = memo(function TimeDisplay({ 
  currentTime, 
  duration,
  className,
}: { 
  currentTime: number; 
  duration: number;
  className?: string;
}) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const lastTimeRef = useRef(-1);
  
  useEffect(() => {
    // Only update DOM if time changed by at least 0.1s
    if (Math.abs(currentTime - lastTimeRef.current) >= 0.1) {
      lastTimeRef.current = currentTime;
      if (displayRef.current) {
        displayRef.current.textContent = formatTime(currentTime);
      }
    }
  }, [currentTime]);

  return (
    <div className={cn('flex items-center gap-1 font-mono text-xs tabular-nums', className)}>
      <span ref={displayRef}>{formatTime(currentTime)}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{formatTime(duration)}</span>
    </div>
  );
});

// Memoized progress bar
const ProgressBar = memo(function ProgressBar({
  progress,
  onSeek,
  className,
}: {
  progress: number;
  onSeek: (progress: number) => void;
  className?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleSeek = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!barRef.current) return;
    
    const rect = barRef.current.getBoundingClientRect();
    const clientX = 'touches' in e 
      ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX 
      : e.clientX;
    
    const newProgress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(newProgress);
  }, [onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    handleSeek(e);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const newProgress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(newProgress);
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleSeek, onSeek]);

  return (
    <div
      ref={barRef}
      className={cn(
        'relative h-2 bg-muted rounded-full cursor-pointer touch-none',
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleSeek}
    >
      <div
        className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-75"
        style={{ width: `${progress * 100}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md"
        style={{ left: `calc(${progress * 100}% - 6px)` }}
      />
    </div>
  );
});

// Main transport component
export const OptimizedTransport = memo(function OptimizedTransport({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  loopMode = 'none',
  onLoopModeChange,
  className,
  compact = false,
}: OptimizedTransportProps) {
  const haptic = useHapticFeedback();
  
  const progress = duration > 0 ? currentTime / duration : 0;

  const handlePlayPause = useCallback(() => {
    haptic.tap();
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause, haptic]);

  const handleStop = useCallback(() => {
    haptic.tap();
    onStop();
  }, [onStop, haptic]);

  const handleSkipBack = useCallback(() => {
    haptic.tap();
    onSeek(Math.max(0, currentTime - 10));
  }, [currentTime, onSeek, haptic]);

  const handleSkipForward = useCallback(() => {
    haptic.tap();
    onSeek(Math.min(duration, currentTime + 10));
  }, [currentTime, duration, onSeek, haptic]);

  const handleProgressSeek = useCallback((newProgress: number) => {
    onSeek(newProgress * duration);
  }, [duration, onSeek]);

  const handleLoopToggle = useCallback(() => {
    if (!onLoopModeChange) return;
    haptic.tap();
    const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onLoopModeChange(modes[nextIndex]);
  }, [loopMode, onLoopModeChange, haptic]);

  const LoopIcon = loopMode === 'one' ? Repeat1 : Repeat;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Progress bar */}
      <ProgressBar 
        progress={progress} 
        onSeek={handleProgressSeek}
        className="w-full"
      />
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <TimeDisplay 
          currentTime={currentTime} 
          duration={duration}
        />
        
        <div className="flex items-center gap-1">
          {!compact && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSkipBack}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleStop}
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          
          {!compact && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSkipForward}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {onLoopModeChange ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', loopMode !== 'none' && 'text-primary')}
            onClick={handleLoopToggle}
          >
            <LoopIcon className="w-4 h-4" />
          </Button>
        ) : (
          <div className="w-8" /> // Spacer
        )}
      </div>
    </div>
  );
});
