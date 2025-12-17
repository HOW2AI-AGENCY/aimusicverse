/**
 * Timeline Ruler - Time markers and beat grid
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TimelineRulerProps {
  duration: number;
  zoom: number;
  bpm: number;
  className?: string;
}

export function TimelineRuler({ duration, zoom, bpm, className }: TimelineRulerProps) {
  const markers = useMemo(() => {
    const result: { time: number; label: string; isMajor: boolean }[] = [];
    const beatDuration = 60 / bpm;
    const barDuration = beatDuration * 4;
    
    // Calculate appropriate interval based on zoom
    let interval: number;
    if (zoom >= 100) {
      interval = beatDuration; // Show beats at high zoom
    } else if (zoom >= 50) {
      interval = barDuration; // Show bars
    } else if (zoom >= 25) {
      interval = barDuration * 2; // Show every 2 bars
    } else {
      interval = barDuration * 4; // Show every 4 bars
    }
    
    for (let time = 0; time <= duration; time += interval) {
      const bar = Math.floor(time / barDuration) + 1;
      const beat = Math.floor((time % barDuration) / beatDuration) + 1;
      
      const isMajor = beat === 1;
      const label = isMajor ? `${bar}` : `${bar}.${beat}`;
      
      result.push({ time, label, isMajor });
    }
    
    return result;
  }, [duration, zoom, bpm]);

  return (
    <div 
      className={cn(
        "h-8 bg-muted/50 border-b border-border/30 relative sticky top-0 z-10",
        className
      )}
      style={{ width: duration * zoom + 200 }}
    >
      {/* BPM indicator */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {bpm} BPM
      </div>
      
      {/* Time markers */}
      <div className="absolute left-[140px] right-0 h-full">
        {markers.map(({ time, label, isMajor }) => (
          <div
            key={time}
            className="absolute top-0 h-full flex flex-col justify-end"
            style={{ left: time * zoom }}
          >
            <div
              className={cn(
                "w-px",
                isMajor ? "h-4 bg-foreground/40" : "h-2 bg-foreground/20"
              )}
            />
            {isMajor && (
              <span className="absolute bottom-4 text-[10px] text-muted-foreground -translate-x-1/2">
                {label}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Seconds overlay for reference */}
      <div className="absolute left-[140px] right-0 h-full pointer-events-none">
        {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => (
          <div
            key={i * 10}
            className="absolute top-0 text-[9px] text-muted-foreground/50"
            style={{ left: i * 10 * zoom }}
          >
            {formatTime(i * 10)}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
