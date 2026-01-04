/**
 * ChordOverlay
 * Displays chord markers over waveform for guitar/bass stems
 * Phase 3 - Guitar Chord Display
 */

import { memo, useMemo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ChordData {
  chord: string;
  start: number;  // seconds
  end: number;    // seconds
  confidence?: number;
}

interface ChordOverlayProps {
  chords: ChordData[];
  currentTime: number;
  duration: number;
  onChordClick?: (chord: string, startTime: number) => void;
  className?: string;
  height?: number;
}

// Chord color mapping for visual distinction
const CHORD_COLORS: Record<string, string> = {
  // Major chords - warm colors
  'C': 'bg-rose-500/80',
  'D': 'bg-orange-500/80',
  'E': 'bg-amber-500/80',
  'F': 'bg-yellow-500/80',
  'G': 'bg-lime-500/80',
  'A': 'bg-green-500/80',
  'B': 'bg-emerald-500/80',
  
  // Minor chords - cool colors
  'Am': 'bg-cyan-500/80',
  'Bm': 'bg-sky-500/80',
  'Cm': 'bg-blue-500/80',
  'Dm': 'bg-indigo-500/80',
  'Em': 'bg-violet-500/80',
  'Fm': 'bg-purple-500/80',
  'Gm': 'bg-fuchsia-500/80',
  
  // Default
  'default': 'bg-primary/70',
};

function getChordColor(chord: string): string {
  // Check exact match
  if (CHORD_COLORS[chord]) return CHORD_COLORS[chord];
  
  // Check root note for major
  const rootMatch = chord.match(/^([A-G][#b]?)$/);
  if (rootMatch && CHORD_COLORS[rootMatch[1]]) {
    return CHORD_COLORS[rootMatch[1]];
  }
  
  // Check for minor
  if (chord.includes('m') && !chord.includes('maj')) {
    const root = chord.replace(/m.*/, '') + 'm';
    if (CHORD_COLORS[root]) return CHORD_COLORS[root];
  }
  
  return CHORD_COLORS.default;
}

export const ChordOverlay = memo(function ChordOverlay({
  chords,
  currentTime,
  duration,
  onChordClick,
  className,
  height = 24,
}: ChordOverlayProps) {
  const haptic = useHapticFeedback();

  // Calculate chord positions as percentages
  const chordPositions = useMemo(() => {
    if (!duration || duration === 0) return [];
    
    return chords.map(chord => ({
      ...chord,
      leftPercent: (chord.start / duration) * 100,
      widthPercent: ((chord.end - chord.start) / duration) * 100,
    }));
  }, [chords, duration]);

  // Find current chord
  const currentChord = useMemo(() => {
    return chords.find(c => currentTime >= c.start && currentTime < c.end);
  }, [chords, currentTime]);

  // Handle chord click
  const handleChordClick = useCallback((chord: ChordData) => {
    haptic.tap();
    onChordClick?.(chord.chord, chord.start);
  }, [haptic, onChordClick]);

  if (chords.length === 0) return null;

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded",
        className
      )}
      style={{ height }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-background/50" />

      {/* Chord markers */}
      {chordPositions.map((chord, index) => {
        const isActive = currentChord?.start === chord.start;
        const colorClass = getChordColor(chord.chord);
        
        return (
          <motion.button
            key={`${chord.chord}-${chord.start}-${index}`}
            className={cn(
              "absolute top-0 bottom-0 flex items-center justify-center",
              "text-white text-[10px] font-bold",
              "border-r border-background/30",
              "transition-all duration-150",
              "hover:brightness-110 active:brightness-90",
              colorClass,
              isActive && "ring-2 ring-white/50 z-10"
            )}
            style={{
              left: `${chord.leftPercent}%`,
              width: `${Math.max(chord.widthPercent, 2)}%`,
            }}
            onClick={() => handleChordClick(chord)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
          >
            {/* Only show label if wide enough */}
            {chord.widthPercent > 3 && (
              <span className="truncate px-0.5">
                {chord.chord}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Current time indicator */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20 pointer-events-none"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />

      {/* Current chord label (floating) */}
      {currentChord && (
        <motion.div
          className="absolute -top-7 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-bold shadow-lg z-30"
          style={{ 
            left: `${(currentTime / duration) * 100}%`,
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentChord.chord}
        >
          {currentChord.chord}
        </motion.div>
      )}
    </div>
  );
});

export type { ChordData, ChordOverlayProps };
