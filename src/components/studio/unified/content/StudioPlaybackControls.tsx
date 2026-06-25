/**
 * StudioPlaybackControls Component
 *
 * Playback controls (play, pause, seek, skip) for the studio.
 * Extracted from UnifiedStudioContent for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split UnifiedStudioContent (1477 lines → 5 components)
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export interface StudioPlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;

  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export const StudioPlaybackControls = React.forwardRef<
  HTMLDivElement,
  StudioPlaybackControlsProps
>(({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onSeekBackward,
  onSeekForward,
  disabled = false,
  compact = false,
  className,
}, ref) => {
  const handleSeekBackward = React.useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    onSeek(newTime);
    onSeekBackward?.();
  }, [currentTime, onSeek, onSeekBackward]);

  const handleSeekForward = React.useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10);
    onSeek(newTime);
    onSeekForward?.();
  }, [currentTime, duration, onSeek, onSeekForward]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2",
        compact && "gap-1",
        className
      )}
    >
      {/* Seek Backward */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}
        onClick={handleSeekBackward}
        disabled={disabled}
        title="Назад на 10с"
      >
        <SkipBack className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
      </Button>

      {/* Rewind to Start */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}
        onClick={() => onSeek(0)}
        disabled={disabled}
        title="В начало"
      >
        <SkipBack className={cn(compact ? "h-4 w-4" : "h-5 w-5")} style={{ transform: 'rotate(180deg)' }} />
      </Button>

      {/* Play/Pause */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          "shrink-0",
          compact ? "h-12 w-12" : "h-14 w-14"
        )}
        onClick={onPlayPause}
        disabled={disabled}
        title={isPlaying ? 'Пауза' : 'Воспроизведение'}
      >
        {isPlaying ? (
          <Pause className={cn(compact ? "h-5 w-5" : "h-6 w-6")} />
        ) : (
          <Play className={cn(compact ? "h-5 w-5" : "h-6 w-6")} />
        )}
      </Button>

      {/* Seek Forward */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}
        onClick={handleSeekForward}
        disabled={disabled}
        title="Вперед на 10с"
      >
        <SkipForward className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
      </Button>
    </div>
  );
});

StudioPlaybackControls.displayName = 'StudioPlaybackControls';
