import { memo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DAWTimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  className?: string;
}

export const DAWTimeline = memo(({ duration, currentTime, onSeek, className }: DAWTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate time markers
  const markers: { time: number; label: string; major: boolean }[] = [];
  const interval = duration > 180 ? 30 : duration > 60 ? 10 : 5; // 30s, 10s, or 5s intervals
  
  for (let t = 0; t <= duration; t += interval) {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    markers.push({
      time: t,
      label: `${mins}:${secs.toString().padStart(2, '0')}`,
      major: t % (interval * 2) === 0,
    });
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-6 bg-card/50 border-b border-border/50 cursor-pointer select-none",
        className
      )}
      onClick={handleClick}
    >
      {/* Time markers */}
      {markers.map((marker) => (
        <div
          key={marker.time}
          className="absolute top-0 h-full flex flex-col items-center"
          style={{ left: `${(marker.time / duration) * 100}%` }}
        >
          <div className={cn(
            "w-px bg-border/50",
            marker.major ? "h-full" : "h-2"
          )} />
          {marker.major && (
            <span className="absolute top-1 text-[9px] font-mono text-muted-foreground/70 -translate-x-1/2">
              {marker.label}
            </span>
          )}
        </div>
      ))}

      {/* Playhead */}
      <div
        className="absolute top-0 h-full w-0.5 bg-primary z-10 pointer-events-none"
        style={{ left: `${playheadPosition}%` }}
      >
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
      </div>
    </div>
  );
});

DAWTimeline.displayName = 'DAWTimeline';
