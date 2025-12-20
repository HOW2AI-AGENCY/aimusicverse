/**
 * LyricsSyncDisplay - Shows current lyrics line synced with playback
 * Displays the current line being sung based on playback position
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Music2 } from 'lucide-react';

interface LyricsLine {
  text: string;
  startTime: number;
  endTime: number;
}

interface LyricsSyncDisplayProps {
  lyrics?: string | null;
  timestampedLyrics?: {
    words?: { text: string; start: number; end: number }[];
  } | null;
  currentTime: number;
  duration: number;
  className?: string;
}

export const LyricsSyncDisplay = memo(({
  lyrics,
  timestampedLyrics,
  currentTime,
  duration,
  className,
}: LyricsSyncDisplayProps) => {
  // Parse lyrics into lines with estimated timing
  const lyricsLines = useMemo((): LyricsLine[] => {
    if (!lyrics) return [];
    
    const lines = lyrics.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];
    
    // If we have timestamped words, try to map them to lines
    if (timestampedLyrics?.words && timestampedLyrics.words.length > 0) {
      const words = timestampedLyrics.words;
      const result: LyricsLine[] = [];
      let wordIndex = 0;
      
      for (const line of lines) {
        const lineWords = line.split(/\s+/).filter(w => w.trim());
        if (lineWords.length === 0) continue;
        
        const lineStart = wordIndex < words.length ? words[wordIndex]?.start ?? 0 : 0;
        let lineEnd = lineStart;
        
        // Find the end of this line
        for (let i = 0; i < lineWords.length && wordIndex < words.length; i++) {
          lineEnd = words[wordIndex]?.end ?? lineEnd;
          wordIndex++;
        }
        
        result.push({
          text: line,
          startTime: lineStart,
          endTime: lineEnd,
        });
      }
      
      return result;
    }
    
    // Fallback: distribute lines evenly across duration
    const lineInterval = duration / lines.length;
    return lines.map((text, i) => ({
      text,
      startTime: i * lineInterval,
      endTime: (i + 1) * lineInterval,
    }));
  }, [lyrics, timestampedLyrics, duration]);
  
  // Find current line
  const currentLine = useMemo(() => {
    if (lyricsLines.length === 0) return null;
    
    // Find the line that contains current time
    const line = lyricsLines.find(
      l => currentTime >= l.startTime && currentTime <= l.endTime
    );
    
    // If no exact match, find the closest upcoming line
    if (!line) {
      const upcoming = lyricsLines.find(l => l.startTime > currentTime);
      if (upcoming && upcoming.startTime - currentTime < 2) {
        return upcoming;
      }
      // Or the last line if we're past everything
      if (currentTime > 0 && lyricsLines.length > 0) {
        const last = lyricsLines[lyricsLines.length - 1];
        if (currentTime <= last.endTime + 2) {
          return last;
        }
      }
    }
    
    return line;
  }, [lyricsLines, currentTime]);
  
  // Get next line for preview
  const nextLine = useMemo(() => {
    if (!currentLine || lyricsLines.length === 0) return null;
    const currentIndex = lyricsLines.findIndex(l => l === currentLine);
    if (currentIndex >= 0 && currentIndex < lyricsLines.length - 1) {
      return lyricsLines[currentIndex + 1];
    }
    return null;
  }, [lyricsLines, currentLine]);
  
  if (!lyrics || lyricsLines.length === 0) {
    return null;
  }
  
  return (
    <div className={cn(
      "flex items-center gap-2 py-2 px-3 bg-muted/30 rounded-lg border border-border/30",
      className
    )}>
      <Music2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentLine ? (
            <motion.div
              key={currentLine.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-0.5"
            >
              <p className="text-xs font-medium text-foreground truncate">
                {currentLine.text}
              </p>
              {nextLine && (
                <p className="text-[10px] text-muted-foreground/60 truncate">
                  {nextLine.text}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground italic"
            >
              ♪ Ожидание...
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

LyricsSyncDisplay.displayName = 'LyricsSyncDisplay';
