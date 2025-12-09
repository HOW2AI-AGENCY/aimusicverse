/**
 * Mobile Lyrics Tab
 * 
 * Synchronized lyrics display for mobile studio
 */

import { useRef, useEffect } from 'react';
import { motion } from '@/lib/motion';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimestampedLyrics, AlignedWord } from '@/hooks/useTimestampedLyrics';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobileLyricsTabProps {
  taskId: string | null;
  audioId: string | null;
  plainLyrics: string | null;
  currentTime: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

export function MobileLyricsTab({
  taskId,
  audioId,
  plainLyrics,
  currentTime,
  isPlaying,
  onSeek,
}: MobileLyricsTabProps) {
  const { data: lyricsData, loading } = useTimestampedLyrics(taskId, audioId);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active line
  useEffect(() => {
    if (isPlaying && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, isPlaying]);

  // Render synchronized lyrics
  if (lyricsData?.alignedWords && lyricsData.alignedWords.length > 0) {
    // Group words into lines
    const lines: Array<{
      words: AlignedWord[];
      startTime: number;
      endTime: number;
    }> = [];
    
    let currentLine: AlignedWord[] = [];
    let lineStartTime = 0;
    
    lyricsData.alignedWords.forEach((word, index) => {
      if (currentLine.length === 0) {
        lineStartTime = word.startS;
      }
      
      currentLine.push(word);
      
      // Break line at punctuation or every 8 words
      const isPunctuation = /[.!?,;:]$/.test(word.word);
      const isLongLine = currentLine.length >= 8;
      const isLast = index === lyricsData.alignedWords.length - 1;
      
      if (isPunctuation || isLongLine || isLast) {
        lines.push({
          words: [...currentLine],
          startTime: lineStartTime,
          endTime: word.endS,
        });
        currentLine = [];
      }
    });

    return (
      <ScrollArea className="h-full" ref={containerRef}>
        <div className="p-4 space-y-3">
          {lines.map((line, lineIndex) => {
            const isActiveLine = currentTime >= line.startTime && currentTime <= line.endTime;
            
            return (
              <motion.div
                key={lineIndex}
                ref={isActiveLine ? activeLineRef : undefined}
                onClick={() => onSeek(line.startTime)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all",
                  isActiveLine 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted/50"
                )}
                animate={isActiveLine ? { scale: 1.02 } : { scale: 1 }}
              >
                <p className={cn(
                  "text-sm leading-relaxed",
                  isActiveLine ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {line.words.map((word, wordIndex) => {
                    const isActiveWord = currentTime >= word.startS && currentTime <= word.endS;
                    
                    return (
                      <span
                        key={wordIndex}
                        className={cn(
                          "transition-colors",
                          isActiveWord && "text-primary font-bold"
                        )}
                      >
                        {word.word}{' '}
                      </span>
                    );
                  })}
                </p>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    );
  }

  // Render plain lyrics as fallback
  if (plainLyrics) {
    const lines = plainLyrics.split('\n').filter(line => line.trim());
    
    return (
      <ScrollArea className="h-full">
        <div className="p-4 space-y-2">
          {lines.map((line, index) => {
            // Skip structural tags
            if (/^\[.*\]$/.test(line.trim())) {
              return (
                <div key={index} className="text-xs text-primary/60 font-medium uppercase tracking-wider py-2">
                  {line.replace(/[\[\]]/g, '')}
                </div>
              );
            }
            
            return (
              <p key={index} className="text-sm text-muted-foreground leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>
      </ScrollArea>
    );
  }

  // No lyrics available
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">Текст недоступен</h3>
      <p className="text-sm text-muted-foreground">
        Для этого трека нет синхронизированного текста
      </p>
    </div>
  );
}
