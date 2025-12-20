/**
 * Debounced Stem Controls Hook
 * 
 * Provides debounced versions of stem control functions
 * to prevent excessive re-renders during rapid changes (e.g., volume sliders)
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

// Debounce utility function
function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// Throttle utility function for seek operations
function throttle<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else {
      // Schedule trailing call
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
        timeoutId = null;
      }, delay - timeSinceLastCall);
    }
  };
}

interface UseDebouncedStemControlsProps {
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  volumeDebounceMs?: number;
  seekThrottleMs?: number;
}

export function useDebouncedStemControls({
  onStemVolumeChange,
  onMasterVolumeChange,
  onSeek,
  volumeDebounceMs = 50, // Fast enough for responsive feel, slow enough to batch
  seekThrottleMs = 16, // ~60fps for smooth seeking
}: UseDebouncedStemControlsProps) {
  // Keep refs to latest callbacks to avoid recreating debounced functions
  const stemVolumeChangeRef = useRef(onStemVolumeChange);
  const masterVolumeChangeRef = useRef(onMasterVolumeChange);
  const seekRef = useRef(onSeek);

  useEffect(() => {
    stemVolumeChangeRef.current = onStemVolumeChange;
  }, [onStemVolumeChange]);

  useEffect(() => {
    masterVolumeChangeRef.current = onMasterVolumeChange;
  }, [onMasterVolumeChange]);

  useEffect(() => {
    seekRef.current = onSeek;
  }, [onSeek]);

  // Debounced stem volume change
  const debouncedStemVolumeChange = useMemo(
    () =>
      debounce((stemId: string, volume: number) => {
        stemVolumeChangeRef.current(stemId, volume);
      }, volumeDebounceMs),
    [volumeDebounceMs]
  );

  // Debounced master volume change
  const debouncedMasterVolumeChange = useMemo(
    () =>
      debounce((volume: number) => {
        masterVolumeChangeRef.current(volume);
      }, volumeDebounceMs),
    [volumeDebounceMs]
  );

  // Throttled seek for smooth scrubbing
  const throttledSeek = useMemo(
    () =>
      throttle((time: number) => {
        seekRef.current(time);
      }, seekThrottleMs),
    [seekThrottleMs]
  );

  // Wrapper that applies debouncing but also immediately updates local state
  const handleStemVolumeChange = useCallback(
    (stemId: string, volume: number) => {
      // Immediately update for responsive UI
      stemVolumeChangeRef.current(stemId, volume);
    },
    []
  );

  const handleMasterVolumeChange = useCallback(
    (volume: number) => {
      // Immediately update for responsive UI
      masterVolumeChangeRef.current(volume);
    },
    []
  );

  const handleSeek = useCallback(
    (time: number) => {
      throttledSeek(time);
    },
    [throttledSeek]
  );

  return {
    // Immediate handlers (for UI responsiveness)
    handleStemVolumeChange,
    handleMasterVolumeChange,
    handleSeek,
    // Debounced handlers (for expensive operations)
    debouncedStemVolumeChange,
    debouncedMasterVolumeChange,
    throttledSeek,
  };
}
