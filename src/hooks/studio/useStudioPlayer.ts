/**
 * useStudioPlayer - Unified playback logic for Studio components
 * 
 * Centralizes audio playback state and controls for both
 * StemStudioContent and TrackStudioContent.
 * 
 * Now includes:
 * - Web Audio API integration
 * - Effects chain support (EQ, compressor, delay, filter)
 * - Loop region support
 * - Playback rate control
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { getOrCreateStudioContext, ensureAudioContextRunning } from '@/lib/audio/audioContextHelper';
import type { StemEffects, LoopRegion } from './types';
import { useStudioEffectsEngine, DEFAULT_EFFECTS } from './useStudioEffectsEngine';

interface UseStudioPlayerOptions {
  audioUrl?: string | null;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  /** Enable effects processing (requires more CPU) */
  enableEffects?: boolean;
  /** Initial effects settings */
  initialEffects?: StemEffects;
}

interface UseStudioPlayerReturn {
  // State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  loopRegion: LoopRegion | null;
  effects: StemEffects;
  isEffectsEnabled: boolean;
  
  // Controls
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setLoopRegion: (region: LoopRegion | null) => void;
  setEffects: (effects: Partial<StemEffects>) => void;
  toggleEffects: () => void;
  
  // Refs
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useStudioPlayer({
  audioUrl,
  onTimeUpdate,
  onEnded,
  enableEffects = false,
  initialEffects,
}: UseStudioPlayerOptions = {}): UseStudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [loopRegion, setLoopRegionState] = useState<LoopRegion | null>(null);
  const [effects, setEffectsState] = useState<StemEffects>(initialEffects || DEFAULT_EFFECTS);
  const [isEffectsEnabled, setIsEffectsEnabled] = useState(enableEffects);

  // Effects engine
  const effectsEngine = useStudioEffectsEngine({
    audioContext: audioContextRef.current,
  });

  // Initialize audio element and Web Audio nodes
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
    }
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
      
      // Handle loop region
      if (loopRegion?.enabled && time >= loopRegion.end) {
        audio.currentTime = loopRegion.start;
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    
    const handleEnded = () => {
      if (loopRegion?.enabled) {
        audio.currentTime = loopRegion.start;
        audio.play();
      } else {
        setIsPlaying(false);
        onEnded?.();
      }
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onEnded, loopRegion]);

  // Update audio source when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    
    if (audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.load();
      setCurrentTime(0);
      setIsPlaying(false);
      
      // Reset Web Audio connection for new source
      sourceNodeRef.current = null;
    }
  }, [audioUrl]);

  // Sync volume and mute state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Use gainNode if effects are enabled, otherwise direct audio volume
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = muted ? 0 : volume;
      audio.volume = 1; // Full volume to audio element, gain controls final volume
    } else {
      audio.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Sync playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Initialize Web Audio when effects are enabled
  const initWebAudio = useCallback(async () => {
    if (!audioRef.current || sourceNodeRef.current) return;
    
    try {
      const ctx = getOrCreateStudioContext();
      await ensureAudioContextRunning(ctx);
      audioContextRef.current = ctx;
      
      // Create source from audio element
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;
      
      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = muted ? 0 : volume;
      gainNodeRef.current = gainNode;
      
      // Create effects chain
      const effectsChain = effectsEngine.createEffectsChain('main');
      
      if (effectsChain && isEffectsEnabled) {
        // Route: source -> effects -> gain -> destination
        source.connect(effectsChain.input);
        effectsChain.output.connect(gainNode);
        effectsEngine.updateEffects('main', effects);
      } else {
        // Direct route: source -> gain -> destination
        source.connect(gainNode);
      }
      
      gainNode.connect(ctx.destination);
      
      logger.debug('Web Audio initialized for studio player');
    } catch (error) {
      logger.error('Failed to initialize Web Audio', error);
    }
  }, [muted, volume, isEffectsEnabled, effects, effectsEngine]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    try {
      // Initialize Web Audio on first play if effects are enabled
      if (isEffectsEnabled && !sourceNodeRef.current) {
        await initWebAudio();
      }
      
      await audio.play();
    } catch (error) {
      logger.error('Studio player play error', error);
    }
  }, [isEffectsEnabled, initWebAudio]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const clampedTime = Math.max(0, Math.min(time, audio.duration || 0));
    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    seek(audio.currentTime + seconds);
  }, [seek]);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(4, rate));
    setPlaybackRateState(clampedRate);
  }, []);

  const setLoopRegion = useCallback((region: LoopRegion | null) => {
    setLoopRegionState(region);
  }, []);

  const setEffects = useCallback((newEffects: Partial<StemEffects>) => {
    setEffectsState(prev => {
      const updated = { ...prev, ...newEffects };
      // Update effects engine
      if (isEffectsEnabled) {
        effectsEngine.updateEffects('main', updated);
      }
      return updated;
    });
  }, [isEffectsEnabled, effectsEngine]);

  const toggleEffects = useCallback(() => {
    setIsEffectsEnabled(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      
      // Disconnect Web Audio nodes
      sourceNodeRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      effectsEngine.cleanup();
    };
  }, [effectsEngine]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    playbackRate,
    loopRegion,
    effects,
    isEffectsEnabled,
    play,
    pause,
    togglePlay,
    seek,
    skip,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setLoopRegion,
    setEffects,
    toggleEffects,
    audioRef,
  };
}
