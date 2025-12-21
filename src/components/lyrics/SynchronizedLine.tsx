/**
 * Synchronized Line Component
 * 
 * Renders a line of words with synchronized highlighting.
 * Handles auto-scroll and provides click-to-seek functionality.
 */

import React, { memo, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { SynchronizedWord } from './SynchronizedWord';
import type { AlignedWord, LyricLine, SYNC_CONSTANTS } from '@/hooks/lyrics/useLyricsSynchronization';

interface SynchronizedLineProps {
  line: LyricLine;
  isActive: boolean;
  isPast: boolean;
  currentTime: number;
  onSeek?: (time: number) => void;
  onWordClick?: (word: AlignedWord) => void;
  showWordHighlighting?: boolean;
  className?: string;
  activeClassName?: string;
  constants: typeof SYNC_CONSTANTS;
}

export const SynchronizedLine = memo(forwardRef<HTMLDivElement, SynchronizedLineProps>(
  function SynchronizedLine(
    {
      line,
      isActive,
      isPast,
      currentTime,
      onSeek,
      onWordClick,
      showWordHighlighting = true,
      className,
      activeClassName = 'bg-primary/10 scale-[1.02]',
      constants,
    },
    ref
  ) {
    const handleLineClick = () => {
      onSeek?.(line.startTime);
    };
    
    const handleWordClick = (word: AlignedWord) => {
      onWordClick?.(word);
      onSeek?.(word.startS);
    };
    
    // Check if a word is active within this line
    const isWordActiveInLine = (word: AlignedWord): boolean => {
      if (!isActive || !showWordHighlighting) return false;
      const adjustedTime = currentTime + constants.WORD_LOOK_AHEAD_MS / 1000;
      const endTolerance = constants.WORD_END_TOLERANCE_MS / 1000;
      return adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance;
    };
    
    // Check if a word is past
    const isWordPast = (word: AlignedWord): boolean => {
      return currentTime > word.endS + constants.WORD_END_TOLERANCE_MS / 1000;
    };
    
    return (
      <div
        ref={ref}
        onClick={handleLineClick}
        className={cn(
          // Base styles
          'transition-all duration-200 ease-out cursor-pointer rounded-lg p-2',
          'hover:bg-muted/50 active:bg-muted touch-manipulation',
          'will-change-[transform,background-color] transform-gpu',
          
          // State styles
          isActive && activeClassName,
          !isActive && isPast && 'opacity-60',
          !isActive && !isPast && 'opacity-80',
          
          className
        )}
      >
        <div className="flex flex-wrap gap-0.5 leading-relaxed">
          {line.words.map((word, wordIndex) => {
            // Skip structural tags
            const cleanWord = word.word.replace(/\n/g, '').trim();
            if (!cleanWord) return null;
            if (isStructuralTag(cleanWord)) return null;
            
            return (
              <SynchronizedWord
                key={`${line.index}-${wordIndex}-${word.startS}`}
                word={word.word}
                isActive={isWordActiveInLine(word)}
                isPast={isWordPast(word)}
                onClick={() => handleWordClick(word)}
                className="text-sm sm:text-base md:text-lg"
              />
            );
          })}
        </div>
      </div>
    );
  }
), (prevProps, nextProps) => {
  // Custom comparison - only re-render when necessary
  return (
    prevProps.line.index === nextProps.line.index &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPast === nextProps.isPast &&
    // Only compare currentTime if line is active (for word highlighting)
    (!prevProps.isActive || Math.abs(prevProps.currentTime - nextProps.currentTime) < 0.05)
  );
});

// Helper function to check for structural tags
function isStructuralTag(text: string): boolean {
  if (!text) return false;
  return /^\[?(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda|Куплет|Припев|Бридж|Аутро|Интро)(\s*\d*)?\]?$/i.test(text.trim());
}

export default SynchronizedLine;
