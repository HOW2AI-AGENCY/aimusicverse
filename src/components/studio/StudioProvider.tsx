import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useStudioStore, TrackInfo } from '@/stores/useStudioStore';
import { logger } from '@/lib/logger';

/**
 * StudioProvider - Context provider for Studio audio management
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface StudioContextValue {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  skip: (direction: 'back' | 'forward', amount?: number) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return context;
}

interface StudioProviderProps {
  children: ReactNode;
  trackId: string;
  track: TrackInfo;
  hasStems?: boolean;
}

export function StudioProvider({ 
  children, 
  trackId,
  track,
  hasStems = false,
}: StudioProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const {
    setTrack,
    setHasStems,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setIsLoading,
    audio,
    reset,
  } = useStudioStore();

  // Initialize track info
  useEffect(() => {
    setTrack(track);
    setHasStems(hasStems);
    setIsLoading(false);

    return () => {
      reset();
    };
  }, [trackId, track, hasStems, setTrack, setHasStems, setIsLoading, reset]);

  // Initialize audio element
  useEffect(() => {
    if (!track.audioUrl) return;

    const audioElement = new Audio(track.audioUrl);
    audioElement.preload = 'auto';
    audioRef.current = audioElement;

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleError = (e: Event) => {
      logger.error('Audio load error', e);
    };

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);

    return () => {
      audioElement.pause();
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.src = '';
      audioRef.current = null;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [track.audioUrl, setDuration, setIsPlaying, setCurrentTime]);

  // Sync volume/mute
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = audio.muted ? 0 : audio.volume;
  }, [audio.volume, audio.muted]);

  // Time update loop
  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [setCurrentTime]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } catch (error) {
      logger.error('Error playing audio', error);
      throw error;
    }
  }, [setIsPlaying, updateTime]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [setIsPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, [setCurrentTime]);

  const skip = useCallback((direction: 'back' | 'forward', amount = 10) => {
    if (!audioRef.current) return;
    
    const newTime = direction === 'back'
      ? Math.max(0, audioRef.current.currentTime - amount)
      : Math.min(audioRef.current.duration, audioRef.current.currentTime + amount);
    
    seek(newTime);
  }, [seek]);

  const contextValue: StudioContextValue = {
    audioRef,
    play,
    pause,
    seek,
    skip,
  };

  return (
    <StudioContext.Provider value={contextValue}>
      {children}
    </StudioContext.Provider>
  );
}
