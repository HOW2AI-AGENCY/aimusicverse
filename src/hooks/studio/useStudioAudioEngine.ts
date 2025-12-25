/**
 * Studio Audio Engine
 * 
 * Multi-track audio playback using Web Audio API with:
 * - Synchronized playback across all tracks
 * - Per-track volume, mute, solo
 * - Master volume control
 * - Low-latency seek
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { createAudioContext, ensureAudioContextRunning } from '@/lib/audio/audioContextHelper';

export interface AudioTrack {
  id: string;
  audioUrl?: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

interface TrackNode {
  id: string;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode | null;
  gainNode: GainNode;
  isLoaded: boolean;
  duration: number;
}

interface UseStudioAudioEngineOptions {
  tracks: AudioTrack[];
  masterVolume: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onTrackLoaded?: (trackId: string) => void;
  onAllTracksLoaded?: () => void;
}

interface UseStudioAudioEngineReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  loadedTracks: Set<string>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  getTrackDuration: (trackId: string) => number;
}

export function useStudioAudioEngine({
  tracks,
  masterVolume,
  onTimeUpdate,
  onDurationChange,
  onEnded,
  onTrackLoaded,
  onAllTracksLoaded,
}: UseStudioAudioEngineOptions): UseStudioAudioEngineReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedTracks, setLoadedTracks] = useState<Set<string>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const trackNodesRef = useRef<Map<string, TrackNode>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Initialize AudioContext and master gain
  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) return audioContextRef.current;

    try {
      const ctx = createAudioContext();
      await ensureAudioContextRunning(ctx);
      
      audioContextRef.current = ctx;
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = masterVolume;
      masterGainRef.current.connect(ctx.destination);
      
      logger.debug('Studio AudioContext initialized');
      return ctx;
    } catch (err) {
      logger.error('Failed to initialize AudioContext', err);
      return null;
    }
  }, [masterVolume]);

  // Create or update track node
  const setupTrackNode = useCallback(async (track: AudioTrack): Promise<TrackNode | null> => {
    if (!track.audioUrl) return null;

    const existing = trackNodesRef.current.get(track.id);
    
    // If same URL, just update gain
    if (existing && existing.audio.src === track.audioUrl) {
      const effectiveVolume = track.muted ? 0 : track.volume;
      existing.gainNode.gain.setValueAtTime(effectiveVolume, audioContextRef.current?.currentTime || 0);
      return existing;
    }

    // Clean up existing
    if (existing) {
      existing.audio.pause();
      existing.audio.src = '';
      existing.source?.disconnect();
      existing.gainNode.disconnect();
    }

    const ctx = await initAudioContext();
    if (!ctx || !masterGainRef.current) return null;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    
    const gainNode = ctx.createGain();
    const effectiveVolume = track.muted ? 0 : track.volume;
    gainNode.gain.value = effectiveVolume;
    gainNode.connect(masterGainRef.current);

    const trackNode: TrackNode = {
      id: track.id,
      audio,
      source: null,
      gainNode,
      isLoaded: false,
      duration: 0,
    };

    return new Promise((resolve) => {
      audio.onloadedmetadata = () => {
        if (!isMountedRef.current) return;
        
        trackNode.duration = audio.duration;
        trackNode.isLoaded = true;
        
        // Create source node only once metadata is loaded
        try {
          trackNode.source = ctx.createMediaElementSource(audio);
          trackNode.source.connect(gainNode);
        } catch (err) {
          logger.warn('Failed to create media source', { trackId: track.id, err });
        }
        
        trackNodesRef.current.set(track.id, trackNode);
        
        setLoadedTracks(prev => new Set([...prev, track.id]));
        onTrackLoaded?.(track.id);
        
        logger.debug('Track loaded', { trackId: track.id, duration: audio.duration });
        resolve(trackNode);
      };

      audio.onerror = (e) => {
        logger.error('Track load error', { trackId: track.id, error: e });
        resolve(null);
      };

      audio.src = track.audioUrl!;
      audio.load();
    });
  }, [initAudioContext, onTrackLoaded]);

  // Update track gains based on mute/solo state
  const updateTrackGains = useCallback(() => {
    const hasSolo = tracks.some(t => t.solo && t.audioUrl);
    
    for (const track of tracks) {
      const node = trackNodesRef.current.get(track.id);
      if (!node) continue;
      
      let effectiveVolume = track.volume;
      
      if (track.muted) {
        effectiveVolume = 0;
      } else if (hasSolo && !track.solo) {
        effectiveVolume = 0;
      }
      
      const ctx = audioContextRef.current;
      if (ctx) {
        node.gainNode.gain.setTargetAtTime(effectiveVolume, ctx.currentTime, 0.01);
      }
    }
  }, [tracks]);

  // Setup all tracks
  useEffect(() => {
    if (tracks.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const setupTracks = async () => {
      const tracksWithAudio = tracks.filter(t => t.audioUrl);
      
      await Promise.all(tracksWithAudio.map(setupTrackNode));
      
      if (!isMountedRef.current) return;
      
      // Calculate max duration
      let maxDuration = 0;
      trackNodesRef.current.forEach(node => {
        if (node.duration > maxDuration) {
          maxDuration = node.duration;
        }
      });
      
      setDuration(maxDuration);
      onDurationChange?.(maxDuration);
      setIsLoading(false);
      
      if (loadedTracks.size === tracksWithAudio.length) {
        onAllTracksLoaded?.();
      }
    };

    setupTracks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.map(t => t.id + t.audioUrl).join(',')]); // Re-run when track URLs change

  // Update gains when mute/solo/volume changes
  useEffect(() => {
    updateTrackGains();
  }, [updateTrackGains]);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        masterVolume,
        audioContextRef.current.currentTime,
        0.01
      );
    }
  }, [masterVolume]);

  // Time update loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateTime = () => {
      // Get time from first loaded track
      const firstNode = Array.from(trackNodesRef.current.values()).find(n => n.isLoaded);
      if (firstNode) {
        const time = firstNode.audio.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
        
        // Check if ended
        if (time >= duration - 0.1) {
          setIsPlaying(false);
          onEnded?.();
          return;
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, duration, onTimeUpdate, onEnded]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Clean up all track nodes
      trackNodesRef.current.forEach(node => {
        node.audio.pause();
        node.audio.src = '';
        node.source?.disconnect();
        node.gainNode.disconnect();
      });
      trackNodesRef.current.clear();
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Play all tracks
  const play = useCallback(async () => {
    const ctx = await initAudioContext();
    if (!ctx) return;
    
    await ensureAudioContextRunning(ctx);
    
    const playPromises: Promise<void>[] = [];
    
    trackNodesRef.current.forEach(node => {
      if (node.isLoaded) {
        playPromises.push(
          node.audio.play().catch(err => {
            logger.warn('Track play failed', { trackId: node.id, err });
          })
        );
      }
    });
    
    await Promise.all(playPromises);
    setIsPlaying(true);
    
    logger.debug('Studio playback started', { trackCount: trackNodesRef.current.size });
  }, [initAudioContext]);

  // Pause all tracks
  const pause = useCallback(() => {
    trackNodesRef.current.forEach(node => {
      node.audio.pause();
    });
    setIsPlaying(false);
    logger.debug('Studio playback paused');
  }, []);

  // Stop and reset
  const stop = useCallback(() => {
    trackNodesRef.current.forEach(node => {
      node.audio.pause();
      node.audio.currentTime = 0;
    });
    setIsPlaying(false);
    setCurrentTime(0);
    onTimeUpdate?.(0);
    logger.debug('Studio playback stopped');
  }, [onTimeUpdate]);

  // Seek all tracks
  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    trackNodesRef.current.forEach(node => {
      if (node.isLoaded && node.audio.duration >= clampedTime) {
        node.audio.currentTime = clampedTime;
      }
    });
    
    setCurrentTime(clampedTime);
    onTimeUpdate?.(clampedTime);
  }, [duration, onTimeUpdate]);

  // Set individual track volume
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const node = trackNodesRef.current.get(trackId);
    if (node && audioContextRef.current) {
      const track = tracks.find(t => t.id === trackId);
      const effectiveVolume = track?.muted ? 0 : volume;
      node.gainNode.gain.setTargetAtTime(effectiveVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, [tracks]);

  // Set master volume
  const setMasterVolumeInternal = useCallback((volume: number) => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  // Get track duration
  const getTrackDuration = useCallback((trackId: string): number => {
    return trackNodesRef.current.get(trackId)?.duration || 0;
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    loadedTracks,
    play,
    pause,
    stop,
    seek,
    setTrackVolume,
    setMasterVolume: setMasterVolumeInternal,
    getTrackDuration,
  };
}
