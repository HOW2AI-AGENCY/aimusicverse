/**
 * useStudioAudio - Centralized audio coordination for Studio
 * 
 * Ensures only one audio source plays at a time by providing
 * a pauseAll function that stops main player, compare audios, and section previews.
 */

import { useCallback, useRef } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';

interface AudioSource {
  id: string;
  pause: () => void;
}

// Global registry of active audio sources in studio
const studioAudioSources = new Map<string, AudioSource>();

export function registerStudioAudio(id: string, pauseFn: () => void) {
  studioAudioSources.set(id, { id, pause: pauseFn });
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
}

export function useStudioAudio(sourceId: string) {
  const { pauseTrack } = usePlayerStore();
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  // Register this audio source
  const registerAudio = useCallback((audioElement: HTMLAudioElement | null) => {
    localAudioRef.current = audioElement;
    if (audioElement) {
      registerStudioAudio(sourceId, () => {
        audioElement.pause();
      });
    }
  }, [sourceId]);

  // Unregister on cleanup
  const unregisterAudio = useCallback(() => {
    unregisterStudioAudio(sourceId);
    localAudioRef.current = null;
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
      return true;
    } catch (error) {
      console.error('Playback failed:', error);
      return false;
    }
  }, [pauseAllAudio]);

  return {
    registerAudio,
    unregisterAudio,
    pauseAllAudio,
    playWithCoordination,
    localAudioRef,
  };
}
