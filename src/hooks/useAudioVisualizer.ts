/**
 * Audio Visualizer Hook
 * 
 * Provides audio frequency data for visualization.
 * Uses Web Audio API AnalyserNode.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

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

// Singleton AudioContext
let audioContext: AudioContext | null = null;

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

  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  
  const [data, setData] = useState<VisualizerData>({
    frequencies: new Array(barCount).fill(0),
    waveform: new Array(barCount).fill(0.5),
    average: 0,
    peak: 0,
  });

  // Initialize audio context and analyser
  const initializeAnalyser = useCallback(() => {
    if (!audioElement) return null;

    try {
      // Create or reuse audio context
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Only reconnect if audio element changed
      if (connectedElementRef.current !== audioElement) {
        // Cleanup old connections
        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch (e) {
            // Ignore
          }
        }

        // Create new analyser
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = fftSize;
        analyserRef.current.smoothingTimeConstant = smoothing;

        // Connect source
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);

        connectedElementRef.current = audioElement;
      }

      return analyserRef.current;
    } catch (error) {
      logger.error('Failed to initialize audio analyser', error);
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

    const analyser = initializeAnalyser();
    
    // Fallback animation if analyser unavailable
    if (!analyser) {
      const fakeAnimate = () => {
        if (!isPlaying) return;
        
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
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    const bufferLength = analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    const animate = () => {
      if (!isPlaying) return;

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

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, initializeAnalyser, barCount]);

  return data;
}
