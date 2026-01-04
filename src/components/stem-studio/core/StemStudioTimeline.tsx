/**
 * Stem Studio Timeline Component
 * 
 * Timeline and section visualization
 * Extracted from StemStudioContent for better organization
 */

import { memo } from 'react';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/lib/player-utils';

interface StemStudioTimelineProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

// Performance optimization: Only re-render when time changes significantly
// 0.5s threshold balances visual smoothness with performance
const TIME_UPDATE_THRESHOLD = 0.5; // seconds

export const StemStudioTimeline = memo(({
  currentTime,
  duration,
  onSeek,
}: StemStudioTimelineProps) => {
  return (
    <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-card/30">
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground font-mono tabular-nums w-12 flex-shrink-0">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={(v) => onSeek(v[0])}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground font-mono tabular-nums w-12 text-right flex-shrink-0">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if time changed significantly or duration changed
  const timeChanged = Math.abs(prevProps.currentTime - nextProps.currentTime) > TIME_UPDATE_THRESHOLD;
  const durationChanged = prevProps.duration !== nextProps.duration;
  return !timeChanged && !durationChanged;
});

StemStudioTimeline.displayName = 'StemStudioTimeline';
