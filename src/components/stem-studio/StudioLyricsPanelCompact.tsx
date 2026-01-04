/**
 * Compact Studio Lyrics Panel
 * 
 * Optimized for mobile - collapsed by default, minimal height
 * Shows only 2 lines at a time with current line highlighted
 * Supports expand/collapse with custom scrollbar
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Music2, ChevronDown, ChevronUp, Scissors, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimestampedLyrics, AlignedWord } from '@/hooks/useTimestampedLyrics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SYNC_CONSTANTS } from '@/hooks/lyrics/useLyricsSynchronization';
import '@/styles/lyrics-sync.css';

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
  sectionTag?: string;
}

// Section tag types for styling
type SectionTagType = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'hook' | 'instrumental' | 'unknown';

const SECTION_TAG_COLORS: Record<SectionTagType, string> = {
  'verse': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'chorus': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bridge': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'intro': 'bg-green-500/20 text-green-400 border-green-500/30',
  'outro': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'pre-chorus': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'hook': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'instrumental': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'unknown': 'bg-muted/30 text-muted-foreground border-border',
};

// Group words into lines based on newlines or time gaps
function groupWordsIntoLines(words: AlignedWord[]): LyricLine[] {
  const lines: LyricLine[] = [];
  let currentLineWords: AlignedWord[] = [];
  let currentSectionTag: string | undefined;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check if this word is a section tag
    const tagMatch = extractSectionTag(word.word);
    if (tagMatch) {
      // Finish current line if any
      if (currentLineWords.length > 0) {
        const lineText = currentLineWords.map(w => w.word.replace('\n', '')).join(' ').trim();
        if (lineText) {
          lines.push({
            words: [...currentLineWords],
            startTime: currentLineWords[0].startS,
            endTime: currentLineWords[currentLineWords.length - 1].endS,
            text: lineText,
            sectionTag: currentSectionTag,
          });
        }
        currentLineWords = [];
      }
      
      // Add section tag as its own line
      lines.push({
        words: [word],
        startTime: word.startS,
        endTime: word.endS,
        text: '',
        sectionTag: tagMatch,
      });
      currentSectionTag = tagMatch;
      continue;
    }
    
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
            sectionTag: currentSectionTag,
          });
        }
      }
      currentLineWords = [];
    }
  }

  return lines;
}

// Extract section tag type from text
function extractSectionTag(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|пре-?припев|хук|instrumental|инструментал)(?:\s*\d+)?[\]\)]$/i);
  if (match) {
    const tag = match[1].toLowerCase();
    // Normalize Russian tags
    if (tag === 'куплет') return 'verse';
    if (tag === 'припев') return 'chorus';
    if (tag === 'бридж') return 'bridge';
    if (tag === 'интро') return 'intro';
    if (tag === 'аутро') return 'outro';
    if (tag.includes('пре')) return 'pre-chorus';
    if (tag === 'хук') return 'hook';
    if (tag === 'инструментал') return 'instrumental';
    return tag;
  }
  return null;
}

// Clean lyrics text from tags
function cleanLyricsText(text: string): string {
  return text
    .replace(/[\[\(](verse|chorus|bridge|intro|outro|pre-?chorus|hook|куплет|припев|бридж|интро|аутро|пре-?припев|хук|instrumental|инструментал)(?:\s*\d+)?[\]\)]/gi, '')
    .trim();
}

// Section tag badge component
function SectionTagBadge({ type }: { type: string }) {
  const normalizedType = (type.toLowerCase() as SectionTagType) || 'unknown';
  const colors = SECTION_TAG_COLORS[normalizedType] || SECTION_TAG_COLORS.unknown;
  
  const labels: Record<string, string> = {
    'verse': 'Куплет',
    'chorus': 'Припев',
    'bridge': 'Бридж',
    'intro': 'Интро',
    'outro': 'Аутро',
    'pre-chorus': 'Пре-припев',
    'hook': 'Хук',
    'instrumental': 'Инструментал',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono uppercase border',
      colors
    )}>
      {labels[normalizedType] || type}
    </span>
  );
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Process lyrics into lines
  const lines = useMemo(() => {
    if (!lyricsData?.alignedWords?.length) return [];
    return groupWordsIntoLines(lyricsData.alignedWords);
  }, [lyricsData]);
  
  // Filter out section tag lines for display count
  const contentLines = useMemo(() => lines.filter(l => !l.sectionTag || l.text), [lines]);

  // Find active line based on current time
  useEffect(() => {
    if (!contentLines.length) return;

    const activeIdx = contentLines.findIndex(
      line => currentTime >= line.startTime && currentTime <= line.endTime + 0.5
    );

    if (activeIdx !== -1 && activeIdx !== activeLineIndex) {
      setActiveLineIndex(activeIdx);
    }
  }, [currentTime, contentLines, activeLineIndex]);

  // Auto-scroll to active line in expanded mode
  useEffect(() => {
    if (isExpanded && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, isExpanded]);

  const handleLineClick = useCallback((line: LyricLine) => {
    if (onSeek && line.startTime > 0) {
      onSeek(line.startTime);
    }
  }, [onSeek]);

  // Get current and next line for compact view
  const currentLine = contentLines[activeLineIndex];
  const nextLine = contentLines[activeLineIndex + 1];

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

  // No timestamped lyrics - show plain text preview (cleaned from tags)
  if (!lines.length && plainLyrics) {
    const cleanedLyrics = cleanLyricsText(plainLyrics);
    const firstLine = cleanedLyrics.split('\n').find(l => l.trim()) || '';
    
    return (
      <div className="px-4 py-2 border-b border-border/30">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs text-muted-foreground w-full"
        >
          <Music2 className="w-3.5 h-3.5" />
          <span className="truncate flex-1 text-left">
            {firstLine}...
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          )}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2"
            >
              <ScrollArea className="max-h-[200px]">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap pr-4">
                  {cleanedLyrics}
                </p>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn(
      'px-4 py-2 border-b border-border/30 transition-colors',
      selectionMode && 'bg-amber-500/5'
    )}>
      {/* Header with expand/collapse */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Music2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Текст песни</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {activeLineIndex + 1}/{contentLines.length}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0 shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Compact view - current + next line */}
      {!isExpanded && (
        <div className="space-y-1">
          {currentLine && (
            <motion.div
              key={currentLine.startTime}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleLineClick(currentLine)}
              className={cn(
                'text-sm py-1 px-2 rounded-lg cursor-pointer',
                'bg-primary/10 font-medium'
              )}
            >
              {currentLine.sectionTag && !currentLine.text && (
                <SectionTagBadge type={currentLine.sectionTag} />
              )}
              {currentLine.text && currentLine.words.map((word, wordIdx) => {
                const adjustedTime = currentTime + SYNC_CONSTANTS.WORD_LOOK_AHEAD_MS / 1000;
                const endTolerance = SYNC_CONSTANTS.WORD_END_TOLERANCE_MS / 1000;
                const isWordActive = isPlaying && 
                  adjustedTime >= word.startS && 
                  adjustedTime <= word.endS + endTolerance;
                
                const cleanWord = word.word.replace('\n', '').trim();
                if (!cleanWord || extractSectionTag(cleanWord)) return null;

                return (
                  <span
                    key={wordIdx}
                    className={cn(
                      'inline transition-all duration-150',
                      isWordActive && [
                        'text-primary font-bold',
                        'bg-gradient-to-r from-primary/20 to-transparent',
                        'px-0.5 rounded'
                      ]
                    )}
                  >
                    {cleanWord}{' '}
                  </span>
                );
              })}
            </motion.div>
          )}
          
          {nextLine && nextLine.text && (
            <motion.div
              key={nextLine.startTime}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              onClick={() => handleLineClick(nextLine)}
              className="text-xs text-muted-foreground py-1 px-2 truncate cursor-pointer hover:opacity-70"
            >
              {nextLine.text}
            </motion.div>
          )}
        </div>
      )}

      {/* Expanded view with custom scrollbar */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ScrollArea className="max-h-[200px] mt-2 pt-2 border-t border-border/20" ref={scrollAreaRef}>
              <div className="space-y-1 pr-4">
                {lines.map((line, idx) => {
                  const isTagLine = line.sectionTag && !line.text;
                  const contentIdx = contentLines.findIndex(l => l.startTime === line.startTime);
                  const isActive = contentIdx === activeLineIndex;
                  const isPast = line.endTime < currentTime;

                  return (
                    <div
                      key={idx}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => handleLineClick(line)}
                      className={cn(
                        'py-1.5 px-2 rounded-lg cursor-pointer text-xs transition-all',
                        isTagLine && 'py-2',
                        isActive && 'bg-primary/10 font-medium',
                        !isActive && isPast && 'opacity-40',
                        !isActive && !isPast && 'opacity-60 hover:opacity-80'
                      )}
                    >
                      {isTagLine ? (
                        <SectionTagBadge type={line.sectionTag!} />
                      ) : (
                        <span>{line.text}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudioLyricsPanelCompact;
