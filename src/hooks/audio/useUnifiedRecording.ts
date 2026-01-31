/**
 * useUnifiedRecording - Unified hook for all audio recording functionality
 * 
 * Consolidates recording logic from 7+ components into a single reusable hook
 * Supports: vocal, guitar, instrument modes with appropriate audio settings
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type RecordingMode = 'vocal' | 'guitar' | 'instrument' | 'general';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  waveformData: number[];
}

export interface UseUnifiedRecordingOptions {
  mode?: RecordingMode;
  maxDuration?: number; // seconds, 0 = unlimited
  sampleRate?: number;
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob, duration: number) => void | Promise<void>;
  onRecordingPause?: () => void;
  onRecordingResume?: () => void;
  onAudioData?: (data: Blob) => void;
  onError?: (error: Error) => void;
}

export interface UseUnifiedRecordingReturn extends RecordingState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  mediaStream: MediaStream | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  isSupported: boolean;
}

const AUDIO_SETTINGS_BY_MODE: Record<RecordingMode, MediaTrackConstraints> = {
  vocal: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
  },
  guitar: {
    echoCancellation: false, // Preserve natural sound
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: 48000, // Higher quality for instruments
  },
  instrument: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: 48000,
  },
  general: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 44100,
  },
};

export function useUnifiedRecording(
  options: UseUnifiedRecordingOptions = {}
): UseUnifiedRecordingReturn {
  const {
    mode = 'general',
    maxDuration = 0,
    onRecordingStart,
    onRecordingStop,
    onRecordingPause,
    onRecordingResume,
    onAudioData,
    onError,
  } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const waveformSamplesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  // Check browser support
  const isSupported = typeof navigator !== 'undefined' && 
    !!navigator.mediaDevices?.getUserMedia;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  // Audio level monitoring
  const startAudioMonitoring = useCallback((stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      const updateLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

        // Calculate average level
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;
        const normalized = Math.min(100, Math.round((average / 255) * 150));
        
        setAudioLevel(normalized);

        // Add sample to waveform data (every ~100ms)
        if (waveformSamplesRef.current.length < 500) {
          waveformSamplesRef.current.push(normalized / 100);
          setWaveformData([...waveformSamplesRef.current]);
        }

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      logger.error('Audio monitoring error', error instanceof Error ? error : new Error(String(error)));
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      toast.error('Запись аудио не поддерживается в этом браузере');
      return;
    }

    try {
      // Reset state
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      audioChunksRef.current = [];
      waveformSamplesRef.current = [];
      setWaveformData([]);
      pausedDurationRef.current = 0;

      // Get audio stream with mode-specific settings
      const audioSettings = AUDIO_SETTINGS_BY_MODE[mode];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioSettings 
      });
      
      streamRef.current = stream;
      setMediaStream(stream);

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          onAudioData?.(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setAudioBlob(blob);
        setAudioUrl(url);

        const finalDuration = duration;
        
        cleanup();
        setMediaStream(null);

        if (onRecordingStop) {
          await onRecordingStop(blob, finalDuration);
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms for smoother waveform
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start audio level monitoring
      startAudioMonitoring(stream);

      // Start duration timer
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedDurationRef.current;
          setDuration(elapsed);

          // Check max duration
          if (maxDuration > 0 && elapsed >= maxDuration) {
            stopRecording();
            toast.info(`Максимальная длительность ${maxDuration}с достигнута`);
          }
        }
      }, 1000);

      onRecordingStart?.();
      toast.success('Запись начата');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Recording start error', err);
      onError?.(err);
      
      if (err.name === 'NotAllowedError') {
        toast.error('Доступ к микрофону запрещён');
      } else if (err.name === 'NotFoundError') {
        toast.error('Микрофон не найден');
      } else {
        toast.error('Ошибка при начале записи');
      }
    }
  }, [isSupported, mode, maxDuration, audioUrl, isPaused, duration, onRecordingStart, onRecordingStop, onAudioData, onError, startAudioMonitoring, cleanup]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
    }
  }, [isRecording]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      onRecordingPause?.();
    }
  }, [isRecording, isPaused, onRecordingPause]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      onRecordingResume?.();
    }
  }, [isRecording, isPaused, onRecordingResume]);

  // Reset recording state
  const resetRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioLevel(0);
    setWaveformData([]);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setMediaStream(null);
    audioChunksRef.current = [];
    waveformSamplesRef.current = [];
  }, [cleanup, audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cleanup, audioUrl]);

  return {
    // State
    isRecording,
    isPaused,
    duration,
    audioLevel,
    waveformData,
    
    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    
    // Data
    mediaStream,
    audioBlob,
    audioUrl,
    isSupported,
  };
}
