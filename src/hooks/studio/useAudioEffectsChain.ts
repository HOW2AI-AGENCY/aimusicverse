/**
 * useAudioEffectsChain - Web Audio API effects chain for real-time audio processing
 * 
 * Features:
 * - 3-band EQ (low, mid, high)
 * - Compressor with threshold, ratio, attack, release
 * - Reverb using ConvolverNode with generated impulse response
 * - Bypass toggle per effect
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { createAudioContext, ensureAudioContextRunning } from '@/lib/audio/audioContextHelper';
import { logger } from '@/lib/logger';

// Effect parameter types
export interface EQParams {
  enabled: boolean;
  lowGain: number;      // -12 to +12 dB
  midGain: number;      // -12 to +12 dB
  highGain: number;     // -12 to +12 dB
  lowFreq: number;      // 20-500 Hz
  highFreq: number;     // 2000-20000 Hz
}

export interface CompressorParams {
  enabled: boolean;
  threshold: number;    // -60 to 0 dB
  ratio: number;        // 1 to 20
  attack: number;       // 0 to 1 seconds
  release: number;      // 0 to 1 seconds
  knee: number;         // 0 to 40 dB
  makeupGain: number;   // 0 to 12 dB
}

export interface ReverbParams {
  enabled: boolean;
  wetDry: number;       // 0 to 1 (0 = dry, 1 = wet)
  decay: number;        // 0.1 to 10 seconds
  preDelay: number;     // 0 to 100 ms
}

export interface EffectsChainParams {
  eq: EQParams;
  compressor: CompressorParams;
  reverb: ReverbParams;
}

export const DEFAULT_EQ: EQParams = {
  enabled: false,
  lowGain: 0,
  midGain: 0,
  highGain: 0,
  lowFreq: 320,
  highFreq: 3200,
};

export const DEFAULT_COMPRESSOR: CompressorParams = {
  enabled: false,
  threshold: -24,
  ratio: 4,
  attack: 0.003,
  release: 0.25,
  knee: 30,
  makeupGain: 0,
};

export const DEFAULT_REVERB: ReverbParams = {
  enabled: false,
  wetDry: 0.3,
  decay: 2,
  preDelay: 20,
};

export const DEFAULT_EFFECTS_CHAIN: EffectsChainParams = {
  eq: DEFAULT_EQ,
  compressor: DEFAULT_COMPRESSOR,
  reverb: DEFAULT_REVERB,
};

interface EffectsNodes {
  lowShelf: BiquadFilterNode;
  midPeak: BiquadFilterNode;
  highShelf: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  makeupGain: GainNode;
  convolver: ConvolverNode;
  dryGain: GainNode;
  wetGain: GainNode;
  inputGain: GainNode;
  outputGain: GainNode;
}

interface UseAudioEffectsChainReturn {
  // Connect source to effects chain
  connectSource: (source: AudioNode) => void;
  
  // Get output node to connect to destination
  getOutput: () => AudioNode | null;
  
  // Update effect parameters
  updateEQ: (params: Partial<EQParams>) => void;
  updateCompressor: (params: Partial<CompressorParams>) => void;
  updateReverb: (params: Partial<ReverbParams>) => void;
  updateAll: (params: Partial<EffectsChainParams>) => void;
  
  // Current state
  params: EffectsChainParams;
  isInitialized: boolean;
  
  // Disconnect and cleanup
  disconnect: () => void;
}

/**
 * Generate an impulse response for reverb
 */
function generateImpulseResponse(
  context: AudioContext,
  duration: number,
  decay: number,
  preDelay: number
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const preDelaySamples = Math.floor((preDelay / 1000) * sampleRate);
  const impulse = context.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    
    for (let i = 0; i < length; i++) {
      if (i < preDelaySamples) {
        channelData[i] = 0;
      } else {
        const t = (i - preDelaySamples) / sampleRate;
        // Exponential decay with noise
        const envelope = Math.exp(-t / decay);
        // Random noise with slight stereo variation
        channelData[i] = (Math.random() * 2 - 1) * envelope;
      }
    }
  }
  
  return impulse;
}

