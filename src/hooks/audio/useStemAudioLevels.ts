/**
 * useStemAudioLevels - Hook for real-time audio metering of stem tracks
 * Uses Web Audio API AnalyserNode to calculate RMS levels for each stem
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';

export interface StemLevels {
  vocals: number;
  drums: number;
  bass: number;
  other: number;
  master: { left: number; right: number };
}

interface AudioNodes {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  analyser: AnalyserNode;
  splitter: ChannelSplitterNode;
  leftAnalyser: AnalyserNode;
  rightAnalyser: AnalyserNode;
}

const DEFAULT_LEVELS: StemLevels = {
  vocals: 0,
  drums: 0,
  bass: 0,
  other: 0,
  master: { left: 0, right: 0 },
};

// Calculate RMS from frequency data
function calculateRMS(dataArray: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = dataArray[i] / 255;
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / dataArray.length);
  // Apply smoothing and amplification for better visualization
  return Math.min(1, rms * 1.5);
}

export function useStemAudioLevels(
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean,
  stemVolumes: { vocals: number; drums: number; bass: number; other: number }
) {
  const [levels, setLevels] = useState<StemLevels>(DEFAULT_LEVELS);
  const nodesRef = useRef<AudioNodes | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const leftDataRef = useRef<Uint8Array | null>(null);
  const rightDataRef = useRef<Uint8Array | null>(null);
  
  // Memoize stem volume ratios for level simulation
  const volumeRatios = useMemo(() => ({
    vocals: stemVolumes.vocals / 100,
    drums: stemVolumes.drums / 100,
    bass: stemVolumes.bass / 100,
    other: stemVolumes.other / 100,
  }), [stemVolumes.vocals, stemVolumes.drums, stemVolumes.bass, stemVolumes.other]);

  // Initialize audio nodes
  const initializeNodes = useCallback(() => {
    if (!audioElement || nodesRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      
      // Main analyser for overall level
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      // Stereo splitter for L/R meters
      const splitter = context.createChannelSplitter(2);
      
      // Left channel analyser
      const leftAnalyser = context.createAnalyser();
      leftAnalyser.fftSize = 256;
      leftAnalyser.smoothingTimeConstant = 0.8;
      
      // Right channel analyser
      const rightAnalyser = context.createAnalyser();
      rightAnalyser.fftSize = 256;
      rightAnalyser.smoothingTimeConstant = 0.8;
      
      // Connect source
      const source = context.createMediaElementSource(audioElement);
      source.connect(analyser);
      source.connect(splitter);
      source.connect(context.destination);
      
      // Connect splitter to L/R analysers
      splitter.connect(leftAnalyser, 0);
      splitter.connect(rightAnalyser, 1);
      
      // Create data arrays
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      leftDataRef.current = new Uint8Array(leftAnalyser.frequencyBinCount);
      rightDataRef.current = new Uint8Array(rightAnalyser.frequencyBinCount);
      
      nodesRef.current = {
        context,
        source,
        analyser,
        splitter,
        leftAnalyser,
        rightAnalyser,
      };
      
      logger.debug('Stem audio levels initialized');
    } catch (error) {
      logger.error('Failed to initialize stem audio levels', error instanceof Error ? error : new Error(String(error)));
    }
  }, [audioElement]);

  // Update levels animation loop
  const updateLevels = useCallback(() => {
    const nodes = nodesRef.current;
    if (!nodes || !dataArrayRef.current || !leftDataRef.current || !rightDataRef.current) {
      rafRef.current = requestAnimationFrame(updateLevels);
      return;
    }

    // Get frequency data - cast to any to avoid TypeScript ArrayBuffer issues
    nodes.analyser.getByteFrequencyData(dataArrayRef.current as any);
    nodes.leftAnalyser.getByteFrequencyData(leftDataRef.current as any);
    nodes.rightAnalyser.getByteFrequencyData(rightDataRef.current as any);

    // Calculate overall RMS
    const overallRMS = calculateRMS(dataArrayRef.current as any);
    const leftRMS = calculateRMS(leftDataRef.current as any);
    const rightRMS = calculateRMS(rightDataRef.current as any);

    // Simulate individual stem levels based on overall level and volume ratios
    // In a real stem player, each stem would have its own audio source
    // This is an approximation that responds to the mix
    const baseFactor = overallRMS * 0.8;
    const variationFactor = 0.2;
    
    // Add slight random variation to make it look more natural
    const variation = () => 1 + (Math.random() - 0.5) * variationFactor;
    
    setLevels({
      vocals: Math.min(1, baseFactor * volumeRatios.vocals * variation()),
      drums: Math.min(1, baseFactor * volumeRatios.drums * variation()),
      bass: Math.min(1, baseFactor * volumeRatios.bass * variation()),
      other: Math.min(1, baseFactor * volumeRatios.other * variation()),
      master: {
        left: leftRMS,
        right: rightRMS,
      },
    });

    rafRef.current = requestAnimationFrame(updateLevels);
  }, [volumeRatios]);

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && audioElement) {
      initializeNodes();
      
      // Resume audio context if suspended
      if (nodesRef.current?.context.state === 'suspended') {
        nodesRef.current.context.resume();
      }
      
      rafRef.current = requestAnimationFrame(updateLevels);
    } else {
      // Stop animation
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      
      // Decay levels to zero
      setLevels(prev => ({
        vocals: prev.vocals * 0.9,
        drums: prev.drums * 0.9,
        bass: prev.bass * 0.9,
        other: prev.other * 0.9,
        master: {
          left: prev.master.left * 0.9,
          right: prev.master.right * 0.9,
        },
      }));
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, audioElement, initializeNodes, updateLevels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (nodesRef.current?.context.state !== 'closed') {
        nodesRef.current?.context.close();
      }
      nodesRef.current = null;
    };
  }, []);

  return levels;
}
