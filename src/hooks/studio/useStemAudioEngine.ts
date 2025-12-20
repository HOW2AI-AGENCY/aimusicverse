/**
 * Stem Audio Engine Hook
 * 
 * Manages Web Audio API nodes for stem processing with effects chain:
 * Source → Gain → EQ (Low/Mid/High) → Compressor → Convolver (Reverb) → Master
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

// Re-export types and presets from config (to maintain backwards compatibility)
export type {
  EQSettings,
  CompressorSettings,
  ReverbSettings,
  StemEffects,
} from './stemEffectsConfig';

export {
  defaultEQSettings,
  defaultCompressorSettings,
  defaultReverbSettings,
  defaultStemEffects,
  eqPresets,
  compressorPresets,
  reverbPresets,
} from './stemEffectsConfig';

// Import for internal use
import {
  EQSettings,
  CompressorSettings,
  ReverbSettings,
  StemEffects,
  defaultEQSettings,
  defaultCompressorSettings,
  defaultReverbSettings,
  defaultStemEffects,
  eqPresets,
  compressorPresets,
  reverbPresets,
} from './stemEffectsConfig';

// Shared AudioContext singleton
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

interface AudioNodes {
  source: MediaElementAudioSourceNode | null;
  gainNode: GainNode;
  lowEQ: BiquadFilterNode;
  midEQ: BiquadFilterNode;
  highEQ: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  dryGain: GainNode;
  wetGain: GainNode;
  convolver: ConvolverNode;
  masterGain: GainNode;
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

export function useStemAudioEngine(stemId: string, audioElement: HTMLAudioElement | null) {
  const nodesRef = useRef<AudioNodes | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const [effects, setEffects] = useState<StemEffects>(defaultStemEffects);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio nodes
  const initializeNodes = useCallback(() => {
    if (!audioElement || nodesRef.current) return;

    try {
      const ctx = getAudioContext();
      contextRef.current = ctx;

      // Create nodes
      const source = ctx.createMediaElementSource(audioElement);
      const gainNode = ctx.createGain();
      
      // EQ: Low shelf, Mid peaking, High shelf
      const lowEQ = ctx.createBiquadFilter();
      lowEQ.type = 'lowshelf';
      lowEQ.frequency.value = defaultEQSettings.lowFreq;
      lowEQ.gain.value = 0;

      const midEQ = ctx.createBiquadFilter();
      midEQ.type = 'peaking';
      midEQ.frequency.value = 1000;
      midEQ.Q.value = 1;
      midEQ.gain.value = 0;

      const highEQ = ctx.createBiquadFilter();
      highEQ.type = 'highshelf';
      highEQ.frequency.value = defaultEQSettings.highFreq;
      highEQ.gain.value = 0;

      // Compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = defaultCompressorSettings.threshold;
      compressor.ratio.value = defaultCompressorSettings.ratio;
      compressor.attack.value = defaultCompressorSettings.attack;
      compressor.release.value = defaultCompressorSettings.release;
      compressor.knee.value = defaultCompressorSettings.knee;

      // Reverb with dry/wet mix
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      const convolver = ctx.createConvolver();
      convolver.buffer = createImpulseResponse(ctx, 3, defaultReverbSettings.decay);
      
      dryGain.gain.value = 1;
      wetGain.gain.value = 0;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 1;

      // Connect chain: source → gain → EQ → compressor → dry/wet → master → destination
      source.connect(gainNode);
      gainNode.connect(lowEQ);
      lowEQ.connect(midEQ);
      midEQ.connect(highEQ);
      highEQ.connect(compressor);
      
      // Parallel dry/wet for reverb
      compressor.connect(dryGain);
      compressor.connect(convolver);
      convolver.connect(wetGain);
      
      dryGain.connect(masterGain);
      wetGain.connect(masterGain);
      
      masterGain.connect(ctx.destination);

      nodesRef.current = {
        source,
        gainNode,
        lowEQ,
        midEQ,
        highEQ,
        compressor,
        dryGain,
        wetGain,
        convolver,
        masterGain,
      };

      setIsInitialized(true);
      logger.info('Audio engine initialized', { stemId });
    } catch (error) {
      logger.error('Failed to initialize audio engine', { stemId, error });
    }
  }, [audioElement, stemId]);

  // Update EQ
  const updateEQ = useCallback((settings: Partial<EQSettings>) => {
    setEffects(prev => ({
      ...prev,
      eq: { ...prev.eq, ...settings }
    }));

    const nodes = nodesRef.current;
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
  }, []);

  // Update Compressor
  const updateCompressor = useCallback((settings: Partial<CompressorSettings>) => {
    setEffects(prev => ({
      ...prev,
      compressor: { ...prev.compressor, ...settings }
    }));

    const nodes = nodesRef.current;
    if (!nodes) return;

    const ctx = contextRef.current;
    if (!ctx) return;

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
  }, []);

  // Update Reverb
  const updateReverb = useCallback((settings: Partial<ReverbSettings>) => {
    setEffects(prev => ({
      ...prev,
      reverb: { ...prev.reverb, ...settings }
    }));

    const nodes = nodesRef.current;
    const ctx = contextRef.current;
    if (!nodes || !ctx) return;

    if (settings.wetDry !== undefined) {
      const wet = settings.wetDry;
      const dry = 1 - wet;
      nodes.dryGain.gain.setValueAtTime(dry, ctx.currentTime);
      nodes.wetGain.gain.setValueAtTime(wet, ctx.currentTime);
    }

    if (settings.decay !== undefined) {
      nodes.convolver.buffer = createImpulseResponse(ctx, 3, settings.decay);
    }

    if (settings.enabled !== undefined && !settings.enabled) {
      nodes.wetGain.gain.setValueAtTime(0, ctx.currentTime);
      nodes.dryGain.gain.setValueAtTime(1, ctx.currentTime);
    }
  }, []);

  // Set volume (integrates with existing stem volume)
  const setVolume = useCallback((volume: number) => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.gainNode.gain.value = volume;
  }, []);

  // Apply preset
  const applyEQPreset = useCallback((presetName: keyof typeof eqPresets) => {
    const preset = eqPresets[presetName];
    if (preset) {
      updateEQ(preset);
    }
  }, [updateEQ]);

  const applyCompressorPreset = useCallback((presetName: keyof typeof compressorPresets) => {
    const preset = compressorPresets[presetName];
    if (preset) {
      updateCompressor(preset);
    }
  }, [updateCompressor]);

  const applyReverbPreset = useCallback((presetName: keyof typeof reverbPresets) => {
    const preset = reverbPresets[presetName];
    if (preset) {
      updateReverb(preset);
    }
  }, [updateReverb]);

  // Reset all effects
  const resetEffects = useCallback(() => {
    updateEQ(defaultEQSettings);
    updateCompressor(defaultCompressorSettings);
    updateReverb(defaultReverbSettings);
  }, [updateEQ, updateCompressor, updateReverb]);

  // Get compressor reduction for metering
  const getCompressorReduction = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes) return 0;
    return nodes.compressor.reduction;
  }, []);

  // Resume audio context (needed for user gesture)
  const resumeContext = useCallback(async () => {
    const ctx = contextRef.current;
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      const nodes = nodesRef.current;
      if (nodes) {
        try {
          nodes.source?.disconnect();
          nodes.gainNode.disconnect();
          nodes.lowEQ.disconnect();
          nodes.midEQ.disconnect();
          nodes.highEQ.disconnect();
          nodes.compressor.disconnect();
          nodes.dryGain.disconnect();
          nodes.wetGain.disconnect();
          nodes.convolver.disconnect();
          nodes.masterGain.disconnect();
        } catch (e) {
          // Nodes might already be disconnected
        }
        nodesRef.current = null;
      }
    };
  }, []);

  return {
    effects,
    isInitialized,
    initializeNodes,
    updateEQ,
    updateCompressor,
    updateReverb,
    setVolume,
    applyEQPreset,
    applyCompressorPreset,
    applyReverbPreset,
    resetEffects,
    getCompressorReduction,
    resumeContext,
    eqPresets,
    compressorPresets,
    reverbPresets,
  };
}
