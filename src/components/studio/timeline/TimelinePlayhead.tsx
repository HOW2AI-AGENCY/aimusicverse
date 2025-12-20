/**
 * TimelinePlayhead - Vertical line that crosses all timeline layers
 * Shows current playback position across sections and stems
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTimeWithMs } from '@/lib/formatters';

interface TimelinePlayheadProps {
  currentTime: number;
  duration: number;
  height?: number;
  showTime?: boolean;
  className?: string;
}

export const TimelinePlayhead = memo(({
  currentTime,
  duration,
  height = 100,
  showTime = true,
  className,
}: TimelinePlayheadProps) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      className={cn(
        "absolute top-0 z-30 pointer-events-none flex flex-col items-center",
        className
      )}
      style={{ 
        left: `${progress}%`,
        height,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Playhead triangle */}
      <div 
        className="w-0 h-0 -ml-px flex-shrink-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid hsl(var(--primary))',
        }}
      />
      
      {/* Playhead vertical line */}
      <div 
        className="w-0.5 bg-primary flex-1 -mt-0.5"
        style={{ 
          boxShadow: '0 0 8px hsl(var(--primary) / 0.5)',
        }}
      />
      
      {/* Time display (optional) */}
      {showTime && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-primary text-primary-foreground text-[9px] rounded whitespace-nowrap font-mono">
          {formatTimeWithMs(currentTime)}
        </div>
      )}
    </motion.div>
  );
});

TimelinePlayhead.displayName = 'TimelinePlayhead';
