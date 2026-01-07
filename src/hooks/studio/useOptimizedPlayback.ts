/**
 * useOptimizedPlayback - Lightweight playback state management
 * Optimized for minimal re-renders and smooth UI updates
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  playbackRate: number;
}

interface UseOptimizedPlaybackOptions {
  audioRef: React.RefObject<HTMLAudioElement>;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  updateInterval?: number; // ms between time updates during playback
}

interface UseOptimizedPlaybackReturn {
  state: PlaybackState;
  play: () => Promise<boolean>;
  pause: () => void;
  toggle: () => Promise<boolean>;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  isBuffering: boolean;
}

const DEFAULT_STATE: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  playbackRate: 1,
};

export function useOptimizedPlayback({
  audioRef,
  onTimeUpdate,
  onEnded,
  onError,
  updateInterval = 50,
}: UseOptimizedPlaybackOptions): UseOptimizedPlaybackReturn {
  const [state, setState] = useState<PlaybackState>(DEFAULT_STATE);
  const [isBuffering, setIsBuffering] = useState(false);
  
  const rafRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Optimized time update loop
  const startTimeLoop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      const now = performance.now();
      
      // Throttle updates
      if (now - lastUpdateRef.current >= updateInterval) {
        lastUpdateRef.current = now;
        
        const currentTime = audio.currentTime;
        const duration = audio.duration || 0;
        
        // Only update if changed significantly
        if (Math.abs(currentTime - stateRef.current.currentTime) > 0.01) {
          setState(prev => ({
            ...prev,
            currentTime,
            duration: isFinite(duration) ? duration : prev.duration,
          }));
          
          onTimeUpdate?.(currentTime);
        }
      }
      
      if (!audio.paused) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    rafRef.current = requestAnimationFrame(update);
  }, [audioRef, updateInterval, onTimeUpdate]);

  const stopTimeLoop = useCallback(() => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
  }, []);

  // Play
  const play = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      await audio.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      startTimeLoop();
      return true;
    } catch (error) {
      logger.error('Playback failed', error);
      onError?.(error instanceof Error ? error : new Error('Playback failed'));
      return false;
    }
  }, [audioRef, startTimeLoop, onError]);

  // Pause
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    stopTimeLoop();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [audioRef, stopTimeLoop]);

  // Toggle
  const toggle = useCallback(async (): Promise<boolean> => {
    if (stateRef.current.isPlaying) {
      pause();
      return false;
    }
    return play();
  }, [play, pause]);

  // Seek
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedTime = Math.max(0, Math.min(time, audio.duration || 0));
    audio.currentTime = clampedTime;
    
    setState(prev => ({ ...prev, currentTime: clampedTime }));
    onTimeUpdate?.(clampedTime);
  }, [audioRef, onTimeUpdate]);

  // Playback rate
  const setPlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedRate = Math.max(0.25, Math.min(4, rate));
    audio.playbackRate = clampedRate;
    setState(prev => ({ ...prev, playbackRate: clampedRate }));
  }, [audioRef]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration || 0,
      }));
    };

    const handleEnded = () => {
      stopTimeLoop();
      setState(prev => ({ ...prev, isPlaying: false }));
      onEnded?.();
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const buffered = audio.buffered.end(audio.buffered.length - 1);
        setState(prev => ({ ...prev, buffered }));
      }
    };

    const handleError = () => {
      stopTimeLoop();
      setState(prev => ({ ...prev, isPlaying: false }));
      onError?.(new Error(audio.error?.message || 'Audio error'));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('error', handleError);

    return () => {
      stopTimeLoop();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef, stopTimeLoop, onEnded, onError]);

  return {
    state,
    play,
    pause,
    toggle,
    seek,
    setPlaybackRate,
    isBuffering,
  };
}
