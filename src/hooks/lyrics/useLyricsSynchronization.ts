/**
 * Unified Lyrics Synchronization Hook - Enhanced Precision Version
 * 
 * Provides high-frequency time tracking with advanced look-ahead for precise
 * word and line highlighting. Uses requestAnimationFrame for 60fps updates.
 * 
 * Key features:
 * - Sub-frame precision timing with jitter smoothing
 * - Adaptive look-ahead based on word position in phrase
 * - Phoneme-aware highlighting for better timing
 * - Velocity compensation for smoother playback feel
 * - Unified tolerance constants across all lyrics components
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { isStructuralTag, filterStructuralTagWords } from '@/lib/lyricsUtils';
import { 
  enhanceWordsForSync, 
  groupIntoEnhancedLines,
  findActiveWordPrecision,
  findActiveLinePrecision,
  TimeSmootherAdvanced,
  type EnhancedWord,
  type EnhancedLine
} from '@/lib/lyrics/precisionSync';

// Re-export for convenience
export { isStructuralTag } from '@/lib/lyricsUtils';

// Synchronization constants - enhanced for precision
export const SYNC_CONSTANTS = {
  // Base look-ahead times (will be adjusted dynamically)
  WORD_LOOK_AHEAD_MS: 80,      // Words highlighted 80ms early (was 50ms)
  LINE_LOOK_AHEAD_MS: 120,     // Lines highlighted 120ms early (was 100ms)
  
  // End tolerances - how long to keep highlighting after end time
  WORD_END_TOLERANCE_MS: 100,   // Keep word highlighted 100ms after end (was 80ms)
  LINE_END_TOLERANCE_MS: 180,   // Keep line highlighted 180ms after end (was 150ms)
  
  // Update intervals
  UPDATE_INTERVAL_PLAYING: 16,  // ~60fps when playing
  UPDATE_INTERVAL_PAUSED: 100,  // Slower updates when paused
  
  // Scroll behavior
  SCROLL_DEBOUNCE_MS: 150,      // Debounce scroll updates
  USER_SCROLL_TIMEOUT_MS: 4000, // Resume auto-scroll after 4s
  
  // Precision timing
  JITTER_SMOOTHING_FACTOR: 0.15, // How much to smooth time jitter
  MIN_WORD_DURATION_MS: 100,     // Minimum displayable word duration
  PHRASE_START_BOOST_MS: 30,     // Extra look-ahead for phrase starts
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
  smoothedTime: number;        // Jitter-smoothed time
  activeWordIndex: number;
  activeLineIndex: number;
  isPlaying: boolean;
  confidence: number;          // Match confidence 0-1
}

interface UseLyricsSynchronizationOptions {
  words?: AlignedWord[];
  lines?: LyricLine[];
  enabled?: boolean;
  usePrecisionMode?: boolean;  // Use enhanced precision algorithms
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
  
  // Fallback: linear search for edge cases (gaps between words)
  if (result === -1) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance) {
        return i;
      }
      // Check if we're in a gap before the next word
      if (i < words.length - 1) {
        const nextWord = words[i + 1];
        if (adjustedTime > word.endS && adjustedTime < nextWord.startS) {
          // In gap - show the previous word if gap is small
          const gapSize = nextWord.startS - word.endS;
          if (gapSize < 0.3) {
            return i; // Keep showing previous word
          }
        }
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
    // Handle gaps between lines
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1];
      if (adjustedTime > line.endTime && adjustedTime < nextLine.startTime) {
        const gapSize = nextLine.startTime - line.endTime;
        // If gap is small or we're closer to current line, keep it active
        if (gapSize < 0.5 || (adjustedTime - line.endTime) < (nextLine.startTime - adjustedTime)) {
          return i;
        }
      }
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
    const endsWithPunctuation = /[.!?;,]$/.test(cleanWord);
    
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
 * Main synchronization hook - Enhanced Precision Version
 */
