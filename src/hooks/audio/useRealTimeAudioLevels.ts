/**
 * useRealTimeAudioLevels - Real-time audio level metering via Web Audio API
 * 
 * Features:
 * - Peak and RMS level detection
 * - Clipping detection
 * - Multi-channel support
 * - Configurable decay rates
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface AudioLevels {
  peak: number;      // 0-1, instantaneous peak
  rms: number;       // 0-1, RMS (perceived loudness)
  peakDb: number;    // dB value (-Infinity to 0)
  rmsDb: number;     // dB value
  isClipping: boolean;
  leftPeak?: number;
  rightPeak?: number;
}

export interface UseRealTimeAudioLevelsOptions {
  audioContext?: AudioContext;
  sourceNode?: AudioNode | null;
  fftSize?: number;
  smoothingTimeConstant?: number;
  peakDecayRate?: number;      // How fast peak meter decays (0-1)
  clipThreshold?: number;       // dB threshold for clipping detection
  enabled?: boolean;
  updateInterval?: number;      // ms between updates
}

const DEFAULT_OPTIONS: Required<Omit<UseRealTimeAudioLevelsOptions, 'audioContext' | 'sourceNode'>> = {
  fftSize: 256,
  smoothingTimeConstant: 0.3,
  peakDecayRate: 0.95,
  clipThreshold: -0.5,
  enabled: true,
  updateInterval: 50,
};

export function useRealTimeAudioLevels({
  audioContext,
  sourceNode,
  fftSize = DEFAULT_OPTIONS.fftSize,
  smoothingTimeConstant = DEFAULT_OPTIONS.smoothingTimeConstant,
  peakDecayRate = DEFAULT_OPTIONS.peakDecayRate,
  clipThreshold = DEFAULT_OPTIONS.clipThreshold,
  enabled = DEFAULT_OPTIONS.enabled,
  updateInterval = DEFAULT_OPTIONS.updateInterval,
}: UseRealTimeAudioLevelsOptions = {}): AudioLevels {
  const [levels, setLevels] = useState<AudioLevels>({
    peak: 0,
    rms: 0,
    peakDb: -Infinity,
    rmsDb: -Infinity,
    isClipping: false,
  });

  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const peakHoldRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  // Linear to dB conversion
  const linearToDb = useCallback((value: number): number => {
    if (value <= 0) return -Infinity;
    return 20 * Math.log10(value);
  }, []);

  // Calculate RMS from time domain data
  const calculateRms = useCallback((dataArray: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    return Math.sqrt(sum / dataArray.length);
  }, []);

  // Calculate peak from time domain data
  const calculatePeak = useCallback((dataArray: Float32Array): number => {
    let peak = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const absValue = Math.abs(dataArray[i]);
      if (absValue > peak) {
        peak = absValue;
      }
    }
    return peak;
  }, []);

  // Setup analyser when audio context and source change
  useEffect(() => {
    if (!enabled || !audioContext || !sourceNode) {
      analyserRef.current = null;
      dataArrayRef.current = null;
      return;
    }

    try {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
      
      sourceNode.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Float32Array(analyser.fftSize);
      
      logger.debug('RealTimeAudioLevels: Analyser connected', { fftSize });

      return () => {
        try {
          sourceNode.disconnect(analyser);
        } catch {
          // Ignore disconnect errors
        }
      };
    } catch (error) {
      logger.error('RealTimeAudioLevels: Failed to create analyser', error);
    }
  }, [audioContext, sourceNode, enabled, fftSize, smoothingTimeConstant]);

  // Animation loop for level updates
  useEffect(() => {
    if (!enabled || !analyserRef.current || !dataArrayRef.current) {
      return;
    }

    const updateLevels = () => {
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      
      if (!analyser || !dataArray) return;

      const now = performance.now();
      if (now - lastUpdateRef.current < updateInterval) {
        animationFrameRef.current = requestAnimationFrame(updateLevels);
        return;
      }
      lastUpdateRef.current = now;

      // Get time domain data (create fresh buffer to avoid type issues)
      const timeDomainData = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(timeDomainData);

      // Calculate levels
      const currentPeak = calculatePeak(timeDomainData);
      const currentRms = calculateRms(timeDomainData);

      // Apply peak hold with decay
      if (currentPeak > peakHoldRef.current) {
        peakHoldRef.current = currentPeak;
      } else {
        peakHoldRef.current *= peakDecayRate;
      }

      const peakDb = linearToDb(peakHoldRef.current);
      const rmsDb = linearToDb(currentRms);

      setLevels({
        peak: Math.min(1, peakHoldRef.current),
        rms: Math.min(1, currentRms),
        peakDb,
        rmsDb,
        isClipping: peakDb >= clipThreshold,
      });

      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animationFrameRef.current = requestAnimationFrame(updateLevels);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    enabled,
    updateInterval,
    peakDecayRate,
    clipThreshold,
    calculatePeak,
    calculateRms,
    linearToDb,
  ]);

  return levels;
}

/**
 * Hook for tracking multiple audio sources
 */
