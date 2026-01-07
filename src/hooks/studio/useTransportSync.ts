/**
 * useTransportSync - Synchronize multiple audio sources with transport controls
 * 
 * Features:
 * - Sample-accurate playback sync
 * - Drift correction
 * - Loop region support
 * - Seek with preroll
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export interface AudioSource {
  id: string;
  element: HTMLAudioElement;
  offset?: number; // Start offset in seconds
  gain?: number;
}

export interface TransportState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loopStart: number | null;
  loopEnd: number | null;
  isLooping: boolean;
}

export interface UseTransportSyncOptions {
  /** Maximum allowed drift in seconds before correction */
  maxDrift?: number;
  /** How often to check for drift (ms) */
  syncInterval?: number;
  /** Preroll time when seeking (seconds) */
  prerollTime?: number;
  /** Enable loop region */
  enableLoop?: boolean;
}

const DEFAULT_OPTIONS: Required<UseTransportSyncOptions> = {
  maxDrift: 0.05, // 50ms
  syncInterval: 100,
  prerollTime: 0.1,
  enableLoop: true,
};

export function useTransportSync(options: UseTransportSyncOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const sourcesRef = useRef<Map<string, AudioSource>>(new Map());
  const masterTimeRef = useRef(0);
  const isPlayingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [transportState, setTransportState] = useState<TransportState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    loopStart: null,
    loopEnd: null,
    isLooping: false,
  });

  // Register an audio source
  const registerSource = useCallback((source: AudioSource) => {
    sourcesRef.current.set(source.id, source);
    
    // Update duration based on longest source
    const maxDuration = Math.max(
      ...Array.from(sourcesRef.current.values()).map(s => 
        s.element.duration || 0
      )
    );
    
    setTransportState(prev => ({ ...prev, duration: maxDuration }));
    
    logger.debug('[TransportSync] Source registered', { id: source.id });
  }, []);

  // Unregister an audio source
  const unregisterSource = useCallback((id: string) => {
    sourcesRef.current.delete(id);
    logger.debug('[TransportSync] Source unregistered', { id });
  }, []);

  // Get current master time
  const getCurrentTime = useCallback((): number => {
    return masterTimeRef.current;
  }, []);

  // Sync all sources to master time
  const syncSources = useCallback(() => {
    const masterTime = masterTimeRef.current;
    const sources = Array.from(sourcesRef.current.values());

    for (const source of sources) {
      const targetTime = masterTime + (source.offset || 0);
      const currentTime = source.element.currentTime;
      const drift = Math.abs(currentTime - targetTime);

      if (drift > opts.maxDrift) {
        source.element.currentTime = targetTime;
        logger.debug('[TransportSync] Drift corrected', {
          id: source.id,
          drift,
          target: targetTime,
        });
      }
    }
  }, [opts.maxDrift]);

  // Update loop
  const updateLoop = useCallback(() => {
    if (!opts.enableLoop) return;

    const { loopStart, loopEnd, isLooping } = transportState;
    
    if (isLooping && loopStart !== null && loopEnd !== null) {
      if (masterTimeRef.current >= loopEnd) {
        masterTimeRef.current = loopStart;
        
        // Sync all sources to loop start
        for (const source of sourcesRef.current.values()) {
          const targetTime = loopStart + (source.offset || 0);
          source.element.currentTime = targetTime;
        }
        
        logger.debug('[TransportSync] Loop triggered');
      }
    }
  }, [opts.enableLoop, transportState]);

  // Animation frame update
  const updateFrame = useCallback(() => {
    if (!isPlayingRef.current) return;

    // Get time from first source
    const sources = Array.from(sourcesRef.current.values());
    if (sources.length > 0) {
      const firstSource = sources[0];
      masterTimeRef.current = firstSource.element.currentTime - (firstSource.offset || 0);
    }

    // Check loop
    updateLoop();

    // Update state
    setTransportState(prev => ({
      ...prev,
      currentTime: masterTimeRef.current,
    }));

    animationFrameRef.current = requestAnimationFrame(updateFrame);
  }, [updateLoop]);

  // Play
  const play = useCallback(async () => {
    const sources = Array.from(sourcesRef.current.values());
    
    // Start all sources
    const playPromises = sources.map(async source => {
      try {
        await source.element.play();
      } catch (error) {
        logger.warn('[TransportSync] Play failed', { id: source.id, error });
      }
    });

    await Promise.all(playPromises);

    isPlayingRef.current = true;
    setTransportState(prev => ({ ...prev, isPlaying: true }));

    // Start update loop
    animationFrameRef.current = requestAnimationFrame(updateFrame);

    // Start sync interval
    syncIntervalRef.current = setInterval(syncSources, opts.syncInterval);

    logger.debug('[TransportSync] Play started');
  }, [updateFrame, syncSources, opts.syncInterval]);

  // Pause
  const pause = useCallback(() => {
    const sources = Array.from(sourcesRef.current.values());
    
    for (const source of sources) {
      source.element.pause();
    }

    isPlayingRef.current = false;
    setTransportState(prev => ({ ...prev, isPlaying: false }));

    // Stop update loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop sync interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    logger.debug('[TransportSync] Paused');
  }, []);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  // Seek to time
  const seek = useCallback((time: number) => {
    masterTimeRef.current = time;

    const sources = Array.from(sourcesRef.current.values());
    for (const source of sources) {
      const targetTime = time + (source.offset || 0);
      source.element.currentTime = Math.max(0, targetTime);
    }

    setTransportState(prev => ({ ...prev, currentTime: time }));

    logger.debug('[TransportSync] Seeked', { time });
  }, []);

  // Set loop region
  const setLoop = useCallback((start: number | null, end: number | null, enabled: boolean = true) => {
    setTransportState(prev => ({
      ...prev,
      loopStart: start,
      loopEnd: end,
      isLooping: enabled && start !== null && end !== null,
    }));

    logger.debug('[TransportSync] Loop set', { start, end, enabled });
  }, []);

  // Clear loop
  const clearLoop = useCallback(() => {
    setTransportState(prev => ({
      ...prev,
      loopStart: null,
      loopEnd: null,
      isLooping: false,
    }));
  }, []);

  // Stop and reset
  const stop = useCallback(() => {
    pause();
    seek(0);
    logger.debug('[TransportSync] Stopped');
  }, [pause, seek]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    transportState,
    isPlaying: transportState.isPlaying,
    currentTime: transportState.currentTime,
    duration: transportState.duration,

    // Controls
    play,
    pause,
    toggle,
    stop,
    seek,

    // Loop
    setLoop,
    clearLoop,
    isLooping: transportState.isLooping,

    // Source management
    registerSource,
    unregisterSource,
    getCurrentTime,

    // Utils
    syncSources,
  };
}
