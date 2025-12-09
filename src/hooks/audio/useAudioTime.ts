/**
 * Audio Time Hook
 * 
 * Subscribes to current audio time updates from global audio element.
 * Optimized to avoid unnecessary re-renders.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio';

// Singleton reference to global audio
let globalAudio: HTMLAudioElement | null = null;

export function setGlobalAudioRef(audio: HTMLAudioElement) {
  globalAudio = audio;
}

export function getGlobalAudioRef(): HTMLAudioElement | null {
  return globalAudio;
}

export function useAudioTime() {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const { isPlaying, activeTrack } = usePlayerStore();

  useEffect(() => {
    // Capture audio reference at effect setup to ensure cleanup uses same reference.
    // globalAudio is set once by GlobalAudioProvider and never changes, but capturing
    // it here follows React best practices for stable effect cleanup.
    const audio = globalAudio;
    
    if (!audio) {
      // Reset state if audio not available
      setCurrentTime(0);
      setDuration(0);
      setBuffered(0);
      return;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0 && audio.duration) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered((bufferedEnd / audio.duration) * 100);
      }
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('progress', handleProgress);

    // Get initial values
    if (audio.duration) {
      setDuration(audio.duration);
    }
    setCurrentTime(audio.currentTime);

    return () => {
      // Cleanup uses captured reference
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [activeTrack?.id]);

  const seek = useCallback((time: number) => {
    if (globalAudio) {
      globalAudio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (globalAudio) {
      globalAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return { currentTime, duration, buffered, seek, setVolume, isPlaying };
}
