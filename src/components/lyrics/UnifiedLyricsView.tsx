import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface TimestampedWord {
  word: string;
  startS: number;
  endS: number;
}

interface UnifiedLyricsViewProps {
  lyrics?: string | null;
  timestampedLyrics?: { alignedWords: TimestampedWord[] } | null;
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  maxHeight?: string;
  showCopyButton?: boolean;
  variant?: 'default' | 'compact' | 'fullscreen';
}

function parseLyrics(lyrics: string | null | undefined): {
  plainText: string;
  timestamped: { alignedWords: TimestampedWord[] } | null;
} {
  if (!lyrics) {
    return { plainText: '', timestamped: null };
  }

  if (lyrics.trim().startsWith('{') || lyrics.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(lyrics);
      
      if (parsed.alignedWords && Array.isArray(parsed.alignedWords)) {
        const plainText = parsed.alignedWords.map((w: TimestampedWord) => w.word).join(' ');
        return { plainText, timestamped: parsed };
      }
      
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].word !== undefined) {
        const plainText = parsed.map((w: TimestampedWord) => w.word).join(' ');
        return { plainText, timestamped: { alignedWords: parsed } };
      }
      
      if (parsed.normalLyrics) {
        return {
          plainText: parsed.normalLyrics,
          timestamped: parsed.alignedWords ? { alignedWords: parsed.alignedWords } : null,
        };
      }
    } catch {
      // Not valid JSON
    }
  }

  const cleanedLyrics = lyrics
    .replace(/\[Verse\s*\d*\]/gi, '\n[Куплет]\n')
    .replace(/\[Chorus\]/gi, '\n[Припев]\n')
    .replace(/\[Bridge\]/gi, '\n[Бридж]\n')
    .replace(/\[Outro\]/gi, '\n[Аутро]\n')
    .replace(/\[Intro\]/gi, '\n[Интро]\n')
    .replace(/\[Pre-Chorus\]/gi, '\n[Пред-припев]\n')
    .replace(/\[Hook\]/gi, '\n[Хук]\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { plainText: cleanedLyrics, timestamped: null };
}