export function useLyricsSynchronization({
  words = [],
  lines: providedLines,
  enabled = true,
  usePrecisionMode = true,
  onActiveLineChange,
  onActiveWordChange,
}: UseLyricsSynchronizationOptions = {}) {
  const { isPlaying } = usePlayerStore();
  const [syncState, setSyncState] = useState<SyncState>({
    currentTime: 0,
    adjustedTime: 0,
    smoothedTime: 0,
    activeWordIndex: -1,
    activeLineIndex: -1,
    isPlaying: false,
    confidence: 1,
  });
  
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const prevActiveLineRef = useRef<number>(-1);
  const prevActiveWordRef = useRef<number>(-1);
  const timeSmootherRef = useRef(new TimeSmootherAdvanced());
  
  // Memoize lines - use provided or generate from words
  const lines = useMemo(() => {
    return providedLines || groupWordsIntoLines(words);
  }, [providedLines, words]);
  
  // Flatten all words if we have lines
  const allWords = useMemo(() => {
    if (words.length) return words;
    return lines.flatMap(line => line.words);
  }, [words, lines]);
  
  // Enhanced words for precision mode
  const enhancedWords = useMemo(() => {
    if (!usePrecisionMode || !allWords.length) return null;
    return enhanceWordsForSync(allWords);
  }, [usePrecisionMode, allWords]);
  
  // Enhanced lines for precision mode
  const enhancedLines = useMemo(() => {
    if (!usePrecisionMode || !enhancedWords) return null;
    return groupIntoEnhancedLines(enhancedWords);
  }, [usePrecisionMode, enhancedWords]);
  
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
    const rawTime = audio.currentTime;
    
    // Smooth time to reduce jitter
    const smoothedTime = timeSmootherRef.current.update(rawTime);
    
    let activeWordIndex: number;
    let activeLineIndex: number;
    let confidence = 1;
    
    if (usePrecisionMode && enhancedWords && enhancedLines) {
      // Use precision algorithms
      const wordResult = findActiveWordPrecision(enhancedWords, smoothedTime);
      activeWordIndex = wordResult.index;
      confidence = wordResult.confidence;
      
      const lineResult = findActiveLinePrecision(enhancedLines, smoothedTime);
      activeLineIndex = lineResult.index;
    } else {
      // Standard algorithm
      activeWordIndex = findActiveWordIndex(
        allWords,
        smoothedTime,
        SYNC_CONSTANTS.WORD_LOOK_AHEAD_MS,
        SYNC_CONSTANTS.WORD_END_TOLERANCE_MS
      );
      
      activeLineIndex = findActiveLineIndex(
        lines,
        smoothedTime,
        SYNC_CONSTANTS.LINE_LOOK_AHEAD_MS,
        SYNC_CONSTANTS.LINE_END_TOLERANCE_MS
      );
    }
    
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
      currentTime: rawTime,
      adjustedTime: smoothedTime + SYNC_CONSTANTS.WORD_LOOK_AHEAD_MS / 1000,
      smoothedTime,
      activeWordIndex,
      activeLineIndex,
      isPlaying,
      confidence,
    });
    
    // Continue loop if playing
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateSync);
    }
  }, [enabled, isPlaying, allWords, lines, enhancedWords, enhancedLines, usePrecisionMode, onActiveLineChange, onActiveWordChange]);
  
  // Reset smoother when playback stops/starts
  useEffect(() => {
    if (!isPlaying) {
      timeSmootherRef.current.reset();
    }
  }, [isPlaying]);
  
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
    return syncState.smoothedTime > word.endS + SYNC_CONSTANTS.WORD_END_TOLERANCE_MS / 1000;
  }, [syncState.smoothedTime]);
  
  const isLinePast = useCallback((line: LyricLine): boolean => {
    return syncState.smoothedTime > line.endTime + SYNC_CONSTANTS.LINE_END_TOLERANCE_MS / 1000;
  }, [syncState.smoothedTime]);
  
  // Get enhanced word data for advanced highlighting
  const getEnhancedWord = useCallback((index: number): EnhancedWord | null => {
    if (!enhancedWords || index < 0 || index >= enhancedWords.length) return null;
    return enhancedWords[index];
  }, [enhancedWords]);
  
  return {
    ...syncState,
    lines,
    allWords,
    enhancedWords,
    enhancedLines,
    isWordActive,
    isLineActive,
    isWordPast,
    isLinePast,
    getEnhancedWord,
    constants: SYNC_CONSTANTS,
  };
}

export default useLyricsSynchronization;
