import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';

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
}

export function TimestampedLyrics({ taskId, audioId, currentTime, isPlaying, duration = 0 }: TimestampedLyricsProps) {
  const [lyricsData, setLyricsData] = useState<TimestampedLyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to active line
  useEffect(() => {
    if (isPlaying && activeLineRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeElement = activeLineRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      
      const scrollTop = activeRect.top - containerRect.top - containerRect.height / 2 + activeRect.height / 2;
      
      container.scrollTo({
        top: container.scrollTop + scrollTop,
        behavior: 'smooth',
      });
    }
  }, [currentTime, isPlaying]);

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
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Текст песни недоступен</p>
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
        <div className="px-4 md:px-6 pb-24 md:pb-6 space-y-3 md:space-y-4">
          {lines.map((line, lineIndex) => {
          const lineStart = line[0].startS;
          const lineEnd = line[line.length - 1].endS;
          const isActiveLine = currentTime >= lineStart && currentTime <= lineEnd;
          
          return (
            <div
              key={lineIndex}
              ref={isActiveLine ? activeLineRef : null}
              className={`transition-all duration-300 ${
                isActiveLine ? 'md:scale-105' : 'scale-100'
              }`}
            >
              <div className="flex flex-wrap gap-1">
                {line.map((word, wordIndex) => {
                  const isActiveWord = currentTime >= word.startS && currentTime <= word.endS;
                  const isPast = currentTime > word.endS;
                  
                  return (
                    <span
                      key={`${lineIndex}-${wordIndex}`}
                      className={`inline-block transition-all duration-200 text-base md:text-lg font-medium ${
                        isActiveWord
                          ? 'text-primary scale-105 md:scale-110 font-bold'
                          : isPast
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {word.word}
                    </span>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
