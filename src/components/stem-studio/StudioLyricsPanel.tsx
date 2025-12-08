/**
 * Studio Lyrics Panel
 * 
 * Compact synchronized lyrics display for Stem Studio
 * Shows 4 lines at a time with auto-scroll and word highlighting
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimestampedLyrics, AlignedWord } from '@/hooks/useTimestampedLyrics';
import { Button } from '@/components/ui/button';

interface StudioLyricsPanelProps {
  taskId: string | null;
  audioId: string | null;
  plainLyrics?: string | null;
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
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

// Filter out structural tags like [Verse], [Chorus], etc.
function isStructuralTag(word: string): boolean {
  return /^\[.*\]$/.test(word.trim());
}

export function StudioLyricsPanel({
  taskId,
  audioId,
  plainLyrics,
  currentTime,
  isPlaying,
  onSeek,
}: StudioLyricsPanelProps) {
  const { data: lyricsData, loading } = useTimestampedLyrics(taskId, audioId);
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    if (!lines.length || !isPlaying) return;

    const activeIdx = lines.findIndex(
      line => currentTime >= line.startTime && currentTime <= line.endTime + 0.5
    );

    if (activeIdx !== -1 && activeIdx !== activeLineIndex) {
      setActiveLineIndex(activeIdx);
    }
  }, [currentTime, lines, isPlaying, activeLineIndex]);

  // Get visible lines (4 lines centered on active)
  const visibleLines = useMemo(() => {
    if (!lines.length) return [];
    
    const start = Math.max(0, activeLineIndex - 1);
    const end = Math.min(lines.length, start + 4);
    
    return lines.slice(start, end).map((line, idx) => ({
      ...line,
      globalIndex: start + idx,
    }));
  }, [lines, activeLineIndex]);

  const handleLineClick = useCallback((line: LyricLine) => {
    if (onSeek) {
      onSeek(line.startTime);
    }
  }, [onSeek]);

  // No lyrics available
  if (!loading && !lyricsData?.alignedWords?.length && !plainLyrics) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Music2 className="w-4 h-4 animate-pulse" />
          <span>Загрузка текста...</span>
        </div>
      </div>
    );
  }

  // No timestamped lyrics - show plain text
  if (!lines.length && plainLyrics) {
    return (
      <div className="px-4 sm:px-6 py-3 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Music2 className="w-4 h-4" />
            <span>Текст</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 px-2"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                {plainLyrics}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-3 border-b border-border/30 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Music2 className="w-4 h-4 text-primary" />
          <span className="font-medium">Текст песни</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-7 px-2"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Lyrics Display */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            ref={containerRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1">
              {visibleLines.map((line, idx) => {
                const isActive = line.globalIndex === activeLineIndex;
                const isPast = line.endTime < currentTime;

                return (
                  <motion.div
                    key={line.globalIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: isActive ? 1 : isPast ? 0.4 : 0.6,
                      x: 0,
                      scale: isActive ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleLineClick(line)}
                    className={cn(
                      'py-1 px-2 rounded-lg cursor-pointer transition-colors text-sm',
                      isActive && 'bg-primary/10 font-medium',
                      !isActive && 'hover:bg-muted/50'
                    )}
                  >
                    {line.words.map((word, wordIdx) => {
                      const isWordActive = isPlaying && 
                        currentTime >= word.startS && 
                        currentTime <= word.endS;

                      return (
                        <span
                          key={wordIdx}
                          className={cn(
                            'inline transition-all duration-150',
                            isWordActive && 'text-primary font-bold scale-105'
                          )}
                        >
                          {word.word.replace('\n', '')}{' '}
                        </span>
                      );
                    })}
                  </motion.div>
                );
              })}
            </div>

            {/* Progress indicator */}
            {lines.length > 4 && (
              <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-border/20">
                <span className="text-[10px] text-muted-foreground">
                  {activeLineIndex + 1} / {lines.length}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudioLyricsPanel;
