/**
 * Unified Lyrics Synchronization Hook
 * 
 * Provides high-frequency time tracking with look-ahead for precise
 * word and line highlighting. Uses requestAnimationFrame for 60fps updates.
 * 
 * Key features:
 * - Look-ahead compensation for rendering delay (~50ms for words, ~100ms for lines)
 * - High-frequency updates during playback (RAF-based ~60fps)
 * - Time interpolation between frames for smooth highlighting
 * - Unified tolerance constants across all lyrics components
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { isStructuralTag, filterStructuralTagWords } from '@/lib/lyricsUtils';

// Re-export for convenience
export { isStructuralTag } from '@/lib/lyricsUtils';

// Synchronization constants
export const SYNC_CONSTANTS = {
  // Look-ahead times to compensate for rendering delay
  WORD_LOOK_AHEAD_MS: 50,      // Words highlighted 50ms early
  LINE_LOOK_AHEAD_MS: 100,    // Lines highlighted 100ms early
  
  // End tolerances - how long to keep highlighting after end time
  WORD_END_TOLERANCE_MS: 80,   // Keep word highlighted 80ms after end
  LINE_END_TOLERANCE_MS: 150,  // Keep line highlighted 150ms after end
  
  // Update intervals
  UPDATE_INTERVAL_PLAYING: 16,  // ~60fps when playing
  UPDATE_INTERVAL_PAUSED: 100,  // Slower updates when paused
  
  // Scroll behavior
  SCROLL_DEBOUNCE_MS: 150,      // Debounce scroll updates
  USER_SCROLL_TIMEOUT_MS: 4000, // Resume auto-scroll after 4s
} as const;

export interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
  success?: boolean;
  palign?: number;
}

export interface LyricLine {
  words: AlignedWord[];
  startTime: number;
  endTime: number;
  text: string;
  index: number;
}

interface SyncState {
  currentTime: number;
  adjustedTime: number;        // Time with look-ahead applied
  activeWordIndex: number;
  activeLineIndex: number;
  isPlaying: boolean;
}

interface UseLyricsSynchronizationOptions {
  words?: AlignedWord[];
  lines?: LyricLine[];
  enabled?: boolean;
  onActiveLineChange?: (lineIndex: number) => void;
  onActiveWordChange?: (wordIndex: number) => void;
}

/**
 * Find active word index using binary search with look-ahead
 */
function findActiveWordIndex(
  words: AlignedWord[], 
  time: number, 
  lookAheadMs: number,
  endToleranceMs: number
): number {
  if (!words.length) return -1;
  
  const adjustedTime = time + lookAheadMs / 1000;
  const endTolerance = endToleranceMs / 1000;
  
  // Binary search for efficiency
  let left = 0;
  let right = words.length - 1;
  let result = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const word = words[mid];
    
    if (adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance) {
      result = mid;
      break;
    } else if (adjustedTime < word.startS) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  // Fallback: linear search for edge cases
  if (result === -1) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance) {
        return i;
      }
    }
  }
  
  return result;
}

/**
 * Find active line index with look-ahead
 */
function findActiveLineIndex(
  lines: LyricLine[], 
  time: number,
  lookAheadMs: number,
  endToleranceMs: number
): number {
  if (!lines.length) return -1;
  
  const adjustedTime = time + lookAheadMs / 1000;
  const endTolerance = endToleranceMs / 1000;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (adjustedTime >= line.startTime && adjustedTime <= line.endTime + endTolerance) {
      return i;
    }
  }
  
  return -1;
}

/**
 * Group words into lines based on newlines or time gaps
 * Filters out structural tags like [Verse], [Chorus], [Куплет], etc.
 */
export function groupWordsIntoLines(words: AlignedWord[]): LyricLine[] {
  if (!words?.length) return [];
  
  // Filter out structural tags first
  const filteredWords = filterStructuralTagWords(words);
  
  const lines: LyricLine[] = [];
  let currentLineWords: AlignedWord[] = [];
  let lineIndex = 0;
  
  for (let i = 0; i < filteredWords.length; i++) {
    const word = filteredWords[i];
    
    // Skip empty words or structural tags that slipped through
    const cleanWord = word.word.replace(/\n/g, '').trim();
    if (!cleanWord || isStructuralTag(cleanWord)) continue;
    
    currentLineWords.push(word);
    
    const nextWord = filteredWords[i + 1];
    const hasNewline = word.word.includes('\n');
    const hasTimeGap = nextWord ? nextWord.startS - word.endS > 0.5 : true;
    const isLongLine = currentLineWords.length >= 8;
    const endsWithPunctuation = /[.!?;]$/.test(cleanWord);
    
    if (hasNewline || hasTimeGap || isLongLine || endsWithPunctuation || !nextWord) {
      if (currentLineWords.length > 0) {
        const lineText = currentLineWords
          .map(w => w.word.replace(/\n/g, '').trim())
          .filter(t => t && !isStructuralTag(t))
          .join(' ');
          
        if (lineText) {
          lines.push({
            words: [...currentLineWords],
            startTime: currentLineWords[0].startS,
            endTime: currentLineWords[currentLineWords.length - 1].endS,
            text: lineText,
            index: lineIndex++,
          });
        }
      }
      currentLineWords = [];
    }
  }
  
  return lines;
}

