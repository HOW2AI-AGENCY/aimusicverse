/**
 * WaveformAnalysisOverlay - Overlay component for chords and beats on waveform
 * 
 * Shows chord progression and beat markers synchronized with the waveform
 */

import { memo, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ChordData } from '@/hooks/useKlangioAnalysis';

interface Beat {
  time: number;
  beatNumber: number;
  isDownbeat: boolean;
}

interface WaveformAnalysisOverlayProps {
  chords?: ChordData[];
  beats?: Beat[];
  duration: number;
  currentTime: number;
  height?: number;
  showChords?: boolean;
  showBeats?: boolean;
  className?: string;
}

// Chord color mapping based on root note
const CHORD_COLORS: Record<string, string> = {
  'C': 'bg-red-500/30',
  'D': 'bg-orange-500/30',
  'E': 'bg-yellow-500/30',
  'F': 'bg-green-500/30',
  'G': 'bg-teal-500/30',
  'A': 'bg-blue-500/30',
  'B': 'bg-purple-500/30',
};

function getChordColor(chord: string): string {
  const root = chord.charAt(0).toUpperCase();
  return CHORD_COLORS[root] || 'bg-muted/30';
}

export const WaveformAnalysisOverlay = memo(function WaveformAnalysisOverlay({
  chords = [],
  beats = [],
  duration,
  currentTime,
  height = 48,
  showChords = true,
  showBeats = true,
  className,
}: WaveformAnalysisOverlayProps) {
  // Filter visible beats (only show downbeats on small widths)
  const visibleBeats = useMemo(() => {
    if (beats.length > 200) {
      return beats.filter(b => b.isDownbeat);
    }
    return beats;
  }, [beats]);

  if (duration <= 0) return null;
  if (!showChords && !showBeats) return null;
  if (chords.length === 0 && beats.length === 0) return null;

  return (
    <div 
      className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}
      style={{ height }}
    >
      {/* Chord regions */}
      {showChords && chords.map((chord, i) => {
        const left = (chord.startTime / duration) * 100;
        const width = ((chord.endTime - chord.startTime) / duration) * 100;
        const isActive = chord.startTime <= currentTime && chord.endTime > currentTime;
        const isPast = chord.endTime < currentTime;

        return (
          <div
            key={`chord-${i}`}
            className={cn(
              'absolute top-0 bottom-0 transition-opacity duration-150',
              getChordColor(chord.chord),
              isPast && 'opacity-40',
              isActive && 'ring-1 ring-inset ring-primary/50'
            )}
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            {/* Chord label at top */}
            <span 
              className={cn(
                'absolute top-0.5 left-0.5 text-[9px] font-mono font-semibold',
                'bg-background/60 px-0.5 rounded',
                isActive ? 'text-primary' : 'text-foreground/70'
              )}
            >
              {chord.chord}
            </span>
          </div>
        );
      })}

      {/* Beat markers */}
      {showBeats && visibleBeats.map((beat) => {
        const position = (beat.time / duration) * 100;
        const isPassed = beat.time <= currentTime;
        const isNear = Math.abs(beat.time - currentTime) < 0.1;

        return (
          <motion.div
            key={`beat-${beat.beatNumber}`}
            className={cn(
              'absolute top-0 bottom-0 transition-all duration-75',
              beat.isDownbeat 
                ? 'w-[2px] bg-primary/50' 
                : 'w-px bg-muted-foreground/30',
              isPassed && 'opacity-50',
              isNear && 'bg-primary w-[3px]'
            )}
            style={{ left: `${position}%` }}
            animate={isNear ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.15 }}
          />
        );
      })}

      {/* Playhead indicator for current chord */}
      {showChords && currentTime > 0 && (
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
      )}
    </div>
  );
});

export default WaveformAnalysisOverlay;
