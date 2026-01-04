/**
 * useStudioEffectsEngine - Audio Effects Processing Engine
 * 
 * Web Audio API effects chain for studio:
 * - EQ (3-band parametric)
 * - Compressor
 * - Reverb (convolution)
 * - Delay
 * - Filter (lowpass/highpass/bandpass)
 * 
 * Integrates with useStudioAudioEngine for track processing.
 */

import { useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type { StemEffects, EQSettings, CompressorSettings, FilterSettings } from './types';

interface EffectsChain {
  input: GainNode;
  output: GainNode;
  // EQ nodes
  lowEQ: BiquadFilterNode;
  midEQ: BiquadFilterNode;
  highEQ: BiquadFilterNode;
  // Compressor
  compressor: DynamicsCompressorNode;
  compressorBypass: GainNode;
  // Delay
  delayNode: DelayNode;
  delayFeedback: GainNode;
  delayMix: GainNode;
  delayDry: GainNode;
  // Filter
  filter: BiquadFilterNode;
  filterBypass: GainNode;
}

interface UseStudioEffectsEngineOptions {
  audioContext?: AudioContext | null;
}

interface UseStudioEffectsEngineReturn {
  /** Create effects chain for a track */
  createEffectsChain: (trackId: string) => EffectsChain | null;
  /** Update effects for a track */
  updateEffects: (trackId: string, effects: StemEffects) => void;
  /** Get effects chain for a track */
  getEffectsChain: (trackId: string) => EffectsChain | undefined;
  /** Disconnect and cleanup effects chain */
  removeEffectsChain: (trackId: string) => void;
  /** Cleanup all */
  cleanup: () => void;
}

/**
 * Default effect settings
 */
export const DEFAULT_EFFECTS: StemEffects = {
  eq: {
    lowGain: 0,
    midGain: 0,
    highGain: 0,
    lowFreq: 320,
    highFreq: 3200,
  },
  compressor: {
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    knee: 30,
    enabled: false,
  },
  reverb: {
    wetDry: 0,
    decay: 1.5,
    enabled: false,
  },
  delay: {
    time: 250,
    feedback: 0.3,
    mix: 0.2,
    sync: false,
    enabled: false,
  },
  filter: {
    type: 'lowpass',
    cutoff: 20000,
    resonance: 1,
    enabled: false,
  },
};

export function useStudioEffectsEngine({
  audioContext,
}: UseStudioEffectsEngineOptions): UseStudioEffectsEngineReturn {
  const effectsChainsRef = useRef<Map<string, EffectsChain>>(new Map());

  /**
   * Create complete effects chain for a track
   */
  const createEffectsChain = useCallback((trackId: string): EffectsChain | null => {
    if (!audioContext) {
      logger.warn('Cannot create effects chain: no AudioContext');
      return null;
    }

    // Cleanup existing
    const existing = effectsChainsRef.current.get(trackId);
    if (existing) {
      try {
        existing.input.disconnect();
        existing.output.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }

    try {
      // Input/Output gains
      const input = audioContext.createGain();
      const output = audioContext.createGain();

      // EQ - 3-band parametric
      const lowEQ = audioContext.createBiquadFilter();
      lowEQ.type = 'lowshelf';
      lowEQ.frequency.value = 320;
      lowEQ.gain.value = 0;

      const midEQ = audioContext.createBiquadFilter();
      midEQ.type = 'peaking';
      midEQ.frequency.value = 1000;
      midEQ.Q.value = 1;
      midEQ.gain.value = 0;

      const highEQ = audioContext.createBiquadFilter();
      highEQ.type = 'highshelf';
      highEQ.frequency.value = 3200;
      highEQ.gain.value = 0;

      // Compressor
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressor.knee.value = 30;

      const compressorBypass = audioContext.createGain();
      compressorBypass.gain.value = 1;

      // Delay
      const delayNode = audioContext.createDelay(1);
      delayNode.delayTime.value = 0.25;

      const delayFeedback = audioContext.createGain();
      delayFeedback.gain.value = 0.3;

      const delayMix = audioContext.createGain();
      delayMix.gain.value = 0;

      const delayDry = audioContext.createGain();
      delayDry.gain.value = 1;

      // Filter
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 20000;
      filter.Q.value = 1;

      const filterBypass = audioContext.createGain();
      filterBypass.gain.value = 1;

      // Connect chain: input -> EQ -> Compressor -> Delay -> Filter -> output
      // EQ chain
      input.connect(lowEQ);
      lowEQ.connect(midEQ);
      midEQ.connect(highEQ);

      // Compressor (with bypass)
      highEQ.connect(compressorBypass);
      highEQ.connect(compressor);
      compressor.connect(delayDry);
      compressorBypass.connect(delayDry);

      // Delay (with wet/dry mix)
      delayDry.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode); // Feedback loop
      delayNode.connect(delayMix);
      delayDry.connect(filterBypass); // Dry path
      delayMix.connect(filterBypass); // Wet path

      // Filter (with bypass) -> output
      filterBypass.connect(filter);
      filter.connect(output);
      filterBypass.connect(output); // Bypass path

      const chain: EffectsChain = {
        input,
        output,
        lowEQ,
        midEQ,
        highEQ,
        compressor,
        compressorBypass,
        delayNode,
        delayFeedback,
        delayMix,
        delayDry,
        filter,
        filterBypass,
      };

      effectsChainsRef.current.set(trackId, chain);
      logger.debug('Created effects chain', { trackId });

      return chain;
    } catch (error) {
      logger.error('Failed to create effects chain', { trackId, error });
      return null;
    }
  }, [audioContext]);

  /**
   * Update effects parameters for a track
   */
  const updateEffects = useCallback((trackId: string, effects: StemEffects) => {
    const chain = effectsChainsRef.current.get(trackId);
    if (!chain || !audioContext) return;

    const now = audioContext.currentTime;

    try {
      // Update EQ
      if (effects.eq) {
        chain.lowEQ.frequency.setTargetAtTime(effects.eq.lowFreq, now, 0.01);
        chain.lowEQ.gain.setTargetAtTime(effects.eq.lowGain, now, 0.01);
        chain.midEQ.gain.setTargetAtTime(effects.eq.midGain, now, 0.01);
        chain.highEQ.frequency.setTargetAtTime(effects.eq.highFreq, now, 0.01);
        chain.highEQ.gain.setTargetAtTime(effects.eq.highGain, now, 0.01);
      }

      // Update Compressor
      if (effects.compressor) {
        const c = effects.compressor;
        if (c.enabled) {
          chain.compressorBypass.gain.setTargetAtTime(0, now, 0.01);
          chain.compressor.threshold.setTargetAtTime(c.threshold, now, 0.01);
          chain.compressor.ratio.setTargetAtTime(c.ratio, now, 0.01);
          chain.compressor.attack.setTargetAtTime(c.attack, now, 0.01);
          chain.compressor.release.setTargetAtTime(c.release, now, 0.01);
          chain.compressor.knee.setTargetAtTime(c.knee, now, 0.01);
        } else {
          chain.compressorBypass.gain.setTargetAtTime(1, now, 0.01);
        }
      }

      // Update Delay
      if (effects.delay) {
        const d = effects.delay;
        if (d.enabled) {
          chain.delayNode.delayTime.setTargetAtTime(d.time / 1000, now, 0.01);
          chain.delayFeedback.gain.setTargetAtTime(d.feedback, now, 0.01);
          chain.delayMix.gain.setTargetAtTime(d.mix, now, 0.01);
        } else {
          chain.delayMix.gain.setTargetAtTime(0, now, 0.01);
        }
      }

      // Update Filter
      if (effects.filter) {
        const f = effects.filter;
        if (f.enabled) {
          chain.filterBypass.gain.setTargetAtTime(0, now, 0.01);
          chain.filter.type = f.type;
          chain.filter.frequency.setTargetAtTime(f.cutoff, now, 0.01);
          chain.filter.Q.setTargetAtTime(f.resonance, now, 0.01);
        } else {
          chain.filterBypass.gain.setTargetAtTime(1, now, 0.01);
        }
      }

      logger.debug('Updated effects', { trackId });
    } catch (error) {
      logger.error('Failed to update effects', { trackId, error });
    }
  }, [audioContext]);

  /**
   * Get effects chain for a track
   */
  const getEffectsChain = useCallback((trackId: string) => {
    return effectsChainsRef.current.get(trackId);
  }, []);

  /**
   * Remove effects chain for a track
   */
  const removeEffectsChain = useCallback((trackId: string) => {
    const chain = effectsChainsRef.current.get(trackId);
    if (chain) {
      try {
        chain.input.disconnect();
        chain.output.disconnect();
        chain.lowEQ.disconnect();
        chain.midEQ.disconnect();
        chain.highEQ.disconnect();
        chain.compressor.disconnect();
        chain.compressorBypass.disconnect();
        chain.delayNode.disconnect();
        chain.delayFeedback.disconnect();
        chain.delayMix.disconnect();
        chain.delayDry.disconnect();
        chain.filter.disconnect();
        chain.filterBypass.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      effectsChainsRef.current.delete(trackId);
      logger.debug('Removed effects chain', { trackId });
    }
  }, []);

  /**
   * Cleanup all effects chains
   */
  const cleanup = useCallback(() => {
    effectsChainsRef.current.forEach((_, trackId) => {
      removeEffectsChain(trackId);
    });
    effectsChainsRef.current.clear();
    logger.debug('Cleaned up all effects chains');
  }, [removeEffectsChain]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    createEffectsChain,
    updateEffects,
    getEffectsChain,
    removeEffectsChain,
    cleanup,
  };
}
