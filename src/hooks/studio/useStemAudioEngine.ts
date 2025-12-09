/**
 * Stem Audio Engine Hook
 * 
 * Manages Web Audio API nodes for stem processing with effects chain:
 * Source → Gain → EQ (Low/Mid/High) → Compressor → Convolver (Reverb) → Master
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

// Shared AudioContext singleton
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContext();
  }
  return sharedAudioContext;
}

export interface EQSettings {
  lowGain: number;      // -12 to +12 dB
  midGain: number;      // -12 to +12 dB
  highGain: number;     // -12 to +12 dB
  lowFreq: number;      // Hz (default 320)
  highFreq: number;     // Hz (default 3200)
}

export interface CompressorSettings {
  threshold: number;    // -100 to 0 dB
  ratio: number;        // 1 to 20
  attack: number;       // 0 to 1 seconds
  release: number;      // 0 to 1 seconds
  knee: number;         // 0 to 40 dB
  enabled: boolean;
}

export interface ReverbSettings {
  wetDry: number;       // 0 to 1 (dry to wet)
  decay: number;        // 0.1 to 10 seconds
  enabled: boolean;
}

export interface StemEffects {
  eq: EQSettings;
  compressor: CompressorSettings;
  reverb: ReverbSettings;
}

export const defaultEQSettings: EQSettings = {
  lowGain: 0,
  midGain: 0,
  highGain: 0,
  lowFreq: 320,
  highFreq: 3200,
};

export const defaultCompressorSettings: CompressorSettings = {
  threshold: -24,
  ratio: 4,
  attack: 0.003,
  release: 0.25,
  knee: 30,
  enabled: false,
};

export const defaultReverbSettings: ReverbSettings = {
  wetDry: 0.3,
  decay: 2,
  enabled: false,
};

export const defaultStemEffects: StemEffects = {
  eq: defaultEQSettings,
  compressor: defaultCompressorSettings,
  reverb: defaultReverbSettings,
};

// Effect presets
export const eqPresets = {
  flat: { lowGain: 0, midGain: 0, highGain: 0, lowFreq: 320, highFreq: 3200 },
  warm: { lowGain: 3, midGain: -1, highGain: -2, lowFreq: 320, highFreq: 3200 },
  bright: { lowGain: -2, midGain: 0, highGain: 4, lowFreq: 320, highFreq: 3200 },
  bass_boost: { lowGain: 6, midGain: 0, highGain: 0, lowFreq: 320, highFreq: 3200 },
  vocal_presence: { lowGain: -2, midGain: 3, highGain: 2, lowFreq: 320, highFreq: 3200 },
  scoop: { lowGain: 3, midGain: -4, highGain: 3, lowFreq: 320, highFreq: 3200 },
};

export const compressorPresets = {
  off: { ...defaultCompressorSettings, enabled: false },
  gentle: { threshold: -20, ratio: 2, attack: 0.01, release: 0.3, knee: 30, enabled: true },
  moderate: { threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 20, enabled: true },
  heavy: { threshold: -30, ratio: 8, attack: 0.001, release: 0.1, knee: 10, enabled: true },
  vocals: { threshold: -18, ratio: 3, attack: 0.005, release: 0.2, knee: 25, enabled: true },
  drums: { threshold: -20, ratio: 6, attack: 0.001, release: 0.15, knee: 15, enabled: true },
};

export const reverbPresets = {
  off: { wetDry: 0, decay: 2, enabled: false },
  room: { wetDry: 0.2, decay: 0.8, enabled: true },
  hall: { wetDry: 0.35, decay: 2.5, enabled: true },
  plate: { wetDry: 0.4, decay: 1.5, enabled: true },
  ambient: { wetDry: 0.5, decay: 4, enabled: true },
};

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
