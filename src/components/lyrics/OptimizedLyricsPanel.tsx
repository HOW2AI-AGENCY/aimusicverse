/**
 * OptimizedLyricsPanel - Virtualized lyrics display
 * Uses react-virtuoso for efficient rendering of long lyrics
 */

import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { cn } from '@/lib/utils';
import { OptimizedLyricsLine, LyricsLineData } from './OptimizedLyricsLine';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OptimizedLyricsPanelProps {
  lyrics: string;
  currentTime?: number;
  duration?: number;
  timestamps?: Array<{ lineIndex: number; startTime: number; endTime: number }>;
  onLineClick?: (line: LyricsLineData, index: number) => void;
  onSeek?: (time: number) => void;
  showTimestamps?: boolean;
  autoScroll?: boolean;
  className?: string;
  emptyMessage?: string;
}

// Parse lyrics string into structured data
const parseLyrics = (lyrics: string): LyricsLineData[] => {
  if (!lyrics?.trim()) return [];

  const lines = lyrics.split('\n');
  return lines.map((text, index) => {
    const trimmed = text.trim();
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);

    return {
      id: `line-${index}`,
      text: sectionMatch ? '' : trimmed,
      isSection: !!sectionMatch,
      sectionType: sectionMatch?.[1],
    };
  });
};

// Find active line based on current time
const findActiveLine = (
  lines: LyricsLineData[],
  timestamps: OptimizedLyricsPanelProps['timestamps'],
  currentTime: number
): number => {
  if (!timestamps?.length || currentTime <= 0) return -1;

  for (let i = timestamps.length - 1; i >= 0; i--) {
    const ts = timestamps[i];
    if (currentTime >= ts.startTime) {
      return ts.lineIndex;
    }
  }
  return -1;
};

export const OptimizedLyricsPanel = memo(function OptimizedLyricsPanel({
  lyrics,
  currentTime = 0,
  duration = 0,
  timestamps,
  onLineClick,
  onSeek,
  showTimestamps = false,
  autoScroll = true,
  className,
  emptyMessage = 'Нет текста песни',
}: OptimizedLyricsPanelProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const lastActiveLineRef = useRef(-1);

  // Parse lyrics into lines
  const lines = useMemo(() => parseLyrics(lyrics), [lyrics]);

  // Merge timestamps with lines
  const linesWithTimestamps = useMemo(() => {
    if (!timestamps?.length) return lines;

    return lines.map((line, index) => {
      const ts = timestamps.find(t => t.lineIndex === index);
      return ts
        ? { ...line, startTime: ts.startTime, endTime: ts.endTime }
        : line;
    });
  }, [lines, timestamps]);

  // Find active line index
  const activeLineIndex = useMemo(
    () => findActiveLine(lines, timestamps, currentTime),
    [lines, timestamps, currentTime]
  );

  // Auto-scroll to active line
  useEffect(() => {
    if (!autoScroll || activeLineIndex < 0) return;
    if (activeLineIndex === lastActiveLineRef.current) return;

    lastActiveLineRef.current = activeLineIndex;

    virtuosoRef.current?.scrollToIndex({
      index: activeLineIndex,
      align: 'center',
      behavior: 'smooth',
    });
  }, [activeLineIndex, autoScroll]);

  // Handle line click
  const handleLineClick = useCallback(
    (line: LyricsLineData, index: number) => {
      onLineClick?.(line, index);

      // Seek to line start time if available
      if (line.startTime !== undefined && onSeek) {
        onSeek(line.startTime);
      }
    },
    [onLineClick, onSeek]
  );

  // Render individual line
  const renderLine = useCallback(
    (index: number) => {
      const line = linesWithTimestamps[index];
      if (!line) return null;

      const isActive = index === activeLineIndex;
      const isNext = index === activeLineIndex + 1;
      const isPast = activeLineIndex >= 0 && index < activeLineIndex;

      return (
        <OptimizedLyricsLine
          line={line}
          index={index}
          isActive={isActive}
          isNext={isNext}
          isPast={isPast}
          onClick={handleLineClick}
          showTimestamps={showTimestamps}
        />
      );
    },
    [linesWithTimestamps, activeLineIndex, handleLineClick, showTimestamps]
  );

  // Empty state
  if (!lines.length) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full',
          'text-muted-foreground text-sm',
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  // For short lyrics (< 50 lines), use simple ScrollArea
  if (lines.length < 50) {
    return (
      <ScrollArea className={cn('h-full', className)}>
        <div className="py-4 space-y-0.5">
          {linesWithTimestamps.map((line, index) => (
            <OptimizedLyricsLine
              key={line.id}
              line={line}
              index={index}
              isActive={index === activeLineIndex}
              isNext={index === activeLineIndex + 1}
              isPast={activeLineIndex >= 0 && index < activeLineIndex}
              onClick={handleLineClick}
              showTimestamps={showTimestamps}
            />
          ))}
        </div>
      </ScrollArea>
    );
  }

  // For long lyrics, use virtualization
  return (
    <div className={cn('h-full', className)}>
      <Virtuoso
        ref={virtuosoRef}
        totalCount={lines.length}
        itemContent={renderLine}
        overscan={10}
        className="h-full"
        style={{ height: '100%' }}
      />
    </div>
  );
});

export default OptimizedLyricsPanel;
