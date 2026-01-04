import { memo, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DAWTimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  showGrid?: boolean;
  className?: string;
}

export const DAWTimeline = memo(({ duration, currentTime, onSeek, showGrid = true, className }: DAWTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate time markers with smart intervals
  const markers = useMemo(() => {
    const result: { time: number; label: string; major: boolean }[] = [];
    const interval = duration > 300 ? 60 : duration > 180 ? 30 : duration > 60 ? 10 : 5;
    const minorInterval = interval / 2;
    
    for (let t = 0; t <= duration; t += minorInterval) {
      const isMajor = t % interval === 0;
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      result.push({
        time: t,
        label: `${mins}:${secs.toString().padStart(2, '0')}`,
        major: isMajor,
      });
    }
    return result;
  }, [duration]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  };

  const playheadPosition = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative h-6 bg-gradient-to-b from-card/50 to-transparent cursor-pointer select-none group",
        className
      )}
      onClick={handleClick}
    >
      {/* Background grid lines */}
      {showGrid && (
        <div className="absolute inset-0 opacity-30">
          {markers.filter(m => !m.major).map((marker) => (
            <div
              key={`grid-${marker.time}`}
              className="absolute top-0 w-px h-full bg-border/30"
              style={{ left: `${(marker.time / duration) * 100}%` }}
            />
          ))}
        </div>
      )}
      
      {/* Time markers */}
      {markers.map((marker) => (
        <div
          key={marker.time}
          className="absolute top-0 h-full flex flex-col items-center"
          style={{ left: `${(marker.time / duration) * 100}%` }}
        >
          <div className={cn(
            "w-px",
            marker.major 
              ? "h-full bg-border/60" 
              : "h-1.5 bg-border/40"
          )} />
          {marker.major && (
            <span className="absolute top-2 text-[8px] font-mono text-muted-foreground/70 -translate-x-1/2 whitespace-nowrap">
              {marker.label}
            </span>
          )}
        </div>
      ))}

      {/* Hover indicator */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute top-0 h-full w-full bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      </div>

      {/* Playhead */}
      <div
        className="absolute top-0 h-full w-0.5 bg-primary z-10 pointer-events-none shadow-lg shadow-primary/50"
        style={{ left: `${playheadPosition}%` }}
      >
        {/* Playhead top marker */}
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-primary" />
        {/* Playhead glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-primary/20 blur-sm" />
      </div>
    </div>
  );
});

DAWTimeline.displayName = 'DAWTimeline';
