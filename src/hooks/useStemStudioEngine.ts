/**
 * Stem Studio Engine Manager
 * 
 * Manages multiple stem audio engines with Web Audio API
 * Provides centralized control for effects across all stems
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  StemEffects,
  EQSettings,
  CompressorSettings,
  ReverbSettings,
  defaultStemEffects,
  eqPresets,
  compressorPresets,
  reverbPresets,
} from './useStemAudioEngine';

// Shared AudioContext singleton
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

// Generate impulse response for reverb
function createImpulseResponse(
  audioContext: AudioContext,
  duration: number,
  decay: number
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioContext.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  
  return impulse;
}

interface StemAudioNodes {
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
  lowEQ: BiquadFilterNode;
  midEQ: BiquadFilterNode;
  highEQ: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  dryGain: GainNode;
  wetGain: GainNode;
  convolver: ConvolverNode;
  outputGain: GainNode;
}

interface StemEngineState {
  nodes: StemAudioNodes | null;
  effects: StemEffects;
}

export function useStemStudioEngine(stemIds: string[]) {
  const [enginesState, setEnginesState] = useState<Record<string, StemEngineState>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesMapRef = useRef<Record<string, StemAudioNodes>>({});
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize engine for a stem
  const initializeStemEngine = useCallback((
    stemId: string, 
    audioElement: HTMLAudioElement
  ) => {
    // Skip if already initialized
    if (nodesMapRef.current[stemId]) {
      return nodesMapRef.current[stemId];
    }

    try {
      const ctx = getAudioContext();
      audioContextRef.current = ctx;

      // Create master gain if not exists
      if (!masterGainRef.current) {
        masterGainRef.current = ctx.createGain();
        masterGainRef.current.connect(ctx.destination);
      }

      // Create source from audio element
      const source = ctx.createMediaElementSource(audioElement);
      const gainNode = ctx.createGain();
      
      // EQ nodes
      const lowEQ = ctx.createBiquadFilter();
      lowEQ.type = 'lowshelf';
      lowEQ.frequency.value = 320;
      lowEQ.gain.value = 0;

      const midEQ = ctx.createBiquadFilter();
      midEQ.type = 'peaking';
      midEQ.frequency.value = 1000;
      midEQ.Q.value = 1;
      midEQ.gain.value = 0;

      const highEQ = ctx.createBiquadFilter();
      highEQ.type = 'highshelf';
      highEQ.frequency.value = 3200;
      highEQ.gain.value = 0;

      // Compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressor.knee.value = 30;

      // Reverb with dry/wet mix
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      const convolver = ctx.createConvolver();
      convolver.buffer = createImpulseResponse(ctx, 3, 2);
      
      dryGain.gain.value = 1;
      wetGain.gain.value = 0;

      const outputGain = ctx.createGain();
      outputGain.gain.value = 1;

      // Connect chain
      source.connect(gainNode);
      gainNode.connect(lowEQ);
      lowEQ.connect(midEQ);
      midEQ.connect(highEQ);
      highEQ.connect(compressor);
      
      // Parallel dry/wet for reverb
      compressor.connect(dryGain);
      compressor.connect(convolver);
      convolver.connect(wetGain);
      
      dryGain.connect(outputGain);
      wetGain.connect(outputGain);
      
      outputGain.connect(masterGainRef.current);

      const nodes: StemAudioNodes = {
        source,
        gainNode,
        lowEQ,
        midEQ,
        highEQ,
        compressor,
        dryGain,
        wetGain,
        convolver,
        outputGain,
      };

      nodesMapRef.current[stemId] = nodes;

      setEnginesState(prev => ({
        ...prev,
        [stemId]: {
          nodes,
          effects: defaultStemEffects,
        }
      }));

      logger.info('Stem engine initialized', { stemId });
      return nodes;
    } catch (error) {
      logger.error('Failed to initialize stem engine', { stemId, error });
      return null;
    }
  }, []);

  // Update EQ for a stem
  const updateStemEQ = useCallback((stemId: string, settings: Partial<EQSettings>) => {
    const nodes = nodesMapRef.current[stemId];
    if (!nodes) return;

    if (settings.lowGain !== undefined) {
      nodes.lowEQ.gain.value = settings.lowGain;
    }
    if (settings.midGain !== undefined) {
      nodes.midEQ.gain.value = settings.midGain;
    }
    if (settings.highGain !== undefined) {
      nodes.highEQ.gain.value = settings.highGain;
    }
    if (settings.lowFreq !== undefined) {
      nodes.lowEQ.frequency.value = settings.lowFreq;
    }
    if (settings.highFreq !== undefined) {
      nodes.highEQ.frequency.value = settings.highFreq;
    }

    setEnginesState(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        effects: {
          ...prev[stemId]?.effects || defaultStemEffects,
          eq: { ...(prev[stemId]?.effects?.eq || defaultStemEffects.eq), ...settings }
        }
      }
    }));
  }, []);

  // Update Compressor for a stem
  const updateStemCompressor = useCallback((stemId: string, settings: Partial<CompressorSettings>) => {
    const nodes = nodesMapRef.current[stemId];
    const ctx = audioContextRef.current;
    if (!nodes || !ctx) return;

    if (settings.threshold !== undefined) {
      nodes.compressor.threshold.setValueAtTime(settings.threshold, ctx.currentTime);
    }
    if (settings.ratio !== undefined) {
      nodes.compressor.ratio.setValueAtTime(settings.ratio, ctx.currentTime);
    }
    if (settings.attack !== undefined) {
      nodes.compressor.attack.setValueAtTime(settings.attack, ctx.currentTime);
    }
    if (settings.release !== undefined) {
      nodes.compressor.release.setValueAtTime(settings.release, ctx.currentTime);
    }
    if (settings.knee !== undefined) {
      nodes.compressor.knee.setValueAtTime(settings.knee, ctx.currentTime);
    }

    setEnginesState(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        effects: {
          ...prev[stemId]?.effects || defaultStemEffects,
          compressor: { ...(prev[stemId]?.effects?.compressor || defaultStemEffects.compressor), ...settings }
        }
      }
    }));
  }, []);

  // Update Reverb for a stem
  const updateStemReverb = useCallback((stemId: string, settings: Partial<ReverbSettings>) => {
    const nodes = nodesMapRef.current[stemId];
    const ctx = audioContextRef.current;
    if (!nodes || !ctx) return;

    if (settings.wetDry !== undefined) {
      const enabled = enginesState[stemId]?.effects?.reverb?.enabled ?? false;
      if (enabled || settings.enabled) {
        const wet = settings.wetDry;
        const dry = 1 - wet;
        nodes.dryGain.gain.setValueAtTime(dry, ctx.currentTime);
        nodes.wetGain.gain.setValueAtTime(wet, ctx.currentTime);
      }
    }

    if (settings.decay !== undefined) {
      nodes.convolver.buffer = createImpulseResponse(ctx, 3, settings.decay);
    }

    if (settings.enabled === false) {
      nodes.wetGain.gain.setValueAtTime(0, ctx.currentTime);
      nodes.dryGain.gain.setValueAtTime(1, ctx.currentTime);
    } else if (settings.enabled === true) {
      const wetDry = settings.wetDry ?? enginesState[stemId]?.effects?.reverb?.wetDry ?? 0.3;
      nodes.dryGain.gain.setValueAtTime(1 - wetDry, ctx.currentTime);
      nodes.wetGain.gain.setValueAtTime(wetDry, ctx.currentTime);
    }

    setEnginesState(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        effects: {
          ...prev[stemId]?.effects || defaultStemEffects,
          reverb: { ...(prev[stemId]?.effects?.reverb || defaultStemEffects.reverb), ...settings }
        }
      }
    }));
  }, [enginesState]);

  // Apply EQ preset
  const applyStemEQPreset = useCallback((stemId: string, presetName: keyof typeof eqPresets) => {
    const preset = eqPresets[presetName];
    if (preset) {
      updateStemEQ(stemId, preset);
    }
  }, [updateStemEQ]);

  // Apply Compressor preset
  const applyStemCompressorPreset = useCallback((stemId: string, presetName: keyof typeof compressorPresets) => {
    const preset = compressorPresets[presetName];
    if (preset) {
      updateStemCompressor(stemId, preset);
    }
  }, [updateStemCompressor]);

  // Apply Reverb preset
  const applyStemReverbPreset = useCallback((stemId: string, presetName: keyof typeof reverbPresets) => {
    const preset = reverbPresets[presetName];
    if (preset) {
      updateStemReverb(stemId, preset);
    }
  }, [updateStemReverb]);

  // Reset all effects for a stem
  const resetStemEffects = useCallback((stemId: string) => {
    updateStemEQ(stemId, {
      lowGain: 0,
      midGain: 0,
      highGain: 0,
      lowFreq: 320,
      highFreq: 3200,
    });
    updateStemCompressor(stemId, {
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 30,
      enabled: false,
    });
    updateStemReverb(stemId, {
      wetDry: 0.3,
      decay: 2,
      enabled: false,
    });
  }, [updateStemEQ, updateStemCompressor, updateStemReverb]);

  // Get compressor reduction for metering
  const getCompressorReduction = useCallback((stemId: string) => {
    const nodes = nodesMapRef.current[stemId];
    if (!nodes) return 0;
    return nodes.compressor.reduction;
  }, []);

  // Set volume for a stem (bypassing effects)
  const setStemVolume = useCallback((stemId: string, volume: number) => {
    const nodes = nodesMapRef.current[stemId];
    if (!nodes) return;
    nodes.gainNode.gain.value = volume;
  }, []);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, []);

  // Resume audio context
  const resumeContext = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }, []);

  // Mark as initialized when all stems have engines
  useEffect(() => {
    const allInitialized = stemIds.every(id => nodesMapRef.current[id]);
    if (allInitialized && stemIds.length > 0) {
      setIsInitialized(true);
    }
  }, [stemIds, enginesState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(nodesMapRef.current).forEach(nodes => {
        try {
          nodes.source.disconnect();
          nodes.gainNode.disconnect();
          nodes.lowEQ.disconnect();
          nodes.midEQ.disconnect();
          nodes.highEQ.disconnect();
          nodes.compressor.disconnect();
          nodes.dryGain.disconnect();
          nodes.wetGain.disconnect();
          nodes.convolver.disconnect();
          nodes.outputGain.disconnect();
        } catch (e) {
          // Nodes might already be disconnected
        }
      });
      nodesMapRef.current = {};
      
      if (masterGainRef.current) {
        try {
          masterGainRef.current.disconnect();
        } catch (e) {}
        masterGainRef.current = null;
      }
    };
  }, []);

  return {
    enginesState,
    isInitialized,
    initializeStemEngine,
    updateStemEQ,
    updateStemCompressor,
    updateStemReverb,
    applyStemEQPreset,
    applyStemCompressorPreset,
    applyStemReverbPreset,
    resetStemEffects,
    getCompressorReduction,
    setStemVolume,
    setMasterVolume,
    resumeContext,
  };
}
