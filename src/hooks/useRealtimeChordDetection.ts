/**
 * Hook for realtime chord detection from microphone input
 * Uses Web Audio API with Pitch Class Profiles (PCP) analysis
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  computeChromagram, 
  detectChord, 
  type DetectedChord,
  type ChordQuality 
} from '@/lib/chord-detection';
import { useHapticFeedback } from './useHapticFeedback';
import { logger } from '@/lib/logger';

interface RealtimeChordState {
  currentChord: DetectedChord | null;
  chordHistory: DetectedChord[];
  chromagram: number[];
  isListening: boolean;
  isInitializing: boolean;
  error: string | null;
  volume: number;
}

interface UseRealtimeChordDetectionOptions {
  onChordChange?: (chord: DetectedChord) => void;
  minConfidence?: number;
  stabilityFrames?: number;
  maxHistory?: number;
}

const FFT_SIZE = 8192; // High resolution for low guitar frequencies
const ANALYSIS_INTERVAL = 50; // ms between analyses

export function useRealtimeChordDetection(
  options: UseRealtimeChordDetectionOptions = {}
) {
  const {
    onChordChange,
    minConfidence = 0.6,
    stabilityFrames = 3,
    maxHistory = 20,
  } = options;

  const haptic = useHapticFeedback();
  
  const [state, setState] = useState<RealtimeChordState>({
    currentChord: null,
    chordHistory: [],
    chromagram: new Array(12).fill(0),
    isListening: false,
    isInitializing: false,
    error: null,
    volume: 0,
  });

  // Audio context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Stability tracking
  const recentChordsRef = useRef<string[]>([]);
  const lastStableChordRef = useRef<string | null>(null);

  /**
   * Start listening to microphone
   */
  const startListening = useCallback(async () => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create audio context
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      
      // Create analyser with high FFT size for bass frequencies
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;

      // Start analysis loop
      const frequencyData = new Float32Array(analyser.frequencyBinCount);
      const timeDomainData = new Uint8Array(analyser.fftSize);

      const analyze = () => {
        if (!analyserRef.current) return;

        // Get frequency data
        analyserRef.current.getFloatFrequencyData(frequencyData);
        analyserRef.current.getByteTimeDomainData(timeDomainData);

        // Compute volume (RMS)
        let sum = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const normalized = (timeDomainData[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / timeDomainData.length);
        const volume = Math.min(1, rms * 5); // Scale for visibility

        // Compute chromagram
        const chromagram = computeChromagram(
          frequencyData,
          audioContext.sampleRate,
          FFT_SIZE
        );

        // Detect chord
        const detected = detectChord(chromagram);

        // Check stability - only report chord if it's stable
        recentChordsRef.current.push(detected.name);
        if (recentChordsRef.current.length > stabilityFrames) {
          recentChordsRef.current.shift();
        }

        const isStable = recentChordsRef.current.every(
          c => c === detected.name
        );

        setState(prev => {
          const shouldUpdate = 
            isStable && 
            detected.confidence >= minConfidence &&
            detected.name !== 'N/C';

          // Check if chord changed
          const chordChanged = 
            shouldUpdate && 
            detected.name !== lastStableChordRef.current;

          if (chordChanged) {
            lastStableChordRef.current = detected.name;
            haptic.impact('medium');
            onChordChange?.(detected);
          }

          return {
            ...prev,
            chromagram,
            volume,
            currentChord: shouldUpdate ? detected : prev.currentChord,
            chordHistory: chordChanged
              ? [detected, ...prev.chordHistory].slice(0, maxHistory)
              : prev.chordHistory,
          };
        });
      };

      // Run analysis at intervals
      intervalRef.current = window.setInterval(analyze, ANALYSIS_INTERVAL);

      setState(prev => ({
        ...prev,
        isListening: true,
        isInitializing: false,
      }));

      logger.info('Realtime chord detection started');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: message,
      }));
      logger.error('Failed to start chord detection', err);
    }
  }, [haptic, minConfidence, stabilityFrames, maxHistory, onChordChange]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    recentChordsRef.current = [];
    lastStableChordRef.current = null;

    setState(prev => ({
      ...prev,
      isListening: false,
      volume: 0,
    }));

    logger.info('Realtime chord detection stopped');
  }, []);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      chordHistory: [],
    }));
  }, []);

  /**
   * Export history as chord progression string
   */
  const exportProgression = useCallback(() => {
    return state.chordHistory
      .slice()
      .reverse()
      .map(c => c.name)
      .join(' → ');
  }, [state.chordHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    clearHistory,
    exportProgression,
  };
}
