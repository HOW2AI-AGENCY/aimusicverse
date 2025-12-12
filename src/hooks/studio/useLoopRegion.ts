/**
 * useLoopRegion Hook
 * 
 * Manages loop region state and provides automatic loop functionality
 * for audio playback in the stem studio.
 * 
 * @author MusicVerse AI
 * @task T064 - Add loop region selection
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface LoopRegion {
  /** Loop start time in seconds */
  start: number;
  /** Loop end time in seconds */
  end: number;
  /** Whether loop is enabled */
  enabled: boolean;
}

interface UseLoopRegionOptions {
  /** Total duration of the audio */
  duration: number;
  /** Reference to the audio element */
  audioRef?: React.RefObject<HTMLAudioElement>;
  /** Callback when seeking is needed */
  onSeek?: (time: number) => void;
  /** Initial loop region */
  initialRegion?: Partial<LoopRegion>;
}

interface UseLoopRegionReturn {
  /** Current loop region settings */
  loopRegion: LoopRegion;
  /** Update loop region */
  setLoopRegion: (region: LoopRegion) => void;
  /** Toggle loop on/off */
  toggleLoop: () => void;
  /** Clear loop region */
  clearLoop: () => void;
  /** Set loop start point */
  setLoopStart: (time: number) => void;
  /** Set loop end point */
  setLoopEnd: (time: number) => void;
  /** Check if current time is within loop region */
  isInLoopRegion: (time: number) => boolean;
  /** Handle time update (for auto-looping) */
  handleTimeUpdate: (currentTime: number) => boolean;
}

/**
 * Hook for managing loop region state and auto-loop functionality
 */
export function useLoopRegion({
  duration,
  audioRef,
  onSeek,
  initialRegion,
}: UseLoopRegionOptions): UseLoopRegionReturn {
  // Initialize loop region state
  const [loopRegion, setLoopRegionState] = useState<LoopRegion>({
    start: initialRegion?.start ?? 0,
    end: initialRegion?.end ?? duration,
    enabled: initialRegion?.enabled ?? false,
  });

  // Track if we just looped to prevent infinite loops
  const justLoopedRef = useRef(false);

  /**
   * Update loop region with validation
   */
  const setLoopRegion = useCallback((region: LoopRegion) => {
    setLoopRegionState({
      start: Math.max(0, Math.min(region.start, duration - 0.5)),
      end: Math.max(0.5, Math.min(region.end, duration)),
      enabled: region.enabled,
    });
  }, [duration]);

  /**
   * Toggle loop on/off
   */
  const toggleLoop = useCallback(() => {
    setLoopRegionState(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  }, []);

  /**
   * Clear loop region and disable
   */
  const clearLoop = useCallback(() => {
    setLoopRegionState({
      start: 0,
      end: duration,
      enabled: false,
    });
  }, [duration]);

  /**
   * Set loop start point
   */
  const setLoopStart = useCallback((time: number) => {
    setLoopRegionState(prev => ({
      ...prev,
      start: Math.max(0, Math.min(time, prev.end - 0.5)),
      enabled: true,
    }));
  }, []);

  /**
   * Set loop end point
   */
  const setLoopEnd = useCallback((time: number) => {
    setLoopRegionState(prev => ({
      ...prev,
      end: Math.max(prev.start + 0.5, Math.min(time, duration)),
      enabled: true,
    }));
  }, [duration]);

  /**
   * Check if a time is within the loop region
   */
  const isInLoopRegion = useCallback((time: number): boolean => {
    if (!loopRegion.enabled) return false;
    return time >= loopRegion.start && time <= loopRegion.end;
  }, [loopRegion]);

  /**
   * Handle time updates for auto-looping
   * Returns true if loop was triggered
   */
  const handleTimeUpdate = useCallback((currentTime: number): boolean => {
    if (!loopRegion.enabled) return false;

    // Check if we've passed the loop end point
    if (currentTime >= loopRegion.end && !justLoopedRef.current) {
      justLoopedRef.current = true;
      
      // Seek back to loop start
      if (audioRef?.current) {
        audioRef.current.currentTime = loopRegion.start;
      } else if (onSeek) {
        onSeek(loopRegion.start);
      }

      // Reset the flag after a short delay
      setTimeout(() => {
        justLoopedRef.current = false;
      }, 100);

      return true;
    }

    // Reset flag when we're clearly before the end
    if (currentTime < loopRegion.end - 0.5) {
      justLoopedRef.current = false;
    }

    return false;
  }, [loopRegion, audioRef, onSeek]);

  // Update loop end when duration changes
  useEffect(() => {
    if (duration > 0 && loopRegion.end > duration) {
      setLoopRegionState(prev => ({
        ...prev,
        end: duration,
      }));
    }
  }, [duration, loopRegion.end]);

  // Set up automatic loop handling via audio element timeupdate event
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio || !loopRegion.enabled) return;

    const handleAudioTimeUpdate = () => {
      handleTimeUpdate(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleAudioTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleAudioTimeUpdate);
    };
  }, [audioRef, loopRegion.enabled, handleTimeUpdate]);

  return {
    loopRegion,
    setLoopRegion,
    toggleLoop,
    clearLoop,
    setLoopStart,
    setLoopEnd,
    isInLoopRegion,
    handleTimeUpdate,
  };
}
