/**
 * Beat Grid Overlay Component
 * Displays beat markers synchronized with waveform
 */

import React, { memo, useMemo } from 'react';
import { Beat } from '@/hooks/audio/useBeatGrid';
import { cn } from '@/lib/utils';

interface BeatGridOverlayProps {
  beats: Beat[];
  duration: number;
  currentTime?: number;
  height?: number;
  showDownbeatsOnly?: boolean;
  className?: string;
}

export const BeatGridOverlay = memo(function BeatGridOverlay({
  beats,
  duration,
  currentTime = 0,
  height = 48,
  showDownbeatsOnly = false,
  className,
}: BeatGridOverlayProps) {
  const visibleBeats = useMemo(() => {
    if (showDownbeatsOnly) {
      return beats.filter(beat => beat.isDownbeat);
    }
    return beats;
  }, [beats, showDownbeatsOnly]);

  if (!beats.length || duration <= 0) return null;

  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      style={{ height }}
    >
      {visibleBeats.map((beat) => {
        const position = (beat.time / duration) * 100;
        const isPassed = beat.time <= currentTime;
        
        return (
          <div
            key={`beat-${beat.beatNumber}`}
            className={cn(
              'absolute top-0 bottom-0 transition-opacity duration-150',
              beat.isDownbeat 
                ? 'w-[2px] bg-primary/40' 
                : 'w-px bg-muted-foreground/20',
              isPassed && 'opacity-60'
            )}
            style={{ left: `${position}%` }}
          />
        );
      })}
    </div>
  );
});

export default BeatGridOverlay;
