/**
 * useReferenceStemPlayback - Hook for synchronized stem playback
 * 
 * Manages multiple audio elements with mute/solo, volume control, and sync
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export interface Stem {
  id: string;
  type: string;
  url: string;
  label: string;
}

export interface StemState {
  volume: number;
  muted: boolean;
  solo: boolean;
}

interface UseReferenceStemPlaybackReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  stemStates: Record<string, StemState>;
  isLoading: boolean;
  togglePlay: () => void;
  seek: (time: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: (stemId: string) => void;
  toggleSolo: (stemId: string) => void;
  setStemVolume: (stemId: string, volume: number) => void;
  audioRefs: React.MutableRefObject<Map<string, HTMLAudioElement>>;
}

export function useReferenceStemPlayback(stems: Stem[]): UseReferenceStemPlaybackReturn {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const animationRef = useRef<number | undefined>(undefined);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [isLoading, setIsLoading] = useState(stems.length > 0);
  const [stemStates, setStemStates] = useState<Record<string, StemState>>(() => {
    const initial: Record<string, StemState> = {};
    stems.forEach(stem => {
      initial[stem.id] = { volume: 1, muted: false, solo: false };
    });
    return initial;
  });

  // Check if any stem has solo active
  const hasSolo = Object.values(stemStates).some(s => s.solo);

  // Calculate effective volume for a stem
  const getEffectiveVolume = useCallback((stemId: string): number => {
    const state = stemStates[stemId];
    if (!state) return masterVolume;
    if (state.muted) return 0;
    if (hasSolo && !state.solo) return 0;
    return state.volume * masterVolume;
  }, [stemStates, masterVolume, hasSolo]);

  // Initialize audio elements
  useEffect(() => {
    const newAudioRefs = new Map<string, HTMLAudioElement>();
    let loadedCount = 0;
    
    stems.forEach(stem => {
      const audio = new Audio(stem.url);
      audio.preload = 'auto';
      audio.volume = getEffectiveVolume(stem.id);
      
      audio.addEventListener('loadedmetadata', () => {
        loadedCount++;
        if (audio.duration > duration) {
          setDuration(audio.duration);
        }
        if (loadedCount === stems.length) {
          setIsLoading(false);
        }
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`Error loading stem ${stem.type}:`, e);
        loadedCount++;
        if (loadedCount === stems.length) {
          setIsLoading(false);
        }
      });
      
      newAudioRefs.set(stem.id, audio);
    });
    
    audioRefs.current = newAudioRefs;
    
    // Cleanup
    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stems]);

  // Update volumes when state changes
  useEffect(() => {
    audioRefs.current.forEach((audio, stemId) => {
      audio.volume = getEffectiveVolume(stemId);
    });
  }, [getEffectiveVolume]);

  // Animation frame for time updates
  useEffect(() => {
    if (isPlaying) {
      const updateTime = () => {
        const firstAudio = audioRefs.current.values().next().value;
        if (firstAudio) {
          setCurrentTime(firstAudio.currentTime);
        }
        animationRef.current = requestAnimationFrame(updateTime);
      };
      animationRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRefs.current.forEach(audio => audio.pause());
    } else {
      // Sync all audio elements to the same time before playing
      const targetTime = currentTime;
      audioRefs.current.forEach(audio => {
        audio.currentTime = targetTime;
        audio.play().catch(console.error);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTime]);

  const seek = useCallback((time: number) => {
    audioRefs.current.forEach(audio => {
      audio.currentTime = time;
    });
    setCurrentTime(time);
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
  }, []);

  const toggleMute = useCallback((stemId: string) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        muted: !prev[stemId]?.muted,
      },
    }));
  }, []);

  const toggleSolo = useCallback((stemId: string) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        solo: !prev[stemId]?.solo,
      },
    }));
  }, []);

  const setStemVolume = useCallback((stemId: string, volume: number) => {
    setStemStates(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        volume,
      },
    }));
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    stemStates,
    isLoading,
    togglePlay,
    seek,
    setMasterVolume,
    toggleMute,
    toggleSolo,
    setStemVolume,
    audioRefs,
  };
}
