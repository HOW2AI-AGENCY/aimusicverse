/**
 * useAudioLevel - Hook for real-time audio level monitoring
 * Provides normalized audio level (0-100) from MediaStream
 */

import { useState, useEffect, useRef } from 'react';

export function useAudioLevel(mediaStream: MediaStream | null, isActive: boolean = true) {
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!mediaStream || !isActive) {
      // Cleanup
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      dataArrayRef.current = null;
      setAudioLevel(0);
      return;
    }

    try {
      // Create audio context and analyser
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // Animation loop to update level
      const updateLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate average level
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;

        // Normalize to 0-100 range with some amplification for better visualization
        const normalized = Math.min(100, Math.round((average / 255) * 150));
        setAudioLevel(normalized);

        rafRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        source.disconnect();
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      };
    } catch (error) {
      console.error('Audio level monitoring error:', error);
      setAudioLevel(0);
    }
  }, [mediaStream, isActive]);

  return audioLevel;
}