export interface MultiTrackLevels {
  [trackId: string]: AudioLevels;
}

export interface UseMultiTrackLevelsOptions {
  audioContext?: AudioContext;
  trackSources: Record<string, AudioNode | null>;
  enabled?: boolean;
  fftSize?: number;
}

export function useMultiTrackLevels({
  audioContext,
  trackSources,
  enabled = true,
  fftSize = 256,
}: UseMultiTrackLevelsOptions): MultiTrackLevels {
  const [levels, setLevels] = useState<MultiTrackLevels>({});
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());
  const dataArraysRef = useRef<Map<string, Float32Array>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const peakHoldsRef = useRef<Map<string, number>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      analysersRef.current.clear();
      dataArraysRef.current.clear();
      peakHoldsRef.current.clear();
    };
  }, []);

  // Setup analysers for each track
  useEffect(() => {
    if (!enabled || !audioContext) {
      return;
    }

    const trackIds = Object.keys(trackSources);
    
    // Add new analysers
    trackIds.forEach(trackId => {
      const source = trackSources[trackId];
      if (!source || analysersRef.current.has(trackId)) return;

      try {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = 0.3;
        
        source.connect(analyser);
        
        analysersRef.current.set(trackId, analyser);
        dataArraysRef.current.set(trackId, new Float32Array(analyser.fftSize));
        peakHoldsRef.current.set(trackId, 0);
      } catch (error) {
        logger.error('MultiTrackLevels: Failed to create analyser', { trackId, error });
      }
    });

    // Remove old analysers
    analysersRef.current.forEach((analyser, trackId) => {
      if (!trackSources[trackId]) {
        analysersRef.current.delete(trackId);
        dataArraysRef.current.delete(trackId);
        peakHoldsRef.current.delete(trackId);
      }
    });
  }, [audioContext, trackSources, enabled, fftSize]);

  // Animation loop
  useEffect(() => {
    if (!enabled || analysersRef.current.size === 0) {
      return;
    }

    const peakDecayRate = 0.95;
    const clipThreshold = -0.5;

    const updateLevels = () => {
      const newLevels: MultiTrackLevels = {};

      analysersRef.current.forEach((analyser, trackId) => {
        // Create fresh buffer to avoid type issues
        const timeDomainData = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(timeDomainData);

        // Calculate peak
        let currentPeak = 0;
        let sum = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const absValue = Math.abs(timeDomainData[i]);
          if (absValue > currentPeak) currentPeak = absValue;
          sum += timeDomainData[i] * timeDomainData[i];
        }
        const currentRms = Math.sqrt(sum / timeDomainData.length);

        // Peak hold with decay
        let peakHold = peakHoldsRef.current.get(trackId) || 0;
        if (currentPeak > peakHold) {
          peakHold = currentPeak;
        } else {
          peakHold *= peakDecayRate;
        }
        peakHoldsRef.current.set(trackId, peakHold);

        const peakDb = peakHold > 0 ? 20 * Math.log10(peakHold) : -Infinity;
        const rmsDb = currentRms > 0 ? 20 * Math.log10(currentRms) : -Infinity;

        newLevels[trackId] = {
          peak: Math.min(1, peakHold),
          rms: Math.min(1, currentRms),
          peakDb,
          rmsDb,
          isClipping: peakDb >= clipThreshold,
        };
      });

      setLevels(newLevels);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    animationFrameRef.current = requestAnimationFrame(updateLevels);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled]);

  return levels;
}
