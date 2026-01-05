/**
 * Reference Audio Player Hook
 * Manages audio playback for reference audio with coordination with global player
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { pauseAllStudioAudio, registerStudioAudio, unregisterStudioAudio } from '@/hooks/studio/useStudioAudio';

interface ReferenceAudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
}

interface UseReferenceAudioPlayerOptions {
  audioUrl: string | null;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  autoPlay?: boolean;
}

interface UseReferenceAudioPlayerReturn extends ReferenceAudioPlayerState {
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  reset: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const SOURCE_ID = 'reference-audio-player';

export function useReferenceAudioPlayer({
  audioUrl,
  onEnded,
  onTimeUpdate,
  autoPlay = false,
}: UseReferenceAudioPlayerOptions): UseReferenceAudioPlayerReturn {
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Store callbacks in refs to avoid re-creating audio element
  const onEndedRef = useRef(onEnded);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  
  // Update refs when callbacks change
  useEffect(() => {
    onEndedRef.current = onEnded;
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onEnded, onTimeUpdate]);
  
  const [state, setState] = useState<ReferenceAudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: true,
    isBuffering: false,
    error: null,
  });

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) {
      setState(prev => ({ ...prev, isLoading: false, duration: 0 }));
      return;
    }

    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    // Register with studio audio coordinator
    registerStudioAudio(SOURCE_ID, () => {
      audio.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    });

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: audio.duration,
        isLoading: false,
        error: null,
      }));
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setState(prev => ({ ...prev, currentTime: time }));
      onTimeUpdateRef.current?.(time);
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onEndedRef.current?.();
    };

    const handleError = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        error: 'Ошибка загрузки аудио',
      }));
    };

    const handleWaiting = () => {
      setState(prev => ({ ...prev, isBuffering: true }));
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isBuffering: false, isLoading: false }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Load audio
    audio.src = audioUrl;
    audio.load();

    if (autoPlay) {
      audio.play().catch(() => {
        // Autoplay blocked by browser
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      unregisterStudioAudio(SOURCE_ID);
      audioRef.current = null;
    };
  }, [audioUrl, autoPlay]);

  // Pause reference audio when global player starts
  useEffect(() => {
    if (globalIsPlaying && state.isPlaying) {
      audioRef.current?.pause();
    }
  }, [globalIsPlaying, state.isPlaying]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pause global player and other studio audio
    pauseTrack();
    pauseAllStudioAudio(SOURCE_ID);

    try {
      await audio.play();
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Не удалось воспроизвести' }));
    }
  }, [pauseTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(async () => {
    if (state.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = Math.max(0, Math.min(1, volume));
  }, []);

  const reset = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    audio.currentTime = 0;
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
    }));
  }, []);

  return {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    reset,
    audioRef,
  };
}