export function useAudioEffectsChain(): UseAudioEffectsChainReturn {
  const [params, setParams] = useState<EffectsChainParams>(DEFAULT_EFFECTS_CHAIN);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<EffectsNodes | null>(null);
  const sourceConnectedRef = useRef(false);

  // Initialize the effects chain
  const initialize = useCallback(async () => {
    if (nodesRef.current) return;

    try {
      const ctx = createAudioContext();
      await ensureAudioContextRunning(ctx);
      audioContextRef.current = ctx;

      // Create nodes
      const inputGain = ctx.createGain();
      const outputGain = ctx.createGain();
      
      // EQ: Low shelf, Mid peak, High shelf
      const lowShelf = ctx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = params.eq.lowFreq;
      lowShelf.gain.value = params.eq.enabled ? params.eq.lowGain : 0;
      
      const midPeak = ctx.createBiquadFilter();
      midPeak.type = 'peaking';
      midPeak.frequency.value = 1000; // Center of mid range
      midPeak.Q.value = 0.7;
      midPeak.gain.value = params.eq.enabled ? params.eq.midGain : 0;
      
      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = params.eq.highFreq;
      highShelf.gain.value = params.eq.enabled ? params.eq.highGain : 0;
      
      // Compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = params.compressor.threshold;
      compressor.ratio.value = params.compressor.ratio;
      compressor.attack.value = params.compressor.attack;
      compressor.release.value = params.compressor.release;
      compressor.knee.value = params.compressor.knee;
      
      const makeupGain = ctx.createGain();
      makeupGain.gain.value = params.compressor.enabled 
        ? Math.pow(10, params.compressor.makeupGain / 20) 
        : 1;
      
      // Reverb with wet/dry mix
      const convolver = ctx.createConvolver();
      const impulse = generateImpulseResponse(ctx, params.reverb.decay + 0.5, params.reverb.decay, params.reverb.preDelay);
      convolver.buffer = impulse;
      
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      
      dryGain.gain.value = params.reverb.enabled ? 1 - params.reverb.wetDry : 1;
      wetGain.gain.value = params.reverb.enabled ? params.reverb.wetDry : 0;
      
      // Connect the chain:
      // Input -> EQ (low -> mid -> high) -> Compressor -> MakeupGain -> Split to Dry and Reverb -> Output
      
      inputGain.connect(lowShelf);
      lowShelf.connect(midPeak);
      midPeak.connect(highShelf);
      highShelf.connect(compressor);
      compressor.connect(makeupGain);
      
      // Split for reverb
      makeupGain.connect(dryGain);
      makeupGain.connect(convolver);
      convolver.connect(wetGain);
      
      // Mix to output
      dryGain.connect(outputGain);
      wetGain.connect(outputGain);
      
      nodesRef.current = {
        lowShelf,
        midPeak,
        highShelf,
        compressor,
        makeupGain,
        convolver,
        dryGain,
        wetGain,
        inputGain,
        outputGain,
      };
      
      setIsInitialized(true);
      logger.info('Audio effects chain initialized');
    } catch (error) {
      logger.error('Failed to initialize audio effects chain', error);
    }
  }, []);

  // Connect a source node
  const connectSource = useCallback((source: AudioNode) => {
    if (!nodesRef.current) {
      initialize().then(() => {
        if (nodesRef.current) {
          source.connect(nodesRef.current.inputGain);
          sourceConnectedRef.current = true;
        }
      });
    } else {
      source.connect(nodesRef.current.inputGain);
      sourceConnectedRef.current = true;
    }
  }, [initialize]);

  // Get output node
  const getOutput = useCallback((): AudioNode | null => {
    return nodesRef.current?.outputGain || null;
  }, []);

  // Update EQ parameters
  const updateEQ = useCallback((updates: Partial<EQParams>) => {
    setParams(prev => {
      const newEQ = { ...prev.eq, ...updates };
      
      if (nodesRef.current && audioContextRef.current) {
        const nodes = nodesRef.current;
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        
        nodes.lowShelf.frequency.setTargetAtTime(newEQ.lowFreq, now, 0.01);
        nodes.lowShelf.gain.setTargetAtTime(newEQ.enabled ? newEQ.lowGain : 0, now, 0.01);
        
        nodes.midPeak.gain.setTargetAtTime(newEQ.enabled ? newEQ.midGain : 0, now, 0.01);
        
        nodes.highShelf.frequency.setTargetAtTime(newEQ.highFreq, now, 0.01);
        nodes.highShelf.gain.setTargetAtTime(newEQ.enabled ? newEQ.highGain : 0, now, 0.01);
      }
      
      return { ...prev, eq: newEQ };
    });
  }, []);

  // Update compressor parameters
  const updateCompressor = useCallback((updates: Partial<CompressorParams>) => {
    setParams(prev => {
      const newComp = { ...prev.compressor, ...updates };
      
      if (nodesRef.current && audioContextRef.current) {
        const nodes = nodesRef.current;
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        
        nodes.compressor.threshold.setTargetAtTime(newComp.threshold, now, 0.01);
        nodes.compressor.ratio.setTargetAtTime(newComp.ratio, now, 0.01);
        nodes.compressor.attack.setTargetAtTime(newComp.attack, now, 0.01);
        nodes.compressor.release.setTargetAtTime(newComp.release, now, 0.01);
        nodes.compressor.knee.setTargetAtTime(newComp.knee, now, 0.01);
        
        const makeupLinear = newComp.enabled ? Math.pow(10, newComp.makeupGain / 20) : 1;
        nodes.makeupGain.gain.setTargetAtTime(makeupLinear, now, 0.01);
      }
      
      return { ...prev, compressor: newComp };
    });
  }, []);

  // Update reverb parameters
  const updateReverb = useCallback((updates: Partial<ReverbParams>) => {
    setParams(prev => {
      const newReverb = { ...prev.reverb, ...updates };
      
      if (nodesRef.current && audioContextRef.current) {
        const nodes = nodesRef.current;
        const ctx = audioContextRef.current;
        const now = ctx.currentTime;
        
        // Update wet/dry mix
        nodes.dryGain.gain.setTargetAtTime(newReverb.enabled ? 1 - newReverb.wetDry : 1, now, 0.01);
        nodes.wetGain.gain.setTargetAtTime(newReverb.enabled ? newReverb.wetDry : 0, now, 0.01);
        
        // Regenerate impulse response if decay changed
        if (updates.decay !== undefined || updates.preDelay !== undefined) {
          const impulse = generateImpulseResponse(ctx, newReverb.decay + 0.5, newReverb.decay, newReverb.preDelay);
          nodes.convolver.buffer = impulse;
        }
      }
      
      return { ...prev, reverb: newReverb };
    });
  }, []);

  // Update all parameters at once
  const updateAll = useCallback((updates: Partial<EffectsChainParams>) => {
    if (updates.eq) updateEQ(updates.eq);
    if (updates.compressor) updateCompressor(updates.compressor);
    if (updates.reverb) updateReverb(updates.reverb);
  }, [updateEQ, updateCompressor, updateReverb]);

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    if (nodesRef.current) {
      const nodes = nodesRef.current;
      
      nodes.inputGain.disconnect();
      nodes.lowShelf.disconnect();
      nodes.midPeak.disconnect();
      nodes.highShelf.disconnect();
      nodes.compressor.disconnect();
      nodes.makeupGain.disconnect();
      nodes.convolver.disconnect();
      nodes.dryGain.disconnect();
      nodes.wetGain.disconnect();
      nodes.outputGain.disconnect();
      
      nodesRef.current = null;
      sourceConnectedRef.current = false;
      setIsInitialized(false);
      
      logger.info('Audio effects chain disconnected');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectSource,
    getOutput,
    updateEQ,
    updateCompressor,
    updateReverb,
    updateAll,
    params,
    isInitialized,
    disconnect,
  };
}
