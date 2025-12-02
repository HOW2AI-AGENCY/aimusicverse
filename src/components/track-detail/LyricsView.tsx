import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const lyricsData = typeof lyrics === 'string' 
    ? { normalLyrics: lyrics } 
    : lyrics || {};

  const hasTimestampedLyrics = lyricsData.alignedWords && lyricsData.alignedWords.length > 0;
  const lyricsText = lyricsData.normalLyrics || '';

  // Auto-scroll to current line in timestamped lyrics
  useEffect(() => {
    if (!hasTimestampedLyrics || !lyricsRef.current || !currentTime) return;

    const currentWord = lyricsData.alignedWords?.find(
      (word) => currentTime >= word.startS && currentTime <= word.endS
    );

    if (currentWord) {
      const wordElement = lyricsRef.current.querySelector(`[data-start="${currentWord.startS}"]`);
      if (wordElement) {
        wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      toast.success('Lyrics copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy lyrics');
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
          No lyrics available
        </p>
        <p className="text-muted-foreground text-sm">
          Lyrics will appear here once they are generated
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
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Lyrics
            </>
          )}
        </Button>
      </div>

      {/* Lyrics Content */}
      <div
        ref={lyricsRef}
        className="space-y-2 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pr-2"
      >
        {hasTimestampedLyrics ? (
          // Timestamped lyrics with word-by-word highlighting
          <div className="space-y-3">
            {lyricsData.alignedWords!.reduce((lines, word, index) => {
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
