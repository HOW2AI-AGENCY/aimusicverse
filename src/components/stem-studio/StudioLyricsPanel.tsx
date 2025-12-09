/**
 * Studio Lyrics Panel
 * 
 * Compact synchronized lyrics display for Stem Studio
 * Shows 4 lines at a time with auto-scroll and word highlighting
 * Supports section selection mode for Replace Section feature
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, ChevronDown, ChevronUp, Scissors, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimestampedLyrics, AlignedWord } from '@/hooks/useTimestampedLyrics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface StudioLyricsPanelProps {
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

// Detect section boundaries based on time gaps and patterns
interface DetectedSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'unknown';
  lines: LyricLine[];
  startTime: number;
  endTime: number;
  text: string;
}

// Group words into lines based on newlines or time gaps - improved
function groupWordsIntoLines(words: AlignedWord[]): LyricLine[] {
  const lines: LyricLine[] = [];
  let currentLineWords: AlignedWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    
    // Skip empty words
    if (!word.word.trim()) continue;
    
    currentLineWords.push(word);

    const hasNewline = word.word.includes('\n');
    const hasDoubleNewline = word.word.includes('\n\n');
    // Increased gap threshold for better line separation (was 0.5, now 0.8)
    const hasTimeGap = nextWord ? nextWord.startS - word.endS > 0.8 : true;
    const isLongLine = currentLineWords.length >= 12; // Increased from 10 to 12

    if (hasDoubleNewline || hasTimeGap || isLongLine || !nextWord) {
      if (currentLineWords.length > 0) {
        const lineText = currentLineWords
          .map(w => w.word.replace(/\n/g, ''))
          .join(' ')
          .trim();
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
    } else if (hasNewline && !hasDoubleNewline) {
      // Single newline: add to current line but prepare for potential split
      // This handles cases where single \n is not a strong break
      continue;
    }
  }

  return lines;
}

// Filter out structural tags like [Verse], [Chorus], etc.
function isStructuralTag(word: string): boolean {
  return /^\[.*\]$/.test(word.trim());
}

// Group lines into sections based on time gaps
function groupLinesIntoSections(lines: LyricLine[]): DetectedSection[] {
  const sections: DetectedSection[] = [];
  let currentSectionLines: LyricLine[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    currentSectionLines.push(line);
    
    // Check for section break (large time gap > 2 seconds)
    const hasLargeGap = nextLine ? nextLine.startTime - line.endTime > 2 : true;
    const hasManyLines = currentSectionLines.length >= 4;
    
    if ((hasLargeGap && hasManyLines) || !nextLine) {
      if (currentSectionLines.length > 0) {
        const sectionText = currentSectionLines.map(l => l.text).join('\n');
        sections.push({
          type: 'unknown',
          lines: [...currentSectionLines],
          startTime: currentSectionLines[0].startTime,
          endTime: currentSectionLines[currentSectionLines.length - 1].endTime,
          text: sectionText,
        });
      }
      currentSectionLines = [];
    }
  }
  
  return sections;
}

export function StudioLyricsPanel({
  taskId,
  audioId,
  plainLyrics,
  currentTime,
  isPlaying,
  onSeek,
  selectionMode,
  onSectionSelect,
  highlightedSection,
}: StudioLyricsPanelProps) {
  const { data: lyricsData, loading } = useTimestampedLyrics(taskId, audioId);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Process lyrics into lines
  const lines = useMemo(() => {
    if (!lyricsData?.alignedWords?.length) return [];
    
    const filteredWords = lyricsData.alignedWords.filter(w => !isStructuralTag(w.word));
    return groupWordsIntoLines(filteredWords);
  }, [lyricsData]);

  // Group lines into sections
  const sections = useMemo(() => groupLinesIntoSections(lines), [lines]);

  // Find active line based on current time - improved timing
  useEffect(() => {
    if (!lines.length || !isPlaying) return;

    // Increased tolerance from 0.5 to 0.3 for better accuracy
    const activeIdx = lines.findIndex(
      line => currentTime >= line.startTime - 0.1 && currentTime <= line.endTime + 0.3
    );

    if (activeIdx !== -1 && activeIdx !== activeLineIndex) {
      setActiveLineIndex(activeIdx);
    }
  }, [currentTime, lines, isPlaying, activeLineIndex]);

  // Clear selection when exiting selection mode
  useEffect(() => {
    if (!selectionMode) {
      setSelectedLines(new Set());
    }
  }, [selectionMode]);

  // Get visible lines (4 lines centered on active) - more on mobile in selection mode
  const visibleLines = useMemo(() => {
    if (!lines.length) return [];
    
    const visibleCount = (selectionMode && isMobile) ? 8 : 4;
    const start = Math.max(0, activeLineIndex - Math.floor(visibleCount / 2));
    const end = Math.min(lines.length, start + visibleCount);
    
    return lines.slice(start, end).map((line, idx) => ({
      ...line,
      globalIndex: start + idx,
    }));
  }, [lines, activeLineIndex, selectionMode, isMobile]);

  const handleLineClick = useCallback((line: LyricLine, globalIndex: number) => {
    if (selectionMode) {
      // Toggle line selection
      setSelectedLines(prev => {
        const next = new Set(prev);
        if (next.has(globalIndex)) {
          next.delete(globalIndex);
        } else {
          next.add(globalIndex);
        }
        return next;
      });
    } else if (onSeek) {
      onSeek(line.startTime);
    }
  }, [selectionMode, onSeek]);

  const handleConfirmSelection = useCallback(() => {
    if (!selectedLines.size || !onSectionSelect) return;
    
    const sortedIndices = Array.from(selectedLines).sort((a, b) => a - b);
    const selectedLinesList = sortedIndices.map(idx => lines[idx]).filter(Boolean);
    
    if (selectedLinesList.length > 0) {
      const startTime = selectedLinesList[0].startTime;
      const endTime = selectedLinesList[selectedLinesList.length - 1].endTime;
      const lyrics = selectedLinesList.map(l => l.text).join('\n');
      
      onSectionSelect(startTime, endTime, lyrics);
      setSelectedLines(new Set());
    }
  }, [selectedLines, lines, onSectionSelect]);

  const handleSelectSection = useCallback((section: DetectedSection) => {
    if (!onSectionSelect) return;
    onSectionSelect(section.startTime, section.endTime, section.text);
  }, [onSectionSelect]);

  // Check if a line is within highlighted section
  const isLineHighlighted = useCallback((line: LyricLine) => {
    if (!highlightedSection) return false;
    return line.startTime >= highlightedSection.start && line.endTime <= highlightedSection.end;
  }, [highlightedSection]);

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
    <div className={cn(
      'px-4 sm:px-6 py-3 border-b border-border/30',
      'bg-gradient-to-r from-primary/5 via-transparent to-primary/5',
      selectionMode && 'bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {selectionMode ? (
            <Scissors className="w-4 h-4 text-amber-500" />
          ) : (
            <Music2 className="w-4 h-4 text-primary" />
          )}
          <span className="font-medium">
            {selectionMode ? 'Выберите строки' : 'Текст песни'}
          </span>
          {selectionMode && selectedLines.size > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedLines.size} выбрано
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectionMode && selectedLines.size > 0 && (
            <Button
              size="sm"
              onClick={handleConfirmSelection}
              className="h-7 px-3 gap-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Выбрать</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 px-2"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Section Quick Select (Mobile) */}
      {selectionMode && isMobile && sections.length > 1 && !isCollapsed && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 -mx-4 px-4 scrollbar-hide">
          {sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSection(section)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium',
                'border transition-colors min-h-[36px]',
                'bg-card border-border hover:border-amber-500/50 hover:bg-amber-500/10'
              )}
            >
              Секция {idx + 1}
            </button>
          ))}
        </div>
      )}

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
                const isSelected = selectedLines.has(line.globalIndex);
                const isHighlighted = isLineHighlighted(line);

                return (
                  <motion.div
                    key={line.globalIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: isActive || isSelected || isHighlighted ? 1 : isPast ? 0.4 : 0.6,
                      x: 0,
                      scale: isActive ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleLineClick(line, line.globalIndex)}
                    className={cn(
                      'py-2 px-3 rounded-xl cursor-pointer transition-all text-sm',
                      // Touch targets for mobile
                      isMobile && 'min-h-[44px] flex items-center',
                      // Active line
                      isActive && !selectionMode && 'bg-primary/10 font-medium',
                      // Selection mode styles
                      selectionMode && 'border-2 border-transparent',
                      selectionMode && !isSelected && 'hover:border-amber-500/30 hover:bg-amber-500/5',
                      isSelected && 'border-amber-500 bg-amber-500/20 font-medium',
                      // Highlighted section
                      isHighlighted && !isSelected && 'bg-primary/10 border-primary/30',
                      // Default hover
                      !isActive && !selectionMode && 'hover:bg-muted/50'
                    )}
                  >
                    {selectionMode && (
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0',
                        'flex items-center justify-center transition-colors',
                        isSelected 
                          ? 'bg-amber-500 border-amber-500' 
                          : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    )}
                    <span className="flex-1">
                      {line.words.map((word, wordIdx) => {
                        // Improved word activation timing with small offset
                        const isWordActive = isPlaying && 
                          currentTime >= word.startS - 0.05 && 
                          currentTime <= word.endS + 0.05;

                        return (
                          <span
                            key={wordIdx}
                            className={cn(
                              'inline transition-all duration-100',
                              isWordActive && !selectionMode && 'text-primary font-bold scale-105'
                            )}
                          >
                            {word.word.replace(/\n/g, '')}{' '}
                          </span>
                        );
                      })}
                    </span>
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
