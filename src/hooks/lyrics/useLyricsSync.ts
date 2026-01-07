/**
 * useLyricsSync - Hook for synchronizing lyrics with audio playback
 * Optimized to minimize re-renders while maintaining sync accuracy
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface LyricsTimestamp {
  lineIndex: number;
  startTime: number;
  endTime: number;
}

export interface LyricsSyncState {
  activeLineIndex: number;
  progress: number; // 0-1 progress within current line
  isScrolling: boolean;
}

interface UseLyricsSyncOptions {
  timestamps: LyricsTimestamp[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  scrollThreshold?: number; // Time in ms to debounce scroll updates
  onActiveLineChange?: (lineIndex: number) => void;
}

interface UseLyricsSyncReturn {
  activeLineIndex: number;
  nextLineIndex: number;
  lineProgress: number;
  isAtStart: boolean;
  isAtEnd: boolean;
  seekToLine: (lineIndex: number) => number | null;
  getLineAtTime: (time: number) => number;
}

export function useLyricsSync({
  timestamps,
  currentTime,
  duration,
  isPlaying,
  scrollThreshold = 100,
  onActiveLineChange,
}: UseLyricsSyncOptions): UseLyricsSyncReturn {
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const lastUpdateRef = useRef(0);
  const onActiveLineChangeRef = useRef(onActiveLineChange);
  onActiveLineChangeRef.current = onActiveLineChange;

  // Sort timestamps by start time for binary search
  const sortedTimestamps = useMemo(() => {
    return [...timestamps].sort((a, b) => a.startTime - b.startTime);
  }, [timestamps]);

  // Binary search for active line
  const findActiveLineIndex = useCallback(
    (time: number): number => {
      if (!sortedTimestamps.length || time < 0) return -1;

      let left = 0;
      let right = sortedTimestamps.length - 1;
      let result = -1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const ts = sortedTimestamps[mid];

        if (time >= ts.startTime) {
          result = ts.lineIndex;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      return result;
    },
    [sortedTimestamps]
  );

  // Get line at specific time
  const getLineAtTime = useCallback(
    (time: number): number => {
      return findActiveLineIndex(time);
    },
    [findActiveLineIndex]
  );

  // Seek to specific line
  const seekToLine = useCallback(
    (lineIndex: number): number | null => {
      const ts = sortedTimestamps.find(t => t.lineIndex === lineIndex);
      return ts?.startTime ?? null;
    },
    [sortedTimestamps]
  );

  // Calculate line progress
  const lineProgress = useMemo(() => {
    if (activeLineIndex < 0) return 0;

    const ts = sortedTimestamps.find(t => t.lineIndex === activeLineIndex);
    if (!ts) return 0;

    const lineDuration = ts.endTime - ts.startTime;
    if (lineDuration <= 0) return 0;

    const progress = (currentTime - ts.startTime) / lineDuration;
    return Math.max(0, Math.min(1, progress));
  }, [activeLineIndex, currentTime, sortedTimestamps]);

  // Next line index
  const nextLineIndex = useMemo(() => {
    if (activeLineIndex < 0) {
      return sortedTimestamps[0]?.lineIndex ?? -1;
    }

    const currentTsIndex = sortedTimestamps.findIndex(
      t => t.lineIndex === activeLineIndex
    );
    if (currentTsIndex < 0 || currentTsIndex >= sortedTimestamps.length - 1) {
      return -1;
    }

    return sortedTimestamps[currentTsIndex + 1].lineIndex;
  }, [activeLineIndex, sortedTimestamps]);

  // Update active line with debouncing
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < scrollThreshold && !isPlaying) {
      return;
    }

    const newActiveIndex = findActiveLineIndex(currentTime);
    
    if (newActiveIndex !== activeLineIndex) {
      lastUpdateRef.current = now;
      setActiveLineIndex(newActiveIndex);
      onActiveLineChangeRef.current?.(newActiveIndex);
    }
  }, [currentTime, findActiveLineIndex, activeLineIndex, scrollThreshold, isPlaying]);

  // Position flags
  const isAtStart = currentTime <= 0 || activeLineIndex <= 0;
  const isAtEnd = useMemo(() => {
    if (!sortedTimestamps.length) return false;
    const lastTs = sortedTimestamps[sortedTimestamps.length - 1];
    return currentTime >= lastTs.endTime;
  }, [currentTime, sortedTimestamps]);

  return {
    activeLineIndex,
    nextLineIndex,
    lineProgress,
    isAtStart,
    isAtEnd,
    seekToLine,
    getLineAtTime,
  };
}

export default useLyricsSync;
