/**
 * useStudioMixer - Unified mixer hook
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Combines audio engine, effects engine, and mixer controls into a single hook
 * for the studio interface. Provides a clean API for:
 * - Multi-track playback control
 * - Per-track volume, pan, mute, solo
 * - Effects chain management per track
 * - Mix presets
 * - VU meter data access
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * USAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * const mixer = useStudioMixer({
 *   tracks: [
 *     { id: 'vocal', name: 'Вокал', type: 'vocal', audioUrl: '...', volume: 0.8, pan: 0, muted: false, solo: false, effects: DEFAULT_EFFECTS },
 *   ],
 *   masterVolume: 0.85,
 *   onTrackChange: (trackId, changes) => { ... },
 * });
 * 
 * // Playback
 * await mixer.play();
 * mixer.seek(30);
 * 
 * // Controls
 * mixer.setVolume('vocal', 0.5);
 * mixer.setPan('vocal', -0.5); // pan left
 * mixer.toggleMute('vocal');
 * 
 * // VU meters
 * const analyser = mixer.getAnalyserNode('vocal');
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useStudioAudioEngine, type AudioTrack } from './useStudioAudioEngine';
import { useStudioEffectsEngine, DEFAULT_EFFECTS } from './useStudioEffectsEngine';
import { getMixPreset, getPresetStemSettings, type MixPreset } from './mixPresetsConfig';
import type { StemEffects } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface MixerTrack {
  id: string;
  name: string;
  type: string;          // 'vocal', 'instrumental', 'drums', 'bass', 'guitar', 'other'
  audioUrl?: string;
  volume: number;        // 0-1
  pan: number;           // -1 (L) to +1 (R)
  muted: boolean;
  solo: boolean;
  effects: StemEffects;
  color?: string;        // For UI visualization
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
  
  // Analysis (VU meters)
  getAnalyserNode: (trackId: string) => AnalyserNode | null;
  getAudioContext: () => AudioContext | null;
  
  // Internal state (for UI)
  hasSoloTracks: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

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

  // Check if any track has solo enabled
  const hasSoloTracks = useMemo(() => tracks.some(t => t.solo), [tracks]);

  // Convert MixerTracks to AudioTracks for the engine (include pan)
  const audioTracks: AudioTrack[] = useMemo(() => 
    tracks.map(t => ({
      id: t.id,
      audioUrl: t.audioUrl,
      volume: t.volume,
      muted: t.muted,
      solo: t.solo,
      pan: t.pan,
    })),
    [tracks]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIO ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  const audioEngine = useStudioAudioEngine({
    tracks: audioTracks,
    masterVolume,
    onTimeUpdate,
    onEnded,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // EFFECTS ENGINE
  // Get AudioContext from audio engine for effects
  // ─────────────────────────────────────────────────────────────────────────────
  const audioContext = audioEngine.getAudioContext();
  
  const effectsEngine = useStudioEffectsEngine({
    audioContext,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // EFFECTS CHAIN INTEGRATION
  // Connect effectsEngine to audioEngine for each track
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    // Wait for audio context to be available and tracks to be loaded
    if (!audioContext || !audioEngine.isReady) return;
    
    // Create and connect effects chains for each track
    tracks.forEach(track => {
      const existingChain = effectsEngine.getEffectsChain(track.id);
      if (!existingChain) {
        const chain = effectsEngine.createEffectsChain(track.id);
        if (chain) {
          // Insert the effects chain between source and gain in audio engine
          audioEngine.insertEffectsChain(track.id, chain.input, chain.output);
          logger.debug('Effects chain connected to audio routing', { trackId: track.id });
          
          // Apply initial effects from track
          if (track.effects) {
            effectsEngine.updateEffects(track.id, track.effects);
          }
        }
      }
    });
    
    // Cleanup effects chains when tracks are removed
    return () => {
      tracks.forEach(track => {
        const chain = effectsEngine.getEffectsChain(track.id);
        if (chain) {
          audioEngine.removeEffectsChain(track.id);
        }
      });
    };
  }, [audioContext, audioEngine.isReady, tracks, effectsEngine, audioEngine]);

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
    // Apply pan to audio engine (StereoPannerNode)
    audioEngine.setTrackPan(trackId, pan);
    onTrackChange?.(trackId, { pan });
  }, [audioEngine, onTrackChange]);

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

    // Analysis (VU meters)
    getAnalyserNode: audioEngine.getAnalyserNode,
    getAudioContext: audioEngine.getAudioContext,

    // State
    hasSoloTracks,
  };
}
