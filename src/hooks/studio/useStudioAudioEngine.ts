/**
 * Studio Audio Engine - Unified Multi-track Playback with Effects Integration
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Audio Routing Chain (per track):
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                                                                             │
 * │   HTMLAudioElement                                                          │
 * │        ↓                                                                    │
 * │   MediaElementSourceNode                                                    │
 * │        ↓                                                                    │
 * │   [Effects Chain] ← Optional: EQ → Compressor → Delay → Filter → Reverb    │
 * │        ↓                                                                    │
 * │   GainNode (per-track volume control, 0-1)                                  │
 * │        ↓                                                                    │
 * │   StereoPannerNode (pan L/R, -1 to +1)                                      │
 * │        ↓                                                                    │
 * │   [AnalyserNode] ← For VU meters visualization                             │
 * │        ↓                                                                    │
 * │   ────────────────────────────────────────────────────────────────────      │
 * │        ↓                                                                    │
 * │   MasterGainNode (master volume)                                            │
 * │        ↓                                                                    │
 * │   AudioContext.destination (speakers)                                       │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * FEATURES IMPLEMENTED
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * ✓ Multi-track synchronized playback
 * ✓ Per-track volume with smooth ramping
 * ✓ Mute/Solo with automatic gain calculation
 * ✓ Per-track pan control (StereoPannerNode)
 * ✓ Master volume control
 * ✓ Effects chain insertion point
 * ✓ AnalyserNode per track for VU meters
 * ✓ Low-latency seek across all tracks
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * FUTURE TASKS / TODOs
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * TODO: [STUDIO-050] Loop Region
 *   - setLoopRegion(start: number, end: number | null)
 *   - Auto-seek to start when reaching end
 *   - Visual feedback in timeline UI
 *   - Quantize to beat grid if BPM available
 * 
 * TODO: [STUDIO-051] Offline Rendering / Export
 *   - OfflineAudioContext for mix export
 *   - Apply all effects during render
 *   - Progress callback for long exports
 *   - Support WAV, MP3, FLAC output
 * 
 * TODO: [STUDIO-052] Latency Compensation
 *   - Track plugin latency per effects chain
 *   - Delay dry signal to match wet signal
 *   - Important for time-based effects (delay, reverb)
 * 
 * TODO: [STUDIO-053] MIDI Clock Sync
 *   - Sync to external MIDI clock
 *   - Quantize loop region to beats
 *   - Tempo-sync delay times (1/4, 1/8, etc.)
 * 
 * TODO: [STUDIO-054] Recording / Overdub
 *   - MediaRecorder API integration
 *   - Record from microphone while playing
 *   - Punch-in/punch-out recording
 * 
 * TODO: [STUDIO-055] Automation
 *   - Volume/pan automation lanes
 *   - Effect parameter automation
 *   - Envelope followers
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { getOrCreateStudioContext, ensureAudioContextRunning } from '@/lib/audio/audioContextHelper';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AudioTrack {
  id: string;
  audioUrl?: string;
  volume: number;    // 0-1
  muted: boolean;
  solo: boolean;
  pan?: number;      // -1 (L) to +1 (R), default 0 (center)
}

/**
 * Internal track node with all Web Audio API connections
 */
interface TrackNode {
  id: string;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode | null;
  
  // Audio routing nodes
  gainNode: GainNode;              // Volume control
  panNode: StereoPannerNode;       // Stereo panning
  analyserNode: AnalyserNode;      // VU meter visualization
  
  // Effects chain integration
  effectsInput: GainNode | null;   // Entry point for effects chain
  effectsOutput: GainNode | null;  // Exit point from effects chain
  effectsBypass: boolean;          // If true, skip effects chain
  
  // State
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

export interface UseStudioAudioEngineReturn {
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isReady: boolean;
  loadedTracks: Set<string>;
  
  // Playback controls
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  
  // Track controls
  setTrackVolume: (trackId: string, volume: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  setMasterVolume: (volume: number) => void;
  
  // Effects integration
  insertEffectsChain: (trackId: string, input: GainNode, output: GainNode) => void;
  removeEffectsChain: (trackId: string) => void;
  bypassEffects: (trackId: string, bypass: boolean) => void;
  
  // Analysis (VU meters)
  getAnalyserNode: (trackId: string) => AnalyserNode | null;
  getAudioContext: () => AudioContext | null;
  
  // Utility
  getTrackDuration: (trackId: string) => number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

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

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIO CONTEXT INITIALIZATION
  // Uses singleton pattern to prevent multiple contexts
  // ─────────────────────────────────────────────────────────────────────────────
  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await ensureAudioContextRunning(audioContextRef.current);
      return audioContextRef.current;
    }

