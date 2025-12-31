/**
 * useStudioAudio - Centralized audio coordination for Studio
 * 
 * Ensures only one audio source plays at a time by providing
 * a pauseAll function that stops main player, compare audios, and section previews.
 * 
 * Architecture:
 * - Global registry of audio sources (Map for O(1) operations)
 * - Each source registers a pause callback
 * - pauseAllStudioAudio stops all except the specified source
 * - Integration with global player via usePlayerStore
 */

import { useCallback, useRef, useEffect } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';

interface AudioSource {
  id: string;
  pause: () => void;
  isPlaying?: () => boolean;
}

// Global registry of active audio sources in studio
const studioAudioSources = new Map<string, AudioSource>();

// Event emitter for audio state changes
type AudioEventCallback = (sourceId: string, isPlaying: boolean) => void;
const audioEventListeners = new Set<AudioEventCallback>();

export function onAudioStateChange(callback: AudioEventCallback) {
  audioEventListeners.add(callback);
  return () => audioEventListeners.delete(callback);
}

function emitAudioStateChange(sourceId: string, isPlaying: boolean) {
  audioEventListeners.forEach(cb => cb(sourceId, isPlaying));
}

export function registerStudioAudio(
  id: string, 
  pauseFn: () => void,
  isPlayingFn?: () => boolean
) {
  studioAudioSources.set(id, { id, pause: pauseFn, isPlaying: isPlayingFn });
}

export function unregisterStudioAudio(id: string) {
  studioAudioSources.delete(id);
}

export function pauseAllStudioAudio(exceptId?: string) {
  studioAudioSources.forEach((source) => {
    if (source.id !== exceptId) {
      source.pause();
    }
  });
  if (exceptId) {
    emitAudioStateChange(exceptId, true);
  }
}

export function getActiveAudioSource(): string | null {
  for (const [id, source] of studioAudioSources) {
    if (source.isPlaying?.()) {
      return id;
    }
  }
  return null;
}

export function useStudioAudio(sourceId: string) {
  const { pauseTrack } = usePlayerStore();
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterStudioAudio(sourceId);
    };
  }, [sourceId]);

  // Register this audio source with playing state tracker
  const registerAudio = useCallback((audioElement: HTMLAudioElement | null) => {
    localAudioRef.current = audioElement;
    if (audioElement) {
      registerStudioAudio(
        sourceId, 
        () => {
          audioElement.pause();
          isPlayingRef.current = false;
        },
        () => isPlayingRef.current
      );

      // Track play/pause events
      const handlePlay = () => { isPlayingRef.current = true; };
      const handlePause = () => { isPlayingRef.current = false; };
      
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      
      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
      };
    }
  }, [sourceId]);

  // Unregister on cleanup
  const unregisterAudio = useCallback(() => {
    unregisterStudioAudio(sourceId);
    localAudioRef.current = null;
    isPlayingRef.current = false;
  }, [sourceId]);

  // Pause all audio sources including global player
  const pauseAllAudio = useCallback((exceptThisSource = false) => {
    // Pause global player
    pauseTrack();
    // Pause all studio sources except this one if specified
    pauseAllStudioAudio(exceptThisSource ? sourceId : undefined);
  }, [pauseTrack, sourceId]);

  // Play audio with automatic coordination
  const playWithCoordination = useCallback(async (audioElement: HTMLAudioElement) => {
    // Pause everything else first
    pauseAllAudio(true);
    
    try {
      await audioElement.play();
      isPlayingRef.current = true;
      emitAudioStateChange(sourceId, true);
      return true;
    } catch (error) {
      console.error('Playback failed:', error);
      isPlayingRef.current = false;
      return false;
    }
  }, [pauseAllAudio, sourceId]);

  // Check if this source is currently playing
  const isPlaying = useCallback(() => isPlayingRef.current, []);

  return {
    registerAudio,
    unregisterAudio,
    pauseAllAudio,
    playWithCoordination,
    localAudioRef,
    isPlaying,
  };
}
