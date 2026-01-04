/**
 * Waveform Progress Bar Component
 * 
 * Interactive progress bar with waveform visualization.
 * Combines UnifiedWaveform with interactive seeking.
 */

import React, { useState, useRef, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { UnifiedWaveform, WaveformMode } from '@/components/waveform';
import { motion } from '@/lib/motion';

interface WaveformProgressBarProps {
  audioUrl?: string | null;
  trackId?: string | null;
  waveformData?: number[] | null;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  buffered?: number;
  className?: string;
  mode?: WaveformMode;
  showLabels?: boolean;
  showBeatGrid?: boolean;
}

export const WaveformProgressBar = memo(function WaveformProgressBar({
  audioUrl,
  trackId,
  waveformData,
  currentTime,
  duration,
  onSeek,
  buffered = 0,
  className,
  mode = 'standard',
  showLabels = true,
  showBeatGrid = false,
}: WaveformProgressBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update local time when not dragging
  React.useEffect(() => {
    if (!isDragging) {
      setLocalTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const handleSeek = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !duration) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;
    
    setLocalTime(newTime);
    onSeek(newTime);
  }, [duration, onSeek]);

  const progress = duration > 0 ? (localTime / duration) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Waveform with progress */}
      <div
        ref={containerRef}
        className="relative cursor-pointer touch-manipulation group"
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          handleSeek(e);
        }}
        onPointerMove={(e) => {
          if (isDragging) {
            e.preventDefault();
            handleSeek(e);
          }
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role="slider"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={localTime}
        style={{ touchAction: 'none' }}
      >
        {/* Buffered indicator (behind waveform) */}
        {buffered > 0 && (
          <div 
            className="absolute inset-0 bg-muted-foreground/10 rounded-sm transition-all pointer-events-none"
            style={{ width: `${buffered}%` }}
          />
        )}

        {/* Waveform visualization */}
        <UnifiedWaveform
          audioUrl={audioUrl}
          trackId={trackId}
          waveformData={waveformData}
          currentTime={localTime}
          duration={duration}
          mode={mode}
          showBeatGrid={showBeatGrid}
          showProgress={true}
          interactive={false}
          className="pointer-events-none"
        />

        {/* Draggable handle with glow */}
        <motion.div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xl transition-all duration-150 z-20",
            (isDragging || isHovering) ? "opacity-100 scale-100" : "opacity-0 scale-75"
          )}
          style={{ 
            left: `calc(${progress}% - 6px)`,
          }}
          animate={{
            boxShadow: isDragging 
              ? '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3)'
              : '0 0 12px hsl(var(--primary) / 0.4)'
          }}
        >
          <div className="absolute inset-0.5 bg-primary rounded-full" />
        </motion.div>

        {/* Time preview tooltip during drag */}
        {isDragging && (
          <motion.div
            className="absolute -top-8 px-2 py-1 bg-popover text-popover-foreground text-xs font-medium rounded-md shadow-lg border z-30"
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
});

export default WaveformProgressBar;
