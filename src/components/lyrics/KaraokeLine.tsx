/**
 * Karaoke Line Component
 * 
 * Renders a line of words with karaoke-style progress animation.
 * Each word fills progressively as it's being sung.
 */

import React, { memo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { KaraokeWord } from './KaraokeWord';
import type { LyricLine } from '@/hooks/lyrics/useLyricsSynchronization';
import { isStructuralTag } from '@/lib/lyricsUtils';

interface KaraokeLineProps {
  line: LyricLine;
  isActive: boolean;
  isPast: boolean;
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  className?: string;
}

export const KaraokeLine = memo(forwardRef<HTMLDivElement, KaraokeLineProps>(
  function KaraokeLine(
    {
      line,
      isActive,
      isPast,
      currentTime,
      isPlaying,
      onSeek,
      className,
    },
    ref
  ) {
    const handleLineClick = () => {
      onSeek?.(line.startTime);
    };
    
    return (
      <div
        ref={ref}
        onClick={handleLineClick}
        className={cn(
          // Base styles
          'px-3 py-2 rounded-xl cursor-pointer',
          'transition-all duration-200 ease-out',
          'hover:bg-muted/30 active:bg-muted/50',
          'will-change-[transform,opacity,background-color] transform-gpu',
          
          // Active line styling
          isActive && 'bg-primary/10 scale-[1.02]',
          
          // Past line styling
          !isActive && isPast && 'opacity-50',
          
          // Future line styling
          !isActive && !isPast && 'opacity-70',
          
          className
        )}
      >
        <div className="flex flex-wrap justify-center gap-x-0.5 gap-y-0.5 text-lg sm:text-xl font-medium leading-relaxed">
          {line.words.map((word, wordIndex) => {
            // Skip structural tags
            const cleanWord = word.word.replace(/\n/g, '').trim();
            if (!cleanWord || isStructuralTag(cleanWord)) return null;
            
            return (
              <KaraokeWord
                key={`${line.index}-${wordIndex}-${word.startS}`}
                word={word.word}
                startTime={word.startS}
                endTime={word.endS}
                currentTime={currentTime}
                isPlaying={isPlaying && isActive}
                onClick={() => onSeek?.(word.startS)}
              />
            );
          })}
        </div>
      </div>
    );
  }
), (prevProps, nextProps) => {
  // Only re-render when necessary
  if (prevProps.line.index !== nextProps.line.index) return false;
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.isPast !== nextProps.isPast) return false;
  if (prevProps.isPlaying !== nextProps.isPlaying) return false;
  
  // For active lines, allow re-render for time updates
  if (nextProps.isActive) {
    return Math.abs(prevProps.currentTime - nextProps.currentTime) < 0.016;
  }
  
  return true;
});

export default KaraokeLine;
