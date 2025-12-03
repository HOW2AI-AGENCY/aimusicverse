/**
 * Global Audio Player Hook
 * 
 * Singleton audio player that syncs with Zustand store.
 * Provides actual audio playback connected to global player state.
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/usePlayerState';

// Global audio element singleton
let globalAudioElement: HTMLAudioElement | null = null;

function getGlobalAudio(): HTMLAudioElement {
  if (!globalAudioElement) {
    globalAudioElement = new Audio();
    globalAudioElement.preload = 'metadata';
  }
  return globalAudioElement;
}

export function useGlobalAudioPlayer() {
  const {
    activeTrack,
    isPlaying,
    repeat,
    pauseTrack,
    nextTrack,
  } = usePlayerStore();

  const lastTrackIdRef = useRef<string | null>(null);

  // Get audio source from track
  const getAudioSource = useCallback(() => {
    if (!activeTrack) return null;
    return activeTrack.streaming_url || activeTrack.local_audio_url || activeTrack.audio_url;
  }, [activeTrack]);

  // Handle track change - load new source
  useEffect(() => {
    const audio = getGlobalAudio();
    const source = getAudioSource();

    if (!source) {
      audio.src = '';
      return;
    }

    // Only reload if track changed
    if (activeTrack?.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = activeTrack?.id || null;
      audio.src = source;
      audio.load();
    }
  }, [activeTrack?.id, getAudioSource]);

  // Handle play/pause state
  useEffect(() => {
    const audio = getGlobalAudio();
    
    if (isPlaying && audio.src) {
      audio.play().catch((error) => {
        console.error('Playback error:', error);
        pauseTrack();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, pauseTrack]);

  // Handle track ended
  useEffect(() => {
    const audio = getGlobalAudio();

    const handleEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [repeat, nextTrack]);

  // Playback controls
  const seek = useCallback((time: number) => {
    const audio = getGlobalAudio();
    if (audio.src) {
      audio.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = getGlobalAudio();
    audio.volume = Math.max(0, Math.min(1, volume));
  }, []);

  // Get current playback state
  const getCurrentTime = useCallback(() => {
    return getGlobalAudio().currentTime;
  }, []);

  const getDuration = useCallback(() => {
    return getGlobalAudio().duration || 0;
  }, []);

  const getBuffered = useCallback(() => {
    const audio = getGlobalAudio();
    if (audio.buffered.length > 0 && audio.duration) {
      return (audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100;
    }
    return 0;
  }, []);

  return {
    seek,
    setVolume,
    getCurrentTime,
    getDuration,
    getBuffered,
    audioElement: getGlobalAudio(),
  };
}
