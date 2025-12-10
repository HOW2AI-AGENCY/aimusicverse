/**
 * Audio Visualizer Hook
 * 
 * Provides audio frequency data for visualization.
 * Uses Web Audio API AnalyserNode.
 * 
 * IMPORTANT: MediaElementSourceNode can only be created once per audio element.
 * This hook manages a global source node to prevent crashes on re-renders.
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

// Singleton AudioContext and source node tracking
let audioContext: AudioContext | null = null;
let globalSourceNode: MediaElementAudioSourceNode | null = null;
let globalAnalyserNode: AnalyserNode | null = null;
let connectedAudioElement: HTMLAudioElement | null = null;

/**
 * Get or create the global audio source and analyser nodes
 * This ensures we only call createMediaElementSource once per audio element
 */
function getOrCreateAudioNodes(audioElement: HTMLAudioElement, fftSize: number, smoothing: number) {
  try {
    // Create AudioContext if needed
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      logger.debug('AudioContext created for visualizer');
    }

    // Resume if suspended (required for user interaction policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch((err) => {
        logger.warn('AudioContext resume failed', err);
      });
    }

    // Check if already connected to this element
    if (connectedAudioElement === audioElement && globalSourceNode && globalAnalyserNode) {
      // Verify the connection is still valid
      try {
        // Update analyser settings if needed
        globalAnalyserNode.fftSize = fftSize;
        globalAnalyserNode.smoothingTimeConstant = smoothing;
        logger.debug('Audio visualizer reusing existing connection');
        return globalAnalyserNode;
      } catch (err) {
        logger.warn('Existing connection invalid, recreating', err);
        // Fall through to recreate connection
        globalSourceNode = null;
        globalAnalyserNode = null;
        connectedAudioElement = null;
      }
    }

    // If connected to different element, we cannot reconnect (Web Audio limitation)
    // Just return null and use fallback animation
    if (connectedAudioElement && connectedAudioElement !== audioElement) {
      logger.warn('Audio visualizer already connected to different element, using fallback');
      return null;
    }

    // Create new connection
    logger.debug('Creating new audio visualizer connection');
    globalAnalyserNode = audioContext.createAnalyser();
    globalAnalyserNode.fftSize = fftSize;
    globalAnalyserNode.smoothingTimeConstant = smoothing;

    // Try to create source node - this can only be done once per audio element
    try {
      globalSourceNode = audioContext.createMediaElementSource(audioElement);
      globalSourceNode.connect(globalAnalyserNode);
      globalAnalyserNode.connect(audioContext.destination);
      
      connectedAudioElement = audioElement;
      logger.debug('Audio visualizer successfully connected to element');
      
      return globalAnalyserNode;
    } catch (sourceError) {
      // If source creation fails because element already has a source,
      // the audio is still playing through that existing source
      if (sourceError instanceof Error && sourceError.message.includes('already been attached')) {
        logger.warn('Audio element already has a source node - audio will play without visualizer');
        // Return null to use fallback visualization
        // Audio playback is NOT affected - it continues through existing connection
        return null;
      }
      throw sourceError; // Re-throw unexpected errors
    }
  } catch (error) {
    logger.error('Failed to initialize audio analyser', error);
    // Return null to use fallback - audio playback continues through default output
    return null;
  }
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

  // Get analyser node
  const getAnalyser = useCallback(() => {
    if (!audioElement) return null;
    return getOrCreateAudioNodes(audioElement, fftSize, smoothing);
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

    const analyser = getAnalyser();
    
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
  }, [isPlaying, getAnalyser, barCount]);

  return data;
}
