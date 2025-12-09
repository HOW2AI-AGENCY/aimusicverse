/**
 * Stem Audio Synchronization Hook
 * 
 * Manages audio synchronization across multiple stems
 * Handles drift detection and correction
 */

import { useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface UseStemAudioSyncProps {
  audioRefs: Record<string, HTMLAudioElement>;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
}

// Optimal drift threshold: 0.1s is noticeable to human ear but prevents constant corrections
// Lower values cause jittery playback, higher values cause audible desync
const DRIFT_THRESHOLD = 0.1; // seconds

// Update rate: 60fps provides smooth visual updates without excessive CPU usage
// Higher rates don't improve perceived smoothness but increase overhead
const ANIMATION_FRAME_INTERVAL = 1000 / 60; // 60fps (~16.67ms)

export function useStemAudioSync({
  audioRefs,
  isPlaying,
  onTimeUpdate,
}: UseStemAudioSyncProps) {
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);

  /**
   * Update time and check for audio drift
   * Only syncs the most drifted audio to avoid glitches
   */
  const updateTime = useCallback(() => {
    const audios = Object.values(audioRefs);
    if (audios.length === 0) return;

    const now = performance.now();
    
    // Throttle updates to ~60fps
    if (now - lastUpdateTimeRef.current < ANIMATION_FRAME_INTERVAL) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
      return;
    }
    
    lastUpdateTimeRef.current = now;
    
    // Use average time from all audios for more accurate sync
    const avgTime = audios.reduce((sum, audio) => sum + audio.currentTime, 0) / audios.length;
    onTimeUpdate(avgTime);
    
    // Check sync drift and re-sync only the most drifted audio
    const audioWithDrift = audios.map(audio => ({
      audio,
      drift: Math.abs(audio.currentTime - avgTime)
    }));
    
    // Find most drifted audio
    const mostDrifted = audioWithDrift.reduce((max, current) => 
      current.drift > max.drift ? current : max
    );
    
    // Only sync if drift exceeds threshold
    if (mostDrifted.drift > DRIFT_THRESHOLD) {
      logger.debug(`Syncing audio with drift: ${mostDrifted.drift.toFixed(3)}s`);
      mostDrifted.audio.currentTime = avgTime;
    }
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [audioRefs, onTimeUpdate]);

  /**
   * Start/stop sync loop based on playback state
   */
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateTime]);

  /**
   * Play all audios simultaneously
   */
  const playAll = useCallback(async (currentTime: number) => {
    const audios = Object.values(audioRefs);
    if (audios.length === 0) return false;

    try {
      // Ensure all audios are at the same position before playing
      audios.forEach(audio => {
        audio.currentTime = currentTime;
        // Reset any previous errors
        if (audio.error) {
          audio.load();
        }
      });

      // Play all audios as close to simultaneously as possible
      await Promise.all(audios.map(audio => audio.play()));
      return true;
    } catch (error) {
      logger.error('Error playing audio', error);
      // Ensure all audios are paused on error
      audios.forEach(audio => audio.pause());
      return false;
    }
  }, [audioRefs]);

  /**
   * Pause all audios
   */
  const pauseAll = useCallback(() => {
    const audios = Object.values(audioRefs);
    audios.forEach(audio => audio.pause());
  }, [audioRefs]);

  /**
   * Seek all audios to specific time
   */
  const seekAll = useCallback((time: number) => {
    const audios = Object.values(audioRefs);
    audios.forEach(audio => {
      audio.currentTime = time;
    });
    onTimeUpdate(time);
  }, [audioRefs, onTimeUpdate]);

  return {
    playAll,
    pauseAll,
    seekAll,
  };
}
