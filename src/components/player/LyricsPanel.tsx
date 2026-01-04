/**
 * LyricsPanel - Unified lyrics display component
 * 
 * Used by both mobile and desktop fullscreen players.
 * Features synchronized word highlighting, auto-scroll, and tap-to-seek.
 */

import { memo, useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { 
  useLyricsSynchronization, 
  SYNC_CONSTANTS,
  type AlignedWord 
} from '@/hooks/lyrics/useLyricsSynchronization';
import { SynchronizedWord } from '@/components/lyrics/SynchronizedWord';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { Track } from '@/types/track';
import '@/styles/lyrics-sync.css';

interface LyricsPanelProps {
  track: Track;
  className?: string;
  variant?: 'mobile' | 'desktop';
  showWordHighlight?: boolean;
}

// Helper to filter structural tags
const isStructuralTag = (text: string) => {
  if (!text || typeof text !== 'string') return false;
  return /^\[?(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda|Куплет|Припев|Бридж|Аутро|Интро)(\s*\d*)?\]?$/i.test(text.trim());
};

// Clean structural tags from plain text
const cleanLyrics = (text: string) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\[(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda|Куплет|Припев|Бридж|Аутро|Интро)(\s*\d*)?\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const LyricsPanel = memo(function LyricsPanel({ 
  track, 
  className,
  variant = 'desktop',
  showWordHighlight = true,
}: LyricsPanelProps) {
  const { seek } = useAudioTime();
  const { isPlaying } = usePlayerStore();
  
  // User scroll state
  const [userScrolling, setUserScrolling] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const isProgrammaticScrollRef = useRef(false);
  
  // Fetch timestamped lyrics
  const { data: lyricsData } = useTimestampedLyrics(
    track.suno_task_id || null,
    track.suno_id || null
  );

  // Parse lyrics into lines
  const { lyricsLines, plainLyrics } = useMemo(() => {
    let words: AlignedWord[] = [];
    
    const isValidAlignedWord = (w: unknown): w is AlignedWord => {
      if (!w || typeof w !== 'object') return false;
      const obj = w as Record<string, unknown>;
      return typeof obj.word === 'string' && 
             typeof obj.startS === 'number' && 
             typeof obj.endS === 'number' &&
             isFinite(obj.startS) && 
             isFinite(obj.endS);
    };
    
    try {
      if (lyricsData?.alignedWords && Array.isArray(lyricsData.alignedWords) && lyricsData.alignedWords.length > 0) {
        words = (lyricsData.alignedWords as unknown[])
          .filter(isValidAlignedWord)
          .filter(w => !isStructuralTag(w.word));
      } else if (track.lyrics) {
        try {
          if (track.lyrics.trim().startsWith('{') || track.lyrics.trim().startsWith('[')) {
            const parsed = JSON.parse(track.lyrics);
            if (parsed?.alignedWords && Array.isArray(parsed.alignedWords)) {
              words = (parsed.alignedWords as unknown[])
                .filter(isValidAlignedWord)
                .filter(w => !isStructuralTag(w.word));
            }
          }
        } catch {
          return { lyricsLines: null, plainLyrics: cleanLyrics(track.lyrics) };
        }
        
        if (words.length === 0) {
          return { lyricsLines: null, plainLyrics: cleanLyrics(track.lyrics) };
        }
      }
      
      if (words.length === 0) {
        return { lyricsLines: null, plainLyrics: null };
      }

      // Group words into lines
      const lines: AlignedWord[][] = [];
      let currentLine: AlignedWord[] = [];
      
      words.forEach((word) => {
        if (isStructuralTag(word.word)) return;
        
        const hasLineBreak = word.word.includes('\n');
        
        if (hasLineBreak) {
          const parts = word.word.split('\n');
          parts.forEach((part, index) => {
            if (part.trim() && !isStructuralTag(part)) {
              currentLine.push({ ...word, word: part.trim() });
            }
            if (index < parts.length - 1) {
              if (currentLine.length > 0) {
                lines.push([...currentLine]);
                currentLine = [];
              }
            }
          });
        } else if (word.word.trim()) {
          currentLine.push(word);
          
          const endsWithPunctuation = /[.!?;]$/.test(word.word.trim());
          if (endsWithPunctuation || currentLine.length >= 6) {
            lines.push([...currentLine]);
            currentLine = [];
          }
        }
      });
      
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      
      return { lyricsLines: lines.length > 0 ? lines : null, plainLyrics: null };
    } catch {
      const fallbackText = track.lyrics ? cleanLyrics(track.lyrics) : null;
      return { lyricsLines: null, plainLyrics: fallbackText };
    }
  }, [lyricsData, track.lyrics]);

  // Flatten words for synchronization
  const flattenedWords = useMemo(() => {
    if (!lyricsLines) return [];
    return lyricsLines.flat();
  }, [lyricsLines]);

  // Use sync hook
  const {
    activeLineIndex,
    currentTime: syncedTime,
    constants,
  } = useLyricsSynchronization({
    words: flattenedWords,
    enabled: !!lyricsLines?.length && isPlaying,
  });

  // Handle user scroll detection
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      
      const currentScrollTop = container.scrollTop;
      const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);
      
      if (scrollDelta > 5) {
        setUserScrolling(true);
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          setUserScrolling(false);
        }, 5000);
      }
      
      lastScrollTopRef.current = currentScrollTop;
    };

    const handleTouchStart = () => {
      setUserScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };

    const handleTouchEnd = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, 5000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex < 0 || !activeLineRef.current || !lyricsContainerRef.current || userScrolling) return;
    if (!isPlaying) return;
    
    const container = lyricsContainerRef.current;
    const activeLine = activeLineRef.current;
    
    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      
      const lineTopInContainer = lineRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = lineTopInContainer - (containerRect.height * 0.3);
      
      const currentLinePos = lineRect.top - containerRect.top;
      const isInView = currentLinePos > containerRect.height * 0.2 && currentLinePos < containerRect.height * 0.5;
      
      if (!isInView) {
        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 400);
      }
    });
  }, [activeLineIndex, userScrolling, isPlaying]);

  const handleWordClick = useCallback((startTime: number) => {
    hapticImpact('light');
    seek(startTime);
  }, [seek]);

  const isMobile = variant === 'mobile';
  const textSize = isMobile ? 'text-lg' : 'text-xl';
  const lineSpacing = isMobile ? 'space-y-1' : 'space-y-3';

  return (
    <div className={cn('relative flex flex-col h-full', className)}>
      {/* User scroll indicator */}
      <AnimatePresence>
        {userScrolling && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2 z-10"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUserScrolling(false)}
              className="h-7 px-2 text-xs bg-muted/90 backdrop-blur-sm"
            >
              Вкл. автоскролл
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={lyricsContainerRef}
        className={cn(
          'flex-1 overflow-y-auto px-4 py-4 lyrics-scroll-container',
          isMobile && 'touch-action-pan-y'
        )}
        style={{ overscrollBehavior: 'contain' }}
      >
        {lyricsLines ? (
          <div className={cn(
            'flex flex-col items-center text-center lyrics-container-enter',
            lineSpacing,
            isMobile ? 'pb-[30vh]' : 'pb-[20vh]'
          )}>
            {lyricsLines.map((line, lineIndex) => {
              const isActiveLine = lineIndex === activeLineIndex;
              const isPastLine = activeLineIndex > -1 && lineIndex < activeLineIndex;
              const lineStart = line[0]?.startS ?? 0;

              return (
                <motion.div
                  key={lineIndex}
                  ref={isActiveLine ? activeLineRef : null}
                  onClick={() => handleWordClick(lineStart)}
                  animate={{
                    scale: isActiveLine ? 1.02 : 1,
                    opacity: isActiveLine ? 1 : isPastLine ? 0.4 : 0.5,
                  }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={cn(
                    'px-3 py-1 rounded-lg cursor-pointer w-full lyric-line',
                    'will-change-[transform,opacity,background-color] transform-gpu',
                    isActiveLine && 'bg-primary/10 lyric-line--active'
                  )}
                >
                  <div className={cn(
                    'flex flex-wrap justify-center gap-x-1.5 gap-y-0.5',
                    !isMobile && 'gap-x-2 gap-y-1'
                  )}>
                    {showWordHighlight ? (
                      line.map((word, wordIndex) => {
                        const adjustedTime = syncedTime + constants.WORD_LOOK_AHEAD_MS / 1000;
                        const endTolerance = constants.WORD_END_TOLERANCE_MS / 1000;
                        const isActiveWord = isActiveLine && adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance;
                        const isPastWord = syncedTime > word.endS + endTolerance;

                        return (
                          <SynchronizedWord
                            key={`${lineIndex}-${wordIndex}-${word.startS}`}
                            word={word.word}
                            isActive={isActiveWord}
                            isPast={isPastWord}
                            onClick={() => handleWordClick(word.startS)}
                            className={cn(textSize, 'font-medium')}
                            activeClassName="text-primary scale-110 font-bold"
                            pastClassName="text-foreground/70"
                            futureClassName="text-foreground/50"
                          />
                        );
                      })
                    ) : (
                      <span className={cn(textSize, 'font-medium')}>
                        {line.map(w => w.word.replace(/\n/g, '').trim()).join(' ')}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : plainLyrics ? (
          <div className="min-h-full flex items-center justify-center">
            <p className={cn(
              'text-center leading-relaxed whitespace-pre-wrap text-foreground/90',
              textSize
            )}>
              {plainLyrics}
            </p>
          </div>
        ) : (
          <div className="min-h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Текст песни недоступен
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default LyricsPanel;
