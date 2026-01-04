/**
 * Playhead - Current time indicator on timeline
 */

import { cn } from '@/lib/utils';
import { formatTimeWithMs } from '@/lib/formatters';

interface PlayheadProps {
  currentTime: number;
  zoom: number;
  height: number;
  className?: string;
}

export function Playhead({ currentTime, zoom, height, className }: PlayheadProps) {
  const left = currentTime * zoom + 140; // Account for track controls width

  return (
    <div
      className={cn(
        "absolute top-0 z-20 pointer-events-none",
        className
      )}
      style={{ 
        left,
        height,
      }}
    >
      {/* Playhead triangle */}
      <div 
        className="w-0 h-0 -ml-2"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '10px solid hsl(var(--primary))',
        }}
      />
      
      {/* Playhead line */}
      <div 
        className="w-0.5 bg-primary -mt-1"
        style={{ height: height - 10 }}
      />
      
      {/* Time display */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded whitespace-nowrap">
        {formatTimeWithMs(currentTime)}
      </div>
    </div>
  );
}