export function UnifiedLyricsView({
  lyrics,
  timestampedLyrics: providedTimestamped,
  currentTime = 0,
  isPlaying = false,
  onSeek,
  maxHeight = '400px',
  showCopyButton = true,
  variant = 'default',
}: UnifiedLyricsViewProps) {
  const [copied, setCopied] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [userScrolling, setUserScrolling] = useState(false);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const isProgrammaticScrollRef = useRef(false);

  const { plainText, timestamped } = useMemo(() => {
    if (providedTimestamped) {
      const plain = providedTimestamped.alignedWords.map(w => w.word).join(' ');
      return { plainText: plain, timestamped: providedTimestamped };
    }
    return parseLyrics(lyrics);
  }, [lyrics, providedTimestamped]);

  const hasTimestampedLyrics = timestamped && timestamped.alignedWords.length > 0;

  // Handle user scroll detection - improved
  const handleScroll = useCallback((e: Event) => {
    // Ignore programmatic scrolls
    if (isProgrammaticScrollRef.current) return;
    
    const target = e.target as HTMLElement;
    const currentScrollTop = target.scrollTop;
    
    // Detect if this is user-initiated scroll (not programmatic)
    const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);
    
    // Lower threshold for better detection (was 10, now 5)
    if (scrollDelta > 5) {
      setUserScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Resume auto-scroll after 5 seconds of no user scroll (was 3)
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, 5000);
    }
    
    lastScrollTopRef.current = currentScrollTop;
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = lyricsRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', () => setUserScrolling(true), { passive: true });
    container.addEventListener('touchend', () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, 3000);
    }, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Update active word based on current time - improved timing
  useEffect(() => {
    if (!hasTimestampedLyrics || !isPlaying) return;
    
    const words = timestamped!.alignedWords;
    // Added small timing offset for better accuracy
    const idx = words.findIndex(w => 
      currentTime >= w.startS - 0.05 && 
      currentTime <= w.endS + 0.05
    );
    
    if (idx !== -1 && idx !== activeWordIndex) {
      setActiveWordIndex(idx);
    }
  }, [currentTime, hasTimestampedLyrics, timestamped, isPlaying, activeWordIndex]);

  // Auto-scroll to active word (only if not user scrolling) - improved
  useEffect(() => {
    if (!hasTimestampedLyrics || !isPlaying || activeWordIndex === null || userScrolling) return;
    
    const container = lyricsRef.current;
    if (!container) return;

    const el = container.querySelector(`[data-word-index="${activeWordIndex}"]`) as HTMLElement;
    if (!el) return;

    // Calculate scroll position to keep active element at ~30% from top
    const containerRect = container.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();
    const targetPosition = containerRect.height * 0.3;
    const currentPosition = elementRect.top - containerRect.top;
    const scrollOffset = currentPosition - targetPosition;
    const targetScrollTop = Math.max(0, container.scrollTop + scrollOffset);
    
    // Only scroll if element is not in view or too far from target position
    const needsScroll = Math.abs(scrollOffset) > 50;
    if (!needsScroll) return;
    
    // Smooth scroll with programmatic flag
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = true;
      lastScrollTopRef.current = targetScrollTop;
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      // Reset programmatic flag after scroll animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 600);
    });
  }, [activeWordIndex, hasTimestampedLyrics, isPlaying, userScrolling]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      toast.success('Текст скопирован');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  const handleWordClick = (word: TimestampedWord) => {
    if (onSeek) {
      onSeek(word.startS);
      setUserScrolling(false); // Resume auto-scroll after manual seek
    }
  };

  if (!plainText && !hasTimestampedLyrics) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center text-center p-6',
        variant === 'compact' ? 'py-4' : 'py-8'
      )}>
        <Music2 className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground text-sm">
          Текст песни недоступен
        </p>
      </div>
    );
  }

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className="h-full overflow-hidden relative">
        {/* User scroll indicator */}
        {userScrolling && (
          <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-muted/80 rounded text-xs text-muted-foreground">
            Автоскролл выкл
          </div>
        )}
        <div
          ref={lyricsRef}
          className="h-full overflow-y-auto px-4 py-8 touch-pan-y overscroll-contain scroll-smooth"
        >
          {hasTimestampedLyrics ? (
            <div className="space-y-1">
              {groupWordsIntoLines(timestamped!.alignedWords).map((line, lineIndex) => {
                const isLineActive = line.some(w => currentTime >= w.startS && currentTime <= w.endS);
                const isLinePast = line.every(w => currentTime > w.endS);

                return (
                  <motion.div
                    key={lineIndex}
                    initial={{ opacity: 0.3 }}
                    animate={{
                      opacity: isLineActive ? 1 : isLinePast ? 0.5 : 0.3,
                      scale: isLineActive ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'text-xl font-medium cursor-pointer py-2 px-3 rounded-lg transition-all',
                      isLineActive && 'text-primary bg-primary/10 font-bold'
                    )}
                    onClick={() => {
                      if (onSeek) {
                        onSeek(line[0].startS);
                        setUserScrolling(false);
                      }
                    }}
                  >
                    {line.map((word, wordIndex) => {
                      const globalIndex = timestamped!.alignedWords.indexOf(word);
                      const isWordActive = currentTime >= word.startS && currentTime <= word.endS;
                      
                      return (
                        <span
                          key={wordIndex}
                          data-word-index={globalIndex}
                          className={cn(
                            'inline mr-1.5 transition-colors',
                            isWordActive && 'text-primary font-extrabold underline decoration-primary/50'
                          )}
                        >
                          {word.word.replace('\n', '')}
                        </span>
                      );
                    })}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/90">
              {plainText}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default and compact variants
  return (
    <div className="space-y-4">
      {showCopyButton && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Текст песни</h3>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 min-h-[44px]">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Копировать
              </>
            )}
          </Button>
        </div>
      )}

      <Card className="p-0">
        <ScrollArea className="h-full" style={{ maxHeight }}>
          <div ref={lyricsRef} className="p-6">
            {hasTimestampedLyrics ? (
              <div className="leading-relaxed">
                {timestamped!.alignedWords.map((word, i) => {
                  const isWordActive = isPlaying && currentTime >= word.startS && currentTime <= word.endS;
                  
                  return (
                    <span
                      key={i}
                      data-word-index={i}
                      onClick={() => handleWordClick(word)}
                      className={cn(
                        'inline px-0.5 rounded transition-all cursor-pointer hover:bg-primary/10',
                        isWordActive && 'bg-primary text-primary-foreground font-medium'
                      )}
                    >
                      {word.word}{' '}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{plainText}</p>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

function groupWordsIntoLines(words: TimestampedWord[]): TimestampedWord[][] {
  const lines: TimestampedWord[][] = [];
  let currentLine: TimestampedWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    
    // Skip empty words
    if (!word.word.trim()) continue;
    
    currentLine.push(word);
    
    // Check for line breaks
    const hasNewline = word.word.includes('\n');
    const hasDoubleNewline = word.word.includes('\n\n');
    
    // Time gap threshold for line separation (increased from 0.5 to 0.8)
    const timeGap = nextWord ? nextWord.startS - word.endS : 0;
    const hasTimeGap = timeGap > 0.8;
    
    if (hasDoubleNewline || (hasNewline && hasTimeGap) || !nextWord) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // Fallback grouping for continuous text (no newlines)
  if (lines.length <= 1 && words.length > 8) {
    const result: TimestampedWord[][] = [];
    let line: TimestampedWord[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word.word.trim()) continue;
      
      line.push(word);
      
      const nextWord = words[i + 1];
      const timeGap = nextWord ? nextWord.startS - word.endS : 0;
      
      // Increased from 8/0.5 to 10/0.8 for better grouping
      if (line.length >= 10 || timeGap > 0.8) {
        if (line.length > 0) {
          result.push(line);
          line = [];
        }
      }
    }
    
    if (line.length > 0) {
      result.push(line);
    }
    
    return result;
  }

  return lines;
}

export default UnifiedLyricsView;
