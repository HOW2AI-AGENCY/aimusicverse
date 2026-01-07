/**
 * useStemAnalyzer - Real-time audio analysis for stems
 * 
 * Provides:
 * - RMS level metering
 * - Peak detection
 * - Frequency analysis (optional)
 * 
 * Uses Web Audio API AnalyserNode for efficient analysis.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { getStudioContext } from '@/lib/audio/audioContextHelper';

interface StemLevels {
  rms: number;
  peak: number;
  clipping: boolean;
}

interface UseStemAnalyzerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  updateInterval?: number;
}

interface UseStemAnalyzerReturn {
  levels: StemLevels;
  isAnalyzing: boolean;
  connect: (audioElement: HTMLAudioElement) => void;
  disconnect: () => void;
  getFrequencyData: () => Uint8Array | null;
}

const DEFAULT_OPTIONS: Required<UseStemAnalyzerOptions> = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  updateInterval: 50, // ms
};

export function useStemAnalyzer(
  options: UseStemAnalyzerOptions = {}
): UseStemAnalyzerReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [levels, setLevels] = useState<StemLevels>({
    rms: 0,
    peak: 0,
    clipping: false,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // Already disconnected
      }
      sourceRef.current = null;
    }
    
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {
        // Already disconnected
      }
      analyserRef.current = null;
    }
    
    connectedElementRef.current = null;
    dataArrayRef.current = null;
    setIsAnalyzing(false);
  }, []);

  // Connect to audio element
  const connect = useCallback((audioElement: HTMLAudioElement) => {
    // Skip if already connected to this element
    if (connectedElementRef.current === audioElement) return;
    
    // Cleanup previous connection
    cleanup();
    
    try {
      const audioContext = getStudioContext();
      if (!audioContext) return;
      
      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = opts.fftSize;
      analyser.smoothingTimeConstant = opts.smoothingTimeConstant;
      
      // Create source from audio element
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyserRef.current = analyser;
      sourceRef.current = source;
      connectedElementRef.current = audioElement;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      setIsAnalyzing(true);
    } catch (error) {
      console.warn('Failed to connect stem analyzer:', error);
    }
  }, [cleanup, opts.fftSize, opts.smoothingTimeConstant]);

  // Disconnect
  const disconnect = useCallback(() => {
    cleanup();
    setLevels({ rms: 0, peak: 0, clipping: false });
  }, [cleanup]);

  // Get frequency data
  const getFrequencyData = useCallback((): Uint8Array | null => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return null;
    
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  // Analysis loop
  useEffect(() => {
    if (!isAnalyzing) return;
    
    let lastUpdate = 0;
    
    const analyze = (timestamp: number) => {
      if (!analyserRef.current || !dataArrayRef.current) {
        animationRef.current = requestAnimationFrame(analyze);
        return;
      }
      
      // Throttle updates
      if (timestamp - lastUpdate < opts.updateInterval) {
        animationRef.current = requestAnimationFrame(analyze);
        return;
      }
      lastUpdate = timestamp;
      
      // Get time domain data for RMS/peak calculation
      const bufferLength = analyserRef.current.fftSize;
      const timeData = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(timeData);
      
      // Calculate RMS
      let sumSquares = 0;
      let peak = 0;
      
      for (let i = 0; i < timeData.length; i++) {
        const amplitude = (timeData[i] - 128) / 128;
        sumSquares += amplitude * amplitude;
        peak = Math.max(peak, Math.abs(amplitude));
      }
      
      const rms = Math.sqrt(sumSquares / timeData.length);
      const clipping = peak >= 0.99;
      
      setLevels({ rms, peak, clipping });
      
      animationRef.current = requestAnimationFrame(analyze);
    };
    
    animationRef.current = requestAnimationFrame(analyze);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnalyzing, opts.updateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    levels,
    isAnalyzing,
    connect,
    disconnect,
    getFrequencyData,
  };
}

// Hook for multiple stems
export function useMultiStemAnalyzer(stemIds: string[]) {
  const analyzers = useRef<Map<string, ReturnType<typeof useStemAnalyzer>>>(new Map());
  const [allLevels, setAllLevels] = useState<Record<string, StemLevels>>({});

  // This is a simplified version - in production, you'd want to
  // share a single AnalyserNode setup across stems
  
  const connectStem = useCallback((stemId: string, audioElement: HTMLAudioElement) => {
    // Implementation would go here
  }, []);

  const disconnectStem = useCallback((stemId: string) => {
    // Implementation would go here
  }, []);

  const disconnectAll = useCallback(() => {
    analyzers.current.forEach((analyzer) => analyzer.disconnect());
    analyzers.current.clear();
    setAllLevels({});
  }, []);

  return {
    levels: allLevels,
    connectStem,
    disconnectStem,
    disconnectAll,
  };
}
