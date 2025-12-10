/**
 * Audio Visualizer Hook
 * 
 * Provides audio frequency data for visualization.
 * Uses Web Audio API AnalyserNode.
 * 
 * IMPORTANT: MediaElementSourceNode can only be created once per audio element.
 * This hook uses the centralized audioContextManager to prevent conflicts.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import {
  resumeAudioContext,
  getOrCreateAudioNodes,
  ensureAudioRoutedToDestination,
} from '@/lib/audioContextManager';

/**
 * Re-export resumeAudioContext from the centralized manager
 */
export { resumeAudioContext } from '@/lib/audioContextManager';

interface UseAudioVisualizerOptions {
  barCount?: number;
  smoothing?: number;
  fftSize?: number;
}

interface VisualizerData {
  frequencies: number[];
  waveform: number[];
  average: number;
  peak: number;
}

export function useAudioVisualizer(
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean,
  options: UseAudioVisualizerOptions = {}
) {
  const {
    barCount = 32,
    smoothing = 0.8,
    fftSize = 128,
  } = options;

  const animationRef = useRef<number | null>(null);
  
  const [data, setData] = useState<VisualizerData>({
    frequencies: new Array(barCount).fill(0),
    waveform: new Array(barCount).fill(0.5),
    average: 0,
    peak: 0,
  });

  // Get analyser node using centralized manager
  const getAnalyser = useCallback(async () => {
    if (!audioElement) return null;
    
    try {
      const nodes = await getOrCreateAudioNodes(audioElement, fftSize, smoothing);
      return nodes?.analyser || null;
    } catch (err) {
      logger.warn('Failed to get audio nodes', err);
      // Ensure audio is still routed even if visualizer fails
      ensureAudioRoutedToDestination();
      return null;
    }
  }, [audioElement, fftSize, smoothing]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      // Decay frequencies when paused
      setData(prev => ({
        ...prev,
        frequencies: prev.frequencies.map(f => f * 0.92),
        average: prev.average * 0.92,
        peak: prev.peak * 0.95,
      }));
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Initialize analyser asynchronously
    let analyser: AnalyserNode | null = null;
    let isActive = true;
    
    const initAnalyser = async () => {
      if (!isActive) return;
      
      try {
        analyser = await getAnalyser();
      } catch (err) {
        logger.warn('Failed to get analyser, using fallback', err);
        analyser = null;
      }
      
      if (!isActive) return; // Effect cleanup happened during await
      
      // Fallback animation if analyser unavailable
      if (!analyser) {
        const fakeAnimate = () => {
          if (!isPlaying || !isActive) return;
          
          const time = Date.now() / 1000;
          const fakeFreqs = new Array(barCount).fill(0).map((_, i) => {
            const base = Math.sin(time * 2 + i * 0.3) * 0.3 + 0.4;
            const noise = Math.random() * 0.2;
            return Math.min(1, Math.max(0.05, base + noise));
          });
          
          const avg = fakeFreqs.reduce((a, b) => a + b, 0) / barCount;
          const peak = Math.max(...fakeFreqs);
          
          setData({
            frequencies: fakeFreqs,
            waveform: fakeFreqs.map(f => 0.5 + (f - 0.5) * 0.5),
            average: avg,
            peak,
          });
          
          animationRef.current = requestAnimationFrame(fakeAnimate);
        };
        
        fakeAnimate();
        return;
      }

      // Real analyser animation
      const bufferLength = analyser.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      const timeDomainData = new Uint8Array(bufferLength);

      const animate = () => {
        if (!isPlaying || !isActive || !analyser) return;

        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeDomainData);

        // Sample frequencies
        const step = Math.max(1, Math.floor(bufferLength / barCount));
        const frequencies: number[] = [];
        
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            const idx = i * step + j;
            if (idx < bufferLength) {
              sum += frequencyData[idx];
            }
          }
          frequencies.push(Math.min(1, (sum / step / 255) * 1.3));
        }

        // Sample waveform
        const waveStep = Math.floor(bufferLength / barCount);
        const waveform = new Array(barCount).fill(0).map((_, i) => {
          const idx = i * waveStep;
          return (timeDomainData[idx] || 128) / 255;
        });

        const average = frequencies.reduce((a, b) => a + b, 0) / barCount;
        const peak = Math.max(...frequencies);

        setData({ frequencies, waveform, average, peak });
        
        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    };
    
    initAnalyser();

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, getAnalyser, barCount]);

  return data;
}
