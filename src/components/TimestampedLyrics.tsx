import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Music2 } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface AlignedWord {
  word: string;
  success: boolean;
  startS: number;
  endS: number;
  palign: number;
}

export interface TimestampedLyricsData {
  alignedWords: AlignedWord[];
  waveformData: number[];
  hootCer: number;
  isStreamed: boolean;
}

interface TimestampedLyricsProps {
  taskId?: string | null;
  audioId?: string | null;
  currentTime: number;
  isPlaying: boolean;
  duration?: number;
  fallbackLyrics?: string | null;
  onSeek?: (time: number) => void;
}

export function TimestampedLyrics({ 
  taskId, 
  audioId, 
  currentTime, 
  isPlaying, 
  duration = 0,
  fallbackLyrics,
  onSeek
}: TimestampedLyricsProps) {
  const [lyricsData, setLyricsData] = useState<TimestampedLyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Fetch timestamped lyrics
  useEffect(() => {
    if (!taskId || !audioId) return;

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-timestamped-lyrics`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ taskId, audioId }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch lyrics');
        }

        const data = await response.json();
        setLyricsData(data);
      } catch (err) {
        console.error('Error fetching lyrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lyrics');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [taskId, audioId]);

  // Auto-scroll to active line with debouncing for performance
  useEffect(() => {
    if (!isPlaying || !activeLineRef.current || !scrollRef.current) return;
    
    const container = scrollRef.current;
    const activeElement = activeLineRef.current;
    
    // Use requestAnimationFrame for better performance
    const scrollTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        
        const scrollOffset = isMobile ? containerRect.height / 3 : containerRect.height / 2;
        const scrollTop = activeRect.top - containerRect.top - scrollOffset + activeRect.height / 2;
        
        container.scrollTo({
          top: container.scrollTop + scrollTop,
          behavior: 'smooth',
        });
      });
    }, 100);
    
    return () => clearTimeout(scrollTimeout);
  }, [currentTime, isPlaying, isMobile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  if (!lyricsData || !lyricsData.alignedWords.length) {
    // Show fallback lyrics if available
    if (fallbackLyrics) {
      return (
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="px-4 md:px-6 pb-24 md:pb-6">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground text-sm">
              <Music2 className="h-4 w-4" />
              <span>Текст без временных меток</span>
            </div>
            <div className="whitespace-pre-wrap text-base md:text-lg leading-relaxed text-foreground/90">
              {fallbackLyrics}
            </div>
          </div>
        </ScrollArea>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Music2 className="h-12 w-12 opacity-50" />
        <p className="text-center">Текст песни недоступен</p>
      </div>
    );
  }

  // Group words into lines (by detecting line breaks in words)
  const lines: AlignedWord[][] = [];
  let currentLine: AlignedWord[] = [];

  lyricsData.alignedWords.forEach((word) => {
    const hasLineBreak = word.word.includes('\n');
    
    if (hasLineBreak) {
      const parts = word.word.split('\n');
      parts.forEach((part, index) => {
        if (part.trim()) {
          currentLine.push({ ...word, word: part });
        }
        if (index < parts.length - 1) {
          if (currentLine.length > 0) {
            lines.push([...currentLine]);
            currentLine = [];
          }
        }
      });
    } else {
      currentLine.push(word);
    }
  });

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return (
    <div className="h-full flex flex-col pb-safe">
      {/* Audio Waveform Visualization */}
      {lyricsData?.waveformData && lyricsData.waveformData.length > 0 && (
        <div className="mb-4 px-4 md:px-6 pt-4 md:pt-6">
          <AudioWaveform
            waveformData={lyricsData.waveformData}
            currentTime={currentTime}
            duration={duration}
          />
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="px-4 md:px-6 pb-24 md:pb-6 space-y-2 md:space-y-3">
          {lines.map((line, lineIndex) => {
          const lineStart = line[0].startS;
          const lineEnd = line[line.length - 1].endS;
          const isActiveLine = currentTime >= lineStart && currentTime <= lineEnd;
          const isPastLine = currentTime > lineEnd;
          
          return (
            <div
              key={lineIndex}
              ref={isActiveLine ? activeLineRef : null}
              onClick={() => onSeek?.(lineStart)}
              className={cn(
                'transition-all duration-200 cursor-pointer rounded-lg p-2 md:p-3',
                'hover:bg-muted/50 active:bg-muted touch-manipulation',
                isActiveLine && 'bg-primary/10 scale-[1.02] md:scale-105',
                !isActiveLine && 'scale-100'
              )}
            >
              <div className="flex flex-wrap gap-0.5 md:gap-1 leading-relaxed">
                {line.map((word, wordIndex) => {
                  const isActiveWord = currentTime >= word.startS && currentTime <= word.endS;
                  const isPast = currentTime > word.endS;
                  
                  return (
                    <span
                      key={`${lineIndex}-${wordIndex}`}
                      className={cn(
                        'inline-block transition-all duration-150',
                        'text-sm sm:text-base md:text-lg font-medium',
                        isActiveWord && 'text-primary scale-110 font-bold drop-shadow-sm',
                        !isActiveWord && isPast && 'text-foreground/80',
                        !isActiveWord && !isPast && 'text-muted-foreground/60'
                      )}
                    >
                      {word.word}
                    </span>
                  );
                })}
              </div>
              
              {/* Mobile: Show timestamp on active line */}
              {isMobile && isActiveLine && (
                <div className="text-xs text-primary/70 mt-1">
                  {Math.floor(lineStart / 60)}:{String(Math.floor(lineStart % 60)).padStart(2, '0')}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
