import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

interface LyricsData {
  normalLyrics?: string;
  alignedWords?: AlignedWord[];
}

interface LyricsViewProps {
  lyrics: LyricsData | string | null | undefined;
  currentTime?: number;
  onSeek?: (time: number) => void;
  isLoading?: boolean;
}

export function LyricsView({ lyrics, currentTime = 0, onSeek, isLoading = false }: LyricsViewProps) {
  const [copied, setCopied] = useState(false);
  const lyricsRef = useRef<HTMLDivElement>(null);

  // Parse lyrics data
  // TODO: T047 - Ensure lyrics are properly fetched from database
  // Current implementation handles both string and structured lyrics data
  // Future: Validate lyrics data structure matches database schema
  const lyricsData = typeof lyrics === 'string' 
    ? { normalLyrics: lyrics } 
    : lyrics || {};

  const hasTimestampedLyrics = lyricsData.alignedWords && lyricsData.alignedWords.length > 0;
  const lyricsText = lyricsData.normalLyrics || '';

  // TODO: T056 - Word highlighting logic (already implemented)
  // Current implementation highlights words in real-time during playback
  // Future enhancements:
  // - Add click-to-seek functionality for each word
  // - Support for lyrics translation/romanization
  // - Offline caching of lyrics data
  
  // Auto-scroll to current line in timestamped lyrics
  // T055 - Mobile-optimized auto-scroll with smooth behavior
  useEffect(() => {
    if (!hasTimestampedLyrics || !lyricsRef.current || !currentTime) return;

    const currentWord = lyricsData.alignedWords?.find(
      (word) => currentTime >= word.startS && currentTime <= word.endS
    );

    if (currentWord) {
      const wordElement = lyricsRef.current.querySelector(`[data-start="${currentWord.startS}"]`);
      if (wordElement) {
        // T055 - Mobile-friendly scrolling with proper viewport alignment
        wordElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest' // Better for mobile horizontal scrolling
        });
      }
    }
  }, [currentTime, hasTimestampedLyrics, lyricsData.alignedWords]);

  const handleCopy = async () => {
    try {
      const textToCopy = hasTimestampedLyrics
        ? lyricsData.alignedWords?.map(w => w.word).join(' ').replace(/\n/g, '\n')
        : lyricsText;
      
      await navigator.clipboard.writeText(textToCopy || '');
      setCopied(true);
      toast.success('Текст скопирован в буфер обмена');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Не удалось скопировать текст');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!lyricsText && !hasTimestampedLyrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <p className="text-muted-foreground text-lg mb-2">
          Текст песни недоступен
        </p>
        <p className="text-muted-foreground text-sm">
          Текст появится здесь после генерации
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Copy Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
        {copied ? (
            <>
              <Check className="h-4 w-4" />
              Скопировано!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Копировать
            </>
          )}
        </Button>
      </div>

      {/* Lyrics Content */}
      {/* T055 - Mobile-optimized lyrics container with touch-friendly spacing */}
      <div
        ref={lyricsRef}
        className="space-y-2 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pr-2
                   /* Mobile optimizations for better readability */
                   touch-pan-y /* Enable smooth touch scrolling */
                   overscroll-contain /* Prevent parent scroll interference */
                   px-1 sm:px-0 /* Extra padding on mobile for thumb clearance */
                  "
      >
        {hasTimestampedLyrics ? (
          // Timestamped lyrics with word-by-word highlighting
          <div className="space-y-3">
            {(lyricsData.alignedWords || []).reduce((lines, word, index) => {
              if (index === 0 || word.word.includes('\n')) {
                lines.push([]);
              }
              lines[lines.length - 1].push(word);
              return lines;
            }, [] as AlignedWord[][]).map((line, lineIndex) => {
              const isActive = line.some(
                word => currentTime >= word.startS && currentTime <= word.endS
              );
              const isPast = line.every(word => currentTime > word.endS);
              
              return (
                <motion.div
                  key={lineIndex}
                  initial={{ opacity: 0.4 }}
                  animate={{
                    opacity: isActive ? 1 : isPast ? 0.6 : 0.4,
                    scale: isActive ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'text-lg font-medium cursor-pointer transition-all py-1 px-2 rounded-md',
                    isActive && 'font-bold text-primary bg-primary/10'
                  )}
                  onClick={() => onSeek && onSeek(line[0].startS)}
                  data-start={line[0].startS}
                >
                  {line.map((word, wordIndex) => {
                    const isWordActive = currentTime >= word.startS && currentTime <= word.endS;
                    return (
                      <span
                        key={wordIndex}
                        className={cn(
                          'mr-2 transition-colors',
                          isWordActive && 'text-primary font-extrabold'
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
          // Normal lyrics (plain text)
          <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {lyricsText}
          </div>
        )}
      </div>
    </div>
  );
}
