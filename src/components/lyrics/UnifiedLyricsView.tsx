import { useState, useEffect, useRef, useMemo } from 'react';
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

// Parse lyrics from various formats
function parseLyrics(lyrics: string | null | undefined): {
  plainText: string;
  timestamped: { alignedWords: TimestampedWord[] } | null;
} {
  if (!lyrics) {
    return { plainText: '', timestamped: null };
  }

  // Try to parse as JSON (timestamped lyrics)
  if (lyrics.trim().startsWith('{') || lyrics.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(lyrics);
      
      // Handle { alignedWords: [...] } format
      if (parsed.alignedWords && Array.isArray(parsed.alignedWords)) {
        const plainText = parsed.alignedWords.map((w: TimestampedWord) => w.word).join(' ');
        return { plainText, timestamped: parsed };
      }
      
      // Handle [ { word, startS, endS }, ... ] format
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].word !== undefined) {
        const plainText = parsed.map((w: TimestampedWord) => w.word).join(' ');
        return { plainText, timestamped: { alignedWords: parsed } };
      }
      
      // Handle { normalLyrics: "...", alignedWords: [...] } format
      if (parsed.normalLyrics) {
        return {
          plainText: parsed.normalLyrics,
          timestamped: parsed.alignedWords ? { alignedWords: parsed.alignedWords } : null,
        };
      }
    } catch {
      // Not valid JSON, treat as plain text
    }
  }

  // Plain text lyrics - clean up Suno structural tags for display
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
  const lyricsRef = useRef<HTMLDivElement>(null);

  // Parse lyrics data
  const { plainText, timestamped } = useMemo(() => {
    if (providedTimestamped) {
      const plain = providedTimestamped.alignedWords.map(w => w.word).join(' ');
      return { plainText: plain, timestamped: providedTimestamped };
    }
    return parseLyrics(lyrics);
  }, [lyrics, providedTimestamped]);

  const hasTimestampedLyrics = timestamped && timestamped.alignedWords.length > 0;

  // Update active word based on current time
  useEffect(() => {
    if (!hasTimestampedLyrics || !isPlaying) return;
    
    const words = timestamped!.alignedWords;
    const idx = words.findIndex(w => currentTime >= w.startS && currentTime <= w.endS);
    
    if (idx !== -1 && idx !== activeWordIndex) {
      setActiveWordIndex(idx);
    }
  }, [currentTime, hasTimestampedLyrics, timestamped, isPlaying, activeWordIndex]);

  // Auto-scroll to active word
  useEffect(() => {
    if (hasTimestampedLyrics && isPlaying && activeWordIndex !== null && lyricsRef.current) {
      const el = lyricsRef.current.querySelector(`[data-word-index="${activeWordIndex}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeWordIndex, hasTimestampedLyrics, isPlaying]);

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
    }
  };

  // No lyrics available
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

  // Fullscreen variant - optimized for mobile player
  if (variant === 'fullscreen') {
    return (
      <div className="h-full overflow-hidden">
        <div
          ref={lyricsRef}
          className="h-full overflow-y-auto px-4 py-8 touch-pan-y overscroll-contain"
        >
          {hasTimestampedLyrics ? (
            <div className="space-y-4">
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
                    onClick={() => onSeek && onSeek(line[0].startS)}
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
      {/* Header with copy button */}
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

      {/* Lyrics content */}
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

// Helper function to group words into lines for fullscreen display
function groupWordsIntoLines(words: TimestampedWord[]): TimestampedWord[][] {
  const lines: TimestampedWord[][] = [];
  let currentLine: TimestampedWord[] = [];

  for (const word of words) {
    if (word.word.includes('\n')) {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = [];
    }
    currentLine.push(word);
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  // If no newlines found, split by time gaps or every ~8 words
  if (lines.length <= 1 && words.length > 8) {
    const result: TimestampedWord[][] = [];
    let line: TimestampedWord[] = [];
    
    for (let i = 0; i < words.length; i++) {
      line.push(words[i]);
      
      // Start new line after ~8 words or if there's a significant time gap
      const nextWord = words[i + 1];
      const timeGap = nextWord ? nextWord.startS - words[i].endS : 0;
      
      if (line.length >= 8 || timeGap > 0.5) {
        result.push(line);
        line = [];
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
