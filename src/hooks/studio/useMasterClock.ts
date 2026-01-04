/**
 * Master Clock Hook for Audio Synchronization
 * 
 * Uses AudioContext.currentTime as the authoritative timing source
 * for all audio stems, ensuring perfect synchronization.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

// Shared AudioContext singleton for timing
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

interface UseMasterClockProps {
  audioRefs: Record<string, HTMLAudioElement>;
  onTimeUpdate: (time: number) => void;
}

interface MasterClockState {
  isPlaying: boolean;
  startTime: number; // AudioContext time when playback started
  pauseOffset: number; // Position in track when paused
}

export function useMasterClock({ audioRefs, onTimeUpdate }: UseMasterClockProps) {
  const animationFrameRef = useRef<number | undefined>(undefined);
  const clockStateRef = useRef<MasterClockState>({
    isPlaying: false,
    startTime: 0,
    pauseOffset: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Drift correction thresholds
  const DRIFT_THRESHOLD = 0.03; // 30ms - very tight for precise sync
  const CRITICAL_DRIFT = 0.1; // 100ms - requires immediate correction

  /**
   * Get current master time based on AudioContext
   */
  const getMasterTime = useCallback((): number => {
    const state = clockStateRef.current;
    if (!state.isPlaying) {
      return state.pauseOffset;
    }
    
    const ctx = getAudioContext();
    return state.pauseOffset + (ctx.currentTime - state.startTime);
  }, []);

  /**
   * Sync all audio elements to master time
   */
  const syncToMasterTime = useCallback(() => {
    const audios = Object.values(audioRefs);
    if (audios.length === 0) return;

    const masterTime = getMasterTime();
    onTimeUpdate(masterTime);

    // Only sync if playing
    if (!clockStateRef.current.isPlaying) return;

    audios.forEach((audio) => {
      if (audio.duration <= 0 || audio.error || audio.readyState < 2) return;

      const drift = Math.abs(audio.currentTime - masterTime);
      
      if (drift > CRITICAL_DRIFT) {
        logger.debug(`Critical drift: ${drift.toFixed(3)}s, forcing sync`);
        audio.currentTime = masterTime;
      } else if (drift > DRIFT_THRESHOLD) {
        // Gentle correction for minor drift
        audio.currentTime = masterTime;
      }
    });

    animationFrameRef.current = requestAnimationFrame(syncToMasterTime);
  }, [audioRefs, getMasterTime, onTimeUpdate]);

  /**
   * Start playback from current position
   */
  const play = useCallback(async (fromTime?: number) => {
    const ctx = getAudioContext();
    
    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const startPosition = fromTime ?? clockStateRef.current.pauseOffset;
    
    // Set all audios to the start position
    const audios = Object.values(audioRefs);
    audios.forEach((audio) => {
      if (audio.readyState >= 2) {
        audio.currentTime = startPosition;
      }
    });

    // Record start time
    clockStateRef.current = {
      isPlaying: true,
      startTime: ctx.currentTime,
      pauseOffset: startPosition,
    };

    // Start all audios simultaneously
    const playPromises = audios.map((audio) => audio.play().catch(() => {}));
    await Promise.allSettled(playPromises);

    setIsPlaying(true);
    
    // Start sync loop
    animationFrameRef.current = requestAnimationFrame(syncToMasterTime);
    
    return true;
  }, [audioRefs, syncToMasterTime]);

  /**
   * Pause all playback
   */
  const pause = useCallback(() => {
    // Record current position before pausing
    clockStateRef.current = {
      isPlaying: false,
      startTime: 0,
      pauseOffset: getMasterTime(),
    };

    // Pause all audios
    Object.values(audioRefs).forEach((audio) => audio.pause());

    // Stop sync loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    setIsPlaying(false);
  }, [audioRefs, getMasterTime]);

  /**
   * Seek to specific time
   */
  const seek = useCallback((time: number) => {
    const wasPlaying = clockStateRef.current.isPlaying;
    
    // Update clock state
    const ctx = getAudioContext();
    clockStateRef.current = {
      isPlaying: wasPlaying,
      startTime: wasPlaying ? ctx.currentTime : 0,
      pauseOffset: time,
    };

    // Seek all audios
    Object.values(audioRefs).forEach((audio) => {
      if (audio.readyState >= 2) {
        audio.currentTime = time;
      }
    });

    onTimeUpdate(time);
  }, [audioRefs, onTimeUpdate]);

  /**
   * Toggle play/pause
   */
  const toggle = useCallback(async () => {
    if (clockStateRef.current.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [play, pause]);

  /**
   * Get current playback time
   */
  const getCurrentTime = useCallback((): number => {
    return getMasterTime();
  }, [getMasterTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    play,
    pause,
    seek,
    toggle,
    getCurrentTime,
    getMasterTime,
  };
}