    try {
      const ctx = getOrCreateStudioContext();
      await ensureAudioContextRunning(ctx);
      
      audioContextRef.current = ctx;
      
      // Create master gain if needed
      if (!masterGainRef.current || masterGainRef.current.context !== ctx) {
        masterGainRef.current = ctx.createGain();
        masterGainRef.current.gain.value = masterVolume;
        masterGainRef.current.connect(ctx.destination);
      }
      
      logger.debug('Studio AudioContext initialized');
      return ctx;
    } catch (err) {
      logger.error('Failed to initialize AudioContext', err);
      return null;
    }
  }, [masterVolume]);

  // ─────────────────────────────────────────────────────────────────────────────
  // TRACK NODE SETUP
  // Creates audio element, gain node, pan node, and analyser for each track
  // ─────────────────────────────────────────────────────────────────────────────
  const setupTrackNode = useCallback(async (track: AudioTrack): Promise<TrackNode | null> => {
    if (!track.audioUrl) return null;

    const existing = trackNodesRef.current.get(track.id);
    
    // If same URL, just update volume/pan
    if (existing && existing.audio.src === track.audioUrl) {
      const effectiveVolume = track.muted ? 0 : track.volume;
      existing.gainNode.gain.setValueAtTime(effectiveVolume, audioContextRef.current?.currentTime || 0);
      existing.panNode.pan.setValueAtTime(track.pan || 0, audioContextRef.current?.currentTime || 0);
      return existing;
    }

    // Clean up existing node
    if (existing) {
      existing.audio.pause();
      existing.audio.src = '';
      existing.source?.disconnect();
      existing.gainNode.disconnect();
      existing.panNode.disconnect();
      existing.analyserNode.disconnect();
    }

    const ctx = await initAudioContext();
    if (!ctx || !masterGainRef.current) return null;
    
    // Verify master gain belongs to our context
    if (masterGainRef.current.context !== ctx) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = masterVolume;
      masterGainRef.current.connect(ctx.destination);
    }

    // Create audio element
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    
    // Create audio nodes
    // Routing: source → [effects] → gain → pan → analyser → master
    const gainNode = ctx.createGain();
    const panNode = ctx.createStereoPanner();
    const analyserNode = ctx.createAnalyser();
    
    // Configure analyser for VU meters
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;
    
    // Set initial values
    const effectiveVolume = track.muted ? 0 : track.volume;
    gainNode.gain.value = effectiveVolume;
    panNode.pan.value = track.pan || 0;
    
    // Connect: gain → pan → analyser → master
    gainNode.connect(panNode);
    panNode.connect(analyserNode);
    analyserNode.connect(masterGainRef.current);

    const trackNode: TrackNode = {
      id: track.id,
      audio,
      source: null,
      gainNode,
      panNode,
      analyserNode,
      effectsInput: null,
      effectsOutput: null,
      effectsBypass: false,
      isLoaded: false,
      duration: 0,
    };

    return new Promise((resolve) => {
      audio.onloadedmetadata = () => {
        if (!isMountedRef.current) return;
        
        trackNode.duration = audio.duration;
        trackNode.isLoaded = true;
        
        // Create media source and connect to gain
        if (audioContextRef.current === ctx) {
          try {
            trackNode.source = ctx.createMediaElementSource(audio);
            // Source connects directly to gain (effects chain inserted later if needed)
            trackNode.source.connect(gainNode);
          } catch (err) {
            logger.warn('Failed to create media source', { trackId: track.id, err });
          }
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
  }, [initAudioContext, onTrackLoaded, masterVolume]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MUTE/SOLO GAIN CALCULATION
  // Solo has priority: if any track has solo, only solo tracks are audible
  // ─────────────────────────────────────────────────────────────────────────────
  const trackStatesSignature = useMemo(() => 
    tracks.map(t => `${t.id}:${t.muted}:${t.solo}:${t.volume}:${t.pan ?? 0}`).join('|'),
    [tracks]
  );

  const updateTrackGains = useCallback(() => {
    const hasSolo = tracks.some(t => t.solo && t.audioUrl);
    
    for (const track of tracks) {
      const node = trackNodesRef.current.get(track.id);
      if (!node) continue;
      
      let effectiveVolume = track.volume;
      
      // Mute takes priority, then solo logic
      if (track.muted) {
        effectiveVolume = 0;
      } else if (hasSolo && !track.solo) {
        effectiveVolume = 0;
      }
      
      const ctx = audioContextRef.current;
      if (ctx) {
        // Smooth volume transition to avoid clicks
        node.gainNode.gain.setTargetAtTime(effectiveVolume, ctx.currentTime, 0.01);
        node.panNode.pan.setTargetAtTime(track.pan || 0, ctx.currentTime, 0.01);
      }
    }
  }, [tracks]);

  // ─────────────────────────────────────────────────────────────────────────────
  // EFFECTS CHAIN INTEGRATION
  // Insert/remove effects chain between source and gain node
  // ─────────────────────────────────────────────────────────────────────────────
  const insertEffectsChain = useCallback((
    trackId: string, 
    effectsInput: GainNode, 
    effectsOutput: GainNode
  ) => {
    const node = trackNodesRef.current.get(trackId);
    if (!node || !node.source) {
      logger.warn('Cannot insert effects: track not ready', { trackId });
      return;
    }

    // Disconnect source from gain
    node.source.disconnect();
    
    // Route: source → effectsInput → [effects processing] → effectsOutput → gain
    node.source.connect(effectsInput);
    effectsOutput.connect(node.gainNode);
    
    node.effectsInput = effectsInput;
    node.effectsOutput = effectsOutput;
    node.effectsBypass = false;
    
    logger.debug('Effects chain inserted', { trackId });
  }, []);

  const removeEffectsChain = useCallback((trackId: string) => {
    const node = trackNodesRef.current.get(trackId);
    if (!node || !node.source) return;

    // Disconnect effects
    node.source.disconnect();
    if (node.effectsOutput) {
      node.effectsOutput.disconnect();
    }
    
    // Route directly: source → gain
    node.source.connect(node.gainNode);
    
    node.effectsInput = null;
    node.effectsOutput = null;
    
    logger.debug('Effects chain removed', { trackId });
  }, []);

  const bypassEffects = useCallback((trackId: string, bypass: boolean) => {
    const node = trackNodesRef.current.get(trackId);
    if (!node) return;
    
    node.effectsBypass = bypass;
    
    if (!node.source) return;
    
    if (bypass && node.effectsInput && node.effectsOutput) {
      // Bypass: route source directly to gain
      node.source.disconnect();
      node.effectsOutput.disconnect();
      node.source.connect(node.gainNode);
    } else if (!bypass && node.effectsInput && node.effectsOutput) {
      // Enable effects: restore chain
      node.source.disconnect();
      node.source.connect(node.effectsInput);
      node.effectsOutput.connect(node.gainNode);
    }
    
    logger.debug('Effects bypass toggled', { trackId, bypass });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SETUP ALL TRACKS
  // ─────────────────────────────────────────────────────────────────────────────
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
      
      // Calculate max duration from all tracks
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
  }, [tracks.map(t => t.id + t.audioUrl).join(',')]);

  // Update gains when mute/solo/volume/pan changes
  useEffect(() => {
    updateTrackGains();
  }, [trackStatesSignature, updateTrackGains]);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // TIME UPDATE LOOP
  // Uses requestAnimationFrame for smooth 60fps updates
  // ─────────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────────
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
        node.panNode.disconnect();
        node.analyserNode.disconnect();
      });
      trackNodesRef.current.clear();
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYBACK CONTROLS
  // ─────────────────────────────────────────────────────────────────────────────
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

  const pause = useCallback(() => {
    trackNodesRef.current.forEach(node => {
      node.audio.pause();
    });
    setIsPlaying(false);
    logger.debug('Studio playback paused');
  }, []);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // TRACK CONTROLS
  // ─────────────────────────────────────────────────────────────────────────────
  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    const node = trackNodesRef.current.get(trackId);
    if (node && audioContextRef.current) {
      const track = tracks.find(t => t.id === trackId);
      const effectiveVolume = track?.muted ? 0 : volume;
      node.gainNode.gain.setTargetAtTime(effectiveVolume, audioContextRef.current.currentTime, 0.01);
    }
  }, [tracks]);

  const setTrackPan = useCallback((trackId: string, pan: number) => {
    const node = trackNodesRef.current.get(trackId);
    if (node && audioContextRef.current) {
      // Clamp pan to -1...+1 range
      const clampedPan = Math.max(-1, Math.min(1, pan));
      node.panNode.pan.setTargetAtTime(clampedPan, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  const setMasterVolumeInternal = useCallback((volume: number) => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.01);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYSIS / VU METERS
  // ─────────────────────────────────────────────────────────────────────────────
  const getAnalyserNode = useCallback((trackId: string): AnalyserNode | null => {
    return trackNodesRef.current.get(trackId)?.analyserNode || null;
  }, []);

  const getAudioContext = useCallback((): AudioContext | null => {
    return audioContextRef.current;
  }, []);

  const getTrackDuration = useCallback((trackId: string): number => {
    return trackNodesRef.current.get(trackId)?.duration || 0;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // RETURN VALUE
  // ─────────────────────────────────────────────────────────────────────────────
  const isReady = loadedTracks.size > 0 && !isLoading;

  return {
    // Playback state
    isPlaying,
    currentTime,
    duration,
    isLoading,
    isReady,
    loadedTracks,
    
    // Playback controls
    play,
    pause,
    stop,
    seek,
    
    // Track controls
    setTrackVolume,
    setTrackPan,
    setMasterVolume: setMasterVolumeInternal,
    
    // Effects integration
    insertEffectsChain,
    removeEffectsChain,
    bypassEffects,
    
    // Analysis
    getAnalyserNode,
    getAudioContext,
    
    // Utility
    getTrackDuration,
  };
}