/**
 * Main synchronization hook
 */
export function useLyricsSynchronization({
  words = [],
  lines: providedLines,
  enabled = true,
  onActiveLineChange,
  onActiveWordChange,
}: UseLyricsSynchronizationOptions = {}) {
  const { isPlaying } = usePlayerStore();
  const [syncState, setSyncState] = useState<SyncState>({
    currentTime: 0,
    adjustedTime: 0,
    activeWordIndex: -1,
    activeLineIndex: -1,
    isPlaying: false,
  });
  
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const prevActiveLineRef = useRef<number>(-1);
  const prevActiveWordRef = useRef<number>(-1);
  
  // Memoize lines - use provided or generate from words
  const lines = useMemo(() => {
    return providedLines || groupWordsIntoLines(words);
  }, [providedLines, words]);
  
  // Flatten all words if we have lines
  const allWords = useMemo(() => {
    if (words.length) return words;
    return lines.flatMap(line => line.words);
  }, [words, lines]);
  
  // High-frequency update loop
  const updateSync = useCallback(() => {
    const audio = getGlobalAudioRef();
    if (!audio || !enabled) return;
    
    const now = performance.now();
    const interval = isPlaying 
      ? SYNC_CONSTANTS.UPDATE_INTERVAL_PLAYING 
      : SYNC_CONSTANTS.UPDATE_INTERVAL_PAUSED;
    
    // Throttle updates based on playing state
    if (now - lastUpdateRef.current < interval) {
      if (isPlaying) {
        rafRef.current = requestAnimationFrame(updateSync);
      }
      return;
    }
    
    lastUpdateRef.current = now;
    const currentTime = audio.currentTime;
    
    // Calculate adjusted time with look-ahead for word matching
    const adjustedTime = currentTime + SYNC_CONSTANTS.WORD_LOOK_AHEAD_MS / 1000;
    
    // Find active indices
    const activeWordIndex = findActiveWordIndex(
      allWords,
      currentTime,
      SYNC_CONSTANTS.WORD_LOOK_AHEAD_MS,
      SYNC_CONSTANTS.WORD_END_TOLERANCE_MS
    );
    
    const activeLineIndex = findActiveLineIndex(
      lines,
      currentTime,
      SYNC_CONSTANTS.LINE_LOOK_AHEAD_MS,
      SYNC_CONSTANTS.LINE_END_TOLERANCE_MS
    );
    
    // Trigger callbacks on change
    if (activeLineIndex !== prevActiveLineRef.current) {
      prevActiveLineRef.current = activeLineIndex;
      onActiveLineChange?.(activeLineIndex);
    }
    
    if (activeWordIndex !== prevActiveWordRef.current) {
      prevActiveWordRef.current = activeWordIndex;
      onActiveWordChange?.(activeWordIndex);
    }
    
    setSyncState({
      currentTime,
      adjustedTime,
      activeWordIndex,
      activeLineIndex,
      isPlaying,
    });
    
    // Continue loop if playing
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateSync);
    }
  }, [enabled, isPlaying, allWords, lines, onActiveLineChange, onActiveWordChange]);
  
  // Start/stop update loop based on playing state
  useEffect(() => {
    if (!enabled) return;
    
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateSync);
    } else {
      // Do one update when paused to show current position
      updateSync();
    }
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, isPlaying, updateSync]);
  
  // Check if a specific word is active
  const isWordActive = useCallback((wordIndex: number): boolean => {
    return syncState.activeWordIndex === wordIndex;
  }, [syncState.activeWordIndex]);
  
  // Check if a specific line is active
  const isLineActive = useCallback((lineIndex: number): boolean => {
    return syncState.activeLineIndex === lineIndex;
  }, [syncState.activeLineIndex]);
  
  // Check if word/line is past (already played)
  const isWordPast = useCallback((word: AlignedWord): boolean => {
    return syncState.currentTime > word.endS + SYNC_CONSTANTS.WORD_END_TOLERANCE_MS / 1000;
  }, [syncState.currentTime]);
  
  const isLinePast = useCallback((line: LyricLine): boolean => {
    return syncState.currentTime > line.endTime + SYNC_CONSTANTS.LINE_END_TOLERANCE_MS / 1000;
  }, [syncState.currentTime]);
  
  return {
    ...syncState,
    lines,
    allWords,
    isWordActive,
    isLineActive,
    isWordPast,
    isLinePast,
    constants: SYNC_CONSTANTS,
  };
}

export default useLyricsSynchronization;
