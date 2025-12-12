/**
 * Loop Region Selector
 * 
 * Allows users to select and loop a region of audio in the stem studio.
 * Provides visual feedback and interactive handles for loop start/end.
 * 
 * @author MusicVerse AI
 * @task T064 - Add loop region selection
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Repeat, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Format time in seconds to MM:SS.ms format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export interface LoopRegion {
  /** Loop start time in seconds */
  start: number;
  /** Loop end time in seconds */
  end: number;
  /** Whether loop is enabled */
  enabled: boolean;
}

interface LoopRegionSelectorProps {
  /** Total duration of the audio in seconds */
  duration: number;
  /** Current playback time in seconds */
  currentTime: number;
  /** Current loop region settings */
  loopRegion: LoopRegion;
  /** Callback when loop region changes */
  onLoopRegionChange: (region: LoopRegion) => void;
  /** Callback to seek to a specific time */
  onSeek?: (time: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function LoopRegionSelector({
  duration,
  currentTime,
  loopRegion,
  onLoopRegionChange,
  onSeek,
  className,
  disabled = false,
}: LoopRegionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  // Calculate loop duration
  const loopDuration = useMemo(() => {
    return loopRegion.end - loopRegion.start;
  }, [loopRegion.start, loopRegion.end]);

  // Calculate progress within loop
  const loopProgress = useMemo(() => {
    if (!loopRegion.enabled || loopDuration <= 0) return 0;
    const progress = (currentTime - loopRegion.start) / loopDuration;
    return Math.max(0, Math.min(1, progress));
  }, [currentTime, loopRegion.start, loopDuration, loopRegion.enabled]);

  /**
   * Handle toggling loop on/off
   */
  const handleToggleLoop = useCallback(() => {
    onLoopRegionChange({
      ...loopRegion,
      enabled: !loopRegion.enabled,
    });
  }, [loopRegion, onLoopRegionChange]);

  /**
   * Handle clearing the loop region
   */
  const handleClearLoop = useCallback(() => {
    onLoopRegionChange({
      start: 0,
      end: duration,
      enabled: false,
    });
  }, [duration, onLoopRegionChange]);

  /**
   * Handle changing loop start time
   */
  const handleStartChange = useCallback((value: number[]) => {
    const newStart = Math.min(value[0], loopRegion.end - 0.5); // Minimum 0.5s loop
    onLoopRegionChange({
      ...loopRegion,
      start: Math.max(0, newStart),
    });
  }, [loopRegion, onLoopRegionChange]);

  /**
   * Handle changing loop end time
   */
  const handleEndChange = useCallback((value: number[]) => {
    const newEnd = Math.max(value[0], loopRegion.start + 0.5); // Minimum 0.5s loop
    onLoopRegionChange({
      ...loopRegion,
      end: Math.min(duration, newEnd),
    });
  }, [loopRegion, duration, onLoopRegionChange]);

  /**
   * Handle clicking on the timeline to set loop region
   */
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || disabled) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * duration;

    // If shift is held, set end point; otherwise set start point
    if (e.shiftKey) {
      const newEnd = Math.max(time, loopRegion.start + 0.5);
      onLoopRegionChange({
        ...loopRegion,
        end: Math.min(duration, newEnd),
        enabled: true,
      });
    } else {
      const newStart = Math.min(time, loopRegion.end - 0.5);
      onLoopRegionChange({
        ...loopRegion,
        start: Math.max(0, newStart),
        enabled: true,
      });
    }
  }, [duration, loopRegion, onLoopRegionChange, disabled]);

  /**
   * Jump to loop start
   */
  const handleJumpToStart = useCallback(() => {
    onSeek?.(loopRegion.start);
  }, [loopRegion.start, onSeek]);

  /**
   * Jump to loop end
   */
  const handleJumpToEnd = useCallback(() => {
    onSeek?.(loopRegion.end);
  }, [loopRegion.end, onSeek]);

  // Calculate positions as percentages
  const startPercent = (loopRegion.start / duration) * 100;
  const endPercent = (loopRegion.end / duration) * 100;
  const playheadPercent = (currentTime / duration) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with toggle and clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch
            checked={loopRegion.enabled}
            onCheckedChange={handleToggleLoop}
            disabled={disabled}
            id="loop-toggle"
          />
          <Label 
            htmlFor="loop-toggle" 
            className={cn(
              "text-sm font-medium cursor-pointer flex items-center gap-2",
              loopRegion.enabled && "text-primary"
            )}
          >
            <Repeat className={cn(
              "w-4 h-4",
              loopRegion.enabled && "text-primary"
            )} />
            Зациклить регион
          </Label>
        </div>

        {loopRegion.enabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearLoop}
            disabled={disabled}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Сброс
          </Button>
        )}
      </div>

      {/* Loop info display */}
      {loopRegion.enabled && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1">
            <span>Начало:</span>
            <span className="font-mono font-medium text-foreground">
              {formatTime(loopRegion.start)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>Конец:</span>
            <span className="font-mono font-medium text-foreground">
              {formatTime(loopRegion.end)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>Длина:</span>
            <span className="font-mono font-medium text-foreground">
              {formatTime(loopDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Visual timeline with loop region */}
      <div 
        ref={containerRef}
        className={cn(
          "relative h-10 bg-muted/30 rounded-lg overflow-hidden cursor-pointer",
          disabled && "opacity-50 pointer-events-none"
        )}
        onClick={handleTimelineClick}
      >
        {/* Full timeline background */}
        <div className="absolute inset-0" />

        {/* Loop region highlight */}
        {loopRegion.enabled && (
          <div
            className="absolute top-0 bottom-0 bg-primary/20 border-x-2 border-primary/50"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
            }}
          >
            {/* Loop progress indicator */}
            <div 
              className="absolute top-0 bottom-0 left-0 bg-primary/30 transition-all duration-100"
              style={{ width: `${loopProgress * 100}%` }}
            />
          </div>
        )}

        {/* Start handle */}
        {loopRegion.enabled && (
          <div
            className="absolute top-0 bottom-0 w-3 bg-primary cursor-ew-resize flex items-center justify-center hover:bg-primary/80 transition-colors"
            style={{ left: `calc(${startPercent}% - 6px)` }}
            onMouseDown={() => setIsDragging('start')}
          >
            <ChevronLeft className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}

        {/* End handle */}
        {loopRegion.enabled && (
          <div
            className="absolute top-0 bottom-0 w-3 bg-primary cursor-ew-resize flex items-center justify-center hover:bg-primary/80 transition-colors"
            style={{ left: `calc(${endPercent}% - 6px)` }}
            onMouseDown={() => setIsDragging('end')}
          >
            <ChevronRight className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
          style={{ left: `${playheadPercent}%` }}
        />

        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[9px] text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Loop region sliders for precise control */}
      {loopRegion.enabled && (
        <div className="grid grid-cols-2 gap-4">
          {/* Start slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Начало</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleJumpToStart}
                className="h-5 px-1.5 text-[10px]"
              >
                Перейти
              </Button>
            </div>
            <Slider
              value={[loopRegion.start]}
              min={0}
              max={loopRegion.end - 0.5}
              step={0.1}
              onValueChange={handleStartChange}
              disabled={disabled}
            />
          </div>

          {/* End slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Конец</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleJumpToEnd}
                className="h-5 px-1.5 text-[10px]"
              >
                Перейти
              </Button>
            </div>
            <Slider
              value={[loopRegion.end]}
              min={loopRegion.start + 0.5}
              max={duration}
              step={0.1}
              onValueChange={handleEndChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Helper text */}
      {loopRegion.enabled && (
        <p className="text-[10px] text-muted-foreground text-center">
          Совет: кликните для установки начала, Shift+клик для конца
        </p>
      )}
    </div>
  );
}
