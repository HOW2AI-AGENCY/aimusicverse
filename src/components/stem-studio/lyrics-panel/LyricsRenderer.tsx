/**
 * LyricsRenderer Component
 *
 * Renders synchronized lyrics with word-level highlighting.
 * Extracted from StudioLyricsPanel for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split StudioLyricsPanel (624 lines → subcomponents)
 */

import * as React from 'react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { AlignedWord } from '@/hooks/useTimestampedLyrics';

export interface LyricLine {
  words: AlignedWord[];
  startTime: number;
  endTime: number;
  text: string;
}

export interface LyricsRendererProps {
  lines: LyricLine[];
  currentTime: number;
  isPlaying: boolean;
  onWordClick?: (word: AlignedWord) => void;
  highlightedSection?: { start: number; end: number } | null;
  className?: string;
}

const WORD_TIMING_TOLERANCE = 0.3; // seconds

export const LyricsRenderer = React.forwardRef<
  HTMLDivElement,
  LyricsRendererProps
>(({
  lines,
  currentTime,
  isPlaying,
  onWordClick,
  highlightedSection,
  className,
}, ref) => {
  const renderWord = (word: AlignedWord, lineStartTime: number) => {
    const isActive = currentTime >= word.startS && currentTime <= word.endS;
    const isPast = currentTime > word.endS;

    // Check if word is in highlighted section
    const isHighlighted =
      highlightedSection &&
      word.startS >= highlightedSection.start &&
      word.endS <= highlightedSection.end;

    return (
      <motion.span
        key={`${word.startS}-${word.word}`}
        className={cn(
          'inline-block transition-all duration-150',
          'px-0.5 py-0.5 rounded',
          isActive && 'bg-primary/20 text-foreground scale-105',
          isPast && !isActive && 'text-muted-foreground',
          isHighlighted && 'bg-warning/20 text-warning-foreground'
        )}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onWordClick?.(word)}
      >
        {word.word.replace(/\n/g, ' ')}
      </motion.span>
    );
  };

  return (
    <div ref={ref} className={cn("space-y-3 py-4", className)}>
      {lines.map((line, lineIndex) => {
        const isActive = currentTime >= line.startTime && currentTime <= line.endTime;
        const isPast = currentTime > line.endTime;
        const isUpcoming = currentTime < line.startTime;

        // Check if line is in highlighted section
        const isHighlighted =
          highlightedSection &&
          line.startTime >= highlightedSection.start &&
          line.endTime <= highlightedSection.end;

        return (
          <div
            key={`${lineIndex}-${line.startTime}`}
            className={cn(
              'text-lg leading-relaxed transition-all duration-200',
              isActive && 'font-semibold text-foreground scale-105',
              isPast && !isActive && 'text-muted-foreground opacity-60',
              isUpcoming && 'text-muted-foreground opacity-40',
              isHighlighted && 'bg-warning/10 -mx-2 px-2 rounded'
            )}
          >
            {line.words.map((word) => renderWord(word, line.startTime))}
          </div>
        );
      })}
    </div>
  );
});

LyricsRenderer.displayName = 'LyricsRenderer';
