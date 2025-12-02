import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  buffered?: number;
  className?: string;
}

export function ProgressBar({ 
  currentTime, 
  duration, 
  onSeek, 
  buffered = 0,
  className 
}: ProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
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
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="relative h-1 bg-secondary rounded-full cursor-pointer touch-manipulation group"
        style={{ paddingTop: '21px', paddingBottom: '21px' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="slider"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={localTime}
      >
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-secondary rounded-full overflow-hidden">
          {/* Buffered Progress */}
          <div
            className="absolute left-0 top-0 h-full bg-muted-foreground/20 transition-all"
            style={{ width: `${bufferedPercent}%` }}
          />
          
          {/* Current Progress */}
          <div
            className="absolute left-0 top-0 h-full bg-primary transition-all rounded-full"
            style={{ width: `${progress}%` }}
          />
          
          {/* Progress Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(localTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
