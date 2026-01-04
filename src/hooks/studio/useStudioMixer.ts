/**
 * useStudioMixer - Unified mixer hook
 * Combines audio engine, effects, and controls
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useStudioAudioEngine, type AudioTrack } from './useStudioAudioEngine';
import { useStudioEffectsEngine, DEFAULT_EFFECTS } from './useStudioEffectsEngine';
import { getMixPreset, getPresetStemSettings, type MixPreset } from './mixPresetsConfig';
import type { StemEffects } from './types';

export interface MixerTrack {
  id: string;
  name: string;
  type: string;
  audioUrl?: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: StemEffects;
  color?: string;
}

export interface UseStudioMixerOptions {
  tracks: MixerTrack[];
  masterVolume?: number;
  onTrackChange?: (trackId: string, changes: Partial<MixerTrack>) => void;
  onMasterVolumeChange?: (volume: number) => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
}

export interface UseStudioMixerReturn {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isReady: boolean;

  // Playback controls
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  togglePlayPause: () => Promise<void>;

  // Track controls
  setVolume: (trackId: string, volume: number) => void;
  setPan: (trackId: string, pan: number) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;
  
  // Effects
  getEffects: (trackId: string) => StemEffects;
  updateEffects: (trackId: string, effects: Partial<StemEffects>) => void;
  resetEffects: (trackId: string) => void;
  
  // Master
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  
  // Presets
  applyPreset: (presetId: string) => void;
  getAvailablePresets: () => MixPreset[];
  
  // Internal state (for UI)
  hasSoloTracks: boolean;
}

export function useStudioMixer({
  tracks,
  masterVolume: initialMasterVolume = 0.85,
  onTrackChange,
  onMasterVolumeChange,
  onTimeUpdate,
  onEnded,
}: UseStudioMixerOptions): UseStudioMixerReturn {
  const [masterVolume, setMasterVolumeState] = useState(initialMasterVolume);
  const [trackEffects, setTrackEffects] = useState<Map<string, StemEffects>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check if any track has solo enabled
  const hasSoloTracks = useMemo(() => tracks.some(t => t.solo), [tracks]);

  // Convert MixerTracks to AudioTracks for the engine
  const audioTracks: AudioTrack[] = useMemo(() => 
    tracks.map(t => ({
      id: t.id,
      audioUrl: t.audioUrl,
      volume: t.volume,
      muted: t.muted,
      solo: t.solo,
    })),
    [tracks]
  );

  // Audio engine
  const audioEngine = useStudioAudioEngine({
    tracks: audioTracks,
    masterVolume,
    onTimeUpdate,
    onEnded,
  });

  // Effects engine
  const effectsEngine = useStudioEffectsEngine({
    audioContext: audioContextRef.current,
  });

  // Playback controls
  const play = useCallback(async () => {
    await audioEngine.play();
  }, [audioEngine]);

  const pause = useCallback(() => {
    audioEngine.pause();
  }, [audioEngine]);

  const stop = useCallback(() => {
    audioEngine.stop();
  }, [audioEngine]);

  const seek = useCallback((time: number) => {
    audioEngine.seek(time);
  }, [audioEngine]);

  const togglePlayPause = useCallback(async () => {
    if (audioEngine.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [audioEngine.isPlaying, play, pause]);

  // Track controls
  const setVolume = useCallback((trackId: string, volume: number) => {
    audioEngine.setTrackVolume(trackId, volume);
    onTrackChange?.(trackId, { volume });
  }, [audioEngine, onTrackChange]);

  const setPan = useCallback((trackId: string, pan: number) => {
    // TODO: Implement pan in audio engine using StereoPannerNode
    onTrackChange?.(trackId, { pan });
    logger.debug('Pan change', { trackId, pan });
  }, [onTrackChange]);

  const toggleMute = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      onTrackChange?.(trackId, { muted: !track.muted });
    }
  }, [tracks, onTrackChange]);

  const toggleSolo = useCallback((trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      onTrackChange?.(trackId, { solo: !track.solo });
    }
  }, [tracks, onTrackChange]);

  // Effects
  const getEffects = useCallback((trackId: string): StemEffects => {
    return trackEffects.get(trackId) || DEFAULT_EFFECTS;
  }, [trackEffects]);

  const updateEffects = useCallback((trackId: string, effects: Partial<StemEffects>) => {
    setTrackEffects(prev => {
      const current = prev.get(trackId) || DEFAULT_EFFECTS;
      const updated = {
        ...current,
        ...effects,
        eq: effects.eq ? { ...current.eq, ...effects.eq } : current.eq,
        compressor: effects.compressor ? { ...current.compressor, ...effects.compressor } : current.compressor,
        reverb: effects.reverb ? { ...current.reverb, ...effects.reverb } : current.reverb,
        delay: effects.delay ? { ...current.delay, ...effects.delay } : current.delay,
        filter: effects.filter ? { ...current.filter, ...effects.filter } : current.filter,
      };
      
      const newMap = new Map(prev);
      newMap.set(trackId, updated);
      
      // Apply to effects engine
      effectsEngine.updateEffects(trackId, updated);
      
      return newMap;
    });
    
    onTrackChange?.(trackId, { effects: getEffects(trackId) });
  }, [effectsEngine, getEffects, onTrackChange]);

  const resetEffects = useCallback((trackId: string) => {
    setTrackEffects(prev => {
      const newMap = new Map(prev);
      newMap.set(trackId, DEFAULT_EFFECTS);
      return newMap;
    });
    effectsEngine.updateEffects(trackId, DEFAULT_EFFECTS);
    onTrackChange?.(trackId, { effects: DEFAULT_EFFECTS });
  }, [effectsEngine, onTrackChange]);

  // Master volume
  const setMasterVolume = useCallback((volume: number) => {
    setMasterVolumeState(volume);
    audioEngine.setMasterVolume(volume);
    onMasterVolumeChange?.(volume);
  }, [audioEngine, onMasterVolumeChange]);

  // Presets
  const applyPreset = useCallback((presetId: string) => {
    const preset = getMixPreset(presetId);
    if (!preset) {
      logger.warn('Preset not found', { presetId });
      return;
    }

    logger.info('Applying mix preset', { presetId, name: preset.name });

    // Apply settings to each track
    for (const track of tracks) {
      const settings = getPresetStemSettings(preset, track.type);
      
      // Apply volume
      if (settings.volume !== undefined) {
        setVolume(track.id, settings.volume);
      }
      
      // Apply mute
      if (settings.muted !== undefined && settings.muted !== track.muted) {
        toggleMute(track.id);
      }
      
      // Apply effects
      if (settings.effects) {
        updateEffects(track.id, settings.effects);
      }
    }

    // Apply master volume
    if (preset.masterVolume !== undefined) {
      setMasterVolume(preset.masterVolume);
    }
  }, [tracks, setVolume, toggleMute, updateEffects, setMasterVolume]);

  const getAvailablePresets = useCallback((): MixPreset[] => {
    // Import directly to avoid circular dependency
    const { MIX_PRESETS } = require('./mixPresetsConfig');
    return MIX_PRESETS;
  }, []);

  return {
    // Playback state
    isPlaying: audioEngine.isPlaying,
    currentTime: audioEngine.currentTime,
    duration: audioEngine.duration,
    isLoading: audioEngine.isLoading,
    isReady: audioEngine.isReady,

    // Playback controls
    play,
    pause,
    stop,
    seek,
    togglePlayPause,

    // Track controls
    setVolume,
    setPan,
    toggleMute,
    toggleSolo,

    // Effects
    getEffects,
    updateEffects,
    resetEffects,

    // Master
    masterVolume,
    setMasterVolume,

    // Presets
    applyPreset,
    getAvailablePresets,

    // State
    hasSoloTracks,
  };
}
