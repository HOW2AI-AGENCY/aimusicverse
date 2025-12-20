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

// Optimized drift threshold: 0.05s is imperceptible to human ear
// This tighter threshold ensures stems stay perfectly synchronized
const DRIFT_THRESHOLD = 0.05; // seconds - reduced from 0.1s

// Critical drift threshold: requires immediate correction
const CRITICAL_DRIFT = 0.15; // seconds

// Update rate: 60fps provides smooth visual updates without excessive CPU usage
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
   * Uses a master reference time and syncs drifted audios
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
    
    // Filter out audios without valid duration or in error state
    const validAudios = audios.filter(audio => 
      audio.duration > 0 && 
      !audio.error && 
      audio.readyState >= 2 // HAVE_CURRENT_DATA or better
    );
    
    if (validAudios.length === 0) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
      return;
    }
    
    // Use the first valid audio as master reference (more stable than average)
    const masterTime = validAudios[0].currentTime;
    onTimeUpdate(masterTime);
    
    // Check sync drift for all audios and correct as needed
    validAudios.forEach((audio, index) => {
      if (index === 0) return; // Skip master reference
      
      const drift = Math.abs(audio.currentTime - masterTime);
      
      // Critical drift: immediate correction with seek
      if (drift > CRITICAL_DRIFT) {
        logger.debug(`Critical drift detected: ${drift.toFixed(3)}s, forcing sync`);
        audio.currentTime = masterTime;
      } 
      // Normal drift: gentle correction
      else if (drift > DRIFT_THRESHOLD) {
        logger.debug(`Syncing audio with drift: ${drift.toFixed(3)}s`);
        audio.currentTime = masterTime;
      }
    });
    
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
      // Ensure all audios are ready and at the same position before playing
      audios.forEach(audio => {
        // Reset any previous errors by reloading
        if (audio.error) {
          audio.load();
        }
        
        // Only set currentTime if audio is ready
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or better
          audio.currentTime = currentTime;
        }
      });

      // Play all audios as close to simultaneously as possible
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled(
        audios.map(audio => audio.play())
      );
      
      // Check if any play attempts failed
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        logger.warn('Some stems failed to play', { 
          failureCount: failures.length,
          totalCount: audios.length 
        });
        // Continue playing successful ones rather than failing completely
      }
      
      // Return true if at least one audio is playing
      return results.some(r => r.status === 'fulfilled');
    } catch (error) {
      logger.error('Error playing audio', error);
      // Ensure all audios are paused on error
      audios.forEach(audio => {
        try {
          audio.pause();
        } catch (e) {
          // Ignore errors during pause
        }
      });
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
