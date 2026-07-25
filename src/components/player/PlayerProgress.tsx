/**
 * PlayerProgress - single progress primitive for compact and fullscreen players.
 * Combines waveform, timeline, buffering and labels with stable dimensions.
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";
import { UnifiedWaveform, type WaveformMode } from "@/components/waveform";

type PlayerProgressDensity = "compact" | "default" | "fullscreen";

interface PlayerProgressProps {
  audioUrl?: string | null;
  trackId?: string | null;
  waveformData?: number[] | null;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  buffered?: number;
  className?: string;
  mode?: WaveformMode;
  density?: PlayerProgressDensity;
  showLabels?: boolean;
  showBeatGrid?: boolean;
}

const densityConfig: Record<PlayerProgressDensity, { height: number; gap: string; label: string }> = {
  compact: { height: 24, gap: "gap-1", label: "text-[0.6875rem]" },
  default: { height: 36, gap: "gap-1.5", label: "text-xs" },
  fullscreen: { height: 44, gap: "gap-2", label: "text-xs" },
};

export const PlayerProgress = memo(function PlayerProgress({
  audioUrl,
  trackId,
  waveformData,
  currentTime,
  duration,
  onSeek,
  buffered = 0,
  className,
  mode,
  density = "default",
  showLabels = true,
  showBeatGrid = false,
}: PlayerProgressProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(currentTime);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const config = densityConfig[density];
  const waveformMode = mode ?? (density === "compact" ? "minimal" : density === "fullscreen" ? "standard" : "compact");

  useEffect(() => {
    if (!isDragging) setLocalTime(currentTime);
  }, [currentTime, isDragging]);

  const handleSeek = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current || duration <= 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const nextTime = percent * duration;
      setLocalTime(nextTime);
      onSeek(nextTime);
    },
    [duration, onSeek],
  );

  const progress = duration > 0 ? Math.max(0, Math.min(100, (localTime / duration) * 100)) : 0;
  const bufferedProgress = Math.max(0, Math.min(100, buffered));

  return (
    <div className={cn("flex min-w-0 flex-col", config.gap, className)} data-testid="player-progress">
      <div
        ref={containerRef}
        className="group relative min-w-0 cursor-pointer touch-manipulation rounded-md"
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          handleSeek(e);
        }}
        onPointerMove={(e) => {
          if (!isDragging) return;
          e.preventDefault();
          handleSeek(e);
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role="slider"
        aria-label="Прогресс трека"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={localTime}
      >
        {bufferedProgress > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-md bg-muted-foreground/10"
            style={{ width: `${bufferedProgress}%` }}
            aria-hidden="true"
          />
        )}
        <UnifiedWaveform
          audioUrl={audioUrl}
          trackId={trackId}
          waveformData={waveformData}
          currentTime={localTime}
          duration={duration}
          mode={waveformMode}
          height={config.height}
          showBeatGrid={showBeatGrid}
          showProgress
          interactive={false}
          className="pointer-events-none relative z-10"
        />
        <div
          className={cn(
            "absolute top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full bg-background shadow-lg ring-2 ring-primary",
            "transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
            isDragging || isHovering ? "opacity-100" : "opacity-0",
            isDragging ? "scale-110" : "scale-100",
          )}
          style={{ left: `calc(${progress}% - 0.375rem)` }}
          aria-hidden="true"
        />
        {isDragging && (
          <div
            className="absolute -top-8 z-30 rounded-md border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-lg"
            style={{ left: `clamp(1.25rem, ${progress}%, calc(100% - 1.25rem))`, transform: "translateX(-50%)" }}
          >
            {formatTime(localTime)}
          </div>
        )}
      </div>
      {showLabels && (
        <div className={cn("flex justify-between font-medium text-muted-foreground", config.label)}>
          <span className="tabular-nums">{formatTime(localTime)}</span>
          <span className="tabular-nums text-muted-foreground/70">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
});

export default PlayerProgress;
