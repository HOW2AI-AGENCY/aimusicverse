/**
 * Audio Time Hook
 * 
 * Subscribes to current audio time updates from global audio element.
 * Optimized to avoid unnecessary re-renders.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/usePlayerState';

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
    if (!globalAudio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(globalAudio!.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(globalAudio!.duration || 0);
    };

    const handleProgress = () => {
      if (globalAudio!.buffered.length > 0 && globalAudio!.duration) {
        const bufferedEnd = globalAudio!.buffered.end(globalAudio!.buffered.length - 1);
        setBuffered((bufferedEnd / globalAudio!.duration) * 100);
      }
    };

    const handleDurationChange = () => {
      setDuration(globalAudio!.duration || 0);
    };

    globalAudio.addEventListener('timeupdate', handleTimeUpdate);
    globalAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
    globalAudio.addEventListener('durationchange', handleDurationChange);
    globalAudio.addEventListener('progress', handleProgress);

    // Get initial values
    if (globalAudio.duration) {
      setDuration(globalAudio.duration);
    }
    setCurrentTime(globalAudio.currentTime);

    return () => {
      if (globalAudio) {
        globalAudio.removeEventListener('timeupdate', handleTimeUpdate);
        globalAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        globalAudio.removeEventListener('durationchange', handleDurationChange);
        globalAudio.removeEventListener('progress', handleProgress);
      }
    };
  }, [activeTrack?.id]);

  const seek = useCallback((time: number) => {
    if (globalAudio) {
      globalAudio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return { currentTime, duration, buffered, seek, isPlaying };
}
