/**
 * Compact Studio Lyrics Panel
 * 
 * Optimized for mobile - collapsed by default, minimal height
 * Shows only 2 lines at a time with current line highlighted
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, ChevronRight, Scissors, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimestampedLyrics, AlignedWord } from '@/hooks/useTimestampedLyrics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudioLyricsPanelCompactProps {
  taskId: string | null;
  audioId: string | null;
  plainLyrics?: string | null;
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  selectionMode?: boolean;
  onSectionSelect?: (startTime: number, endTime: number, lyrics: string) => void;
  highlightedSection?: { start: number; end: number } | null;
}

interface LyricLine {
  words: AlignedWord[];
  startTime: number;
  endTime: number;
  text: string;
}

// Group words into lines based on newlines or time gaps
function groupWordsIntoLines(words: AlignedWord[]): LyricLine[] {
  const lines: LyricLine[] = [];
  let currentLineWords: AlignedWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentLineWords.push(word);

    const nextWord = words[i + 1];
    const hasNewline = word.word.includes('\n');
    const hasTimeGap = nextWord ? nextWord.startS - word.endS > 0.5 : true;
    const isLongLine = currentLineWords.length >= 10;

    if (hasNewline || hasTimeGap || isLongLine || !nextWord) {
      if (currentLineWords.length > 0) {
        const lineText = currentLineWords.map(w => w.word.replace('\n', '')).join(' ').trim();
        if (lineText) {
          lines.push({
            words: [...currentLineWords],
            startTime: currentLineWords[0].startS,
            endTime: currentLineWords[currentLineWords.length - 1].endS,
            text: lineText,
          });
        }
      }
      currentLineWords = [];
    }
  }

  return lines;
}

// Filter out structural tags
function isStructuralTag(word: string): boolean {
  return /^[\[\(].*[\]\)]$/.test(word.trim());
}

export function StudioLyricsPanelCompact({
  taskId,
  audioId,
  plainLyrics,
  currentTime,
  isPlaying,
  onSeek,
  selectionMode,
  onSectionSelect,
  highlightedSection,
}: StudioLyricsPanelCompactProps) {
  const { data: lyricsData, loading } = useTimestampedLyrics(taskId, audioId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process lyrics into lines
  const lines = useMemo(() => {
    if (!lyricsData?.alignedWords?.length) return [];
    
    const filteredWords = lyricsData.alignedWords.filter(w => !isStructuralTag(w.word));
    return groupWordsIntoLines(filteredWords);
  }, [lyricsData]);

  // Find active line based on current time
  useEffect(() => {
    if (!lines.length) return;

    const activeIdx = lines.findIndex(
      line => currentTime >= line.startTime && currentTime <= line.endTime + 0.5
    );

    if (activeIdx !== -1 && activeIdx !== activeLineIndex) {
      setActiveLineIndex(activeIdx);
    }
  }, [currentTime, lines, activeLineIndex]);

  const handleLineClick = useCallback((line: LyricLine) => {
    if (onSeek) {
      onSeek(line.startTime);
    }
  }, [onSeek]);

  // Get current and next line for compact view
  const currentLine = lines[activeLineIndex];
  const nextLine = lines[activeLineIndex + 1];

  // No lyrics available
  if (!loading && !lyricsData?.alignedWords?.length && !plainLyrics) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="px-4 py-2 border-b border-border/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Music2 className="w-3.5 h-3.5 animate-pulse" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  // No timestamped lyrics - show plain text preview
  if (!lines.length && plainLyrics) {
    return (
      <div className="px-4 py-2 border-b border-border/30">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs text-muted-foreground w-full"
        >
          <Music2 className="w-3.5 h-3.5" />
          <span className="truncate flex-1 text-left">
            {plainLyrics.split('\n')[0]}...
          </span>
          <ChevronRight className={cn(
            "w-3.5 h-3.5 transition-transform",
            isExpanded && "rotate-90"
          )} />
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2"
            >
              <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {plainLyrics}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn(
      'px-4 py-2 border-b border-border/30',
      selectionMode && 'bg-amber-500/5'
    )}>
      {/* Compact view - 2 lines max */}
      <div 
        className="space-y-1 cursor-pointer"
        onClick={() => !selectionMode && setIsExpanded(!isExpanded)}
      >
        {currentLine && (
          <motion.div
            key={currentLine.startTime}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              handleLineClick(currentLine);
            }}
            className={cn(
              'text-sm py-1 px-2 rounded-lg',
              'bg-primary/10 font-medium'
            )}
          >
            {currentLine.words.map((word, wordIdx) => {
              const isWordActive = isPlaying && 
                currentTime >= word.startS && 
                currentTime <= word.endS;

              return (
                <span
                  key={wordIdx}
                  className={cn(
                    'inline transition-all duration-150',
                    isWordActive && 'text-primary font-bold'
                  )}
                >
                  {word.word.replace('\n', '')}{' '}
                </span>
              );
            })}
          </motion.div>
        )}
        
        {nextLine && (
          <motion.div
            key={nextLine.startTime}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              handleLineClick(nextLine);
            }}
            className="text-xs text-muted-foreground py-1 px-2 truncate"
          >
            {nextLine.text}
          </motion.div>
        )}

        {/* Expand indicator */}
        {lines.length > 2 && !isExpanded && (
          <div className="flex items-center justify-center gap-1 pt-1">
            <span className="text-[10px] text-muted-foreground">
              {activeLineIndex + 1}/{lines.length}
            </span>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2 pt-2 border-t border-border/20"
          >
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {lines.map((line, idx) => {
                const isActive = idx === activeLineIndex;
                const isPast = line.endTime < currentTime;

                return (
                  <div
                    key={idx}
                    onClick={() => handleLineClick(line)}
                    className={cn(
                      'py-1.5 px-2 rounded-lg cursor-pointer text-xs',
                      isActive && 'bg-primary/10 font-medium',
                      !isActive && isPast && 'opacity-40',
                      !isActive && !isPast && 'opacity-60 hover:opacity-80'
                    )}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudioLyricsPanelCompact;
