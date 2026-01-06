/**
 * useAudioRecording - Hook for managing audio recording from microphone
 */

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseAudioRecordingOptions {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void | Promise<void>;
}

interface UseAudioRecordingReturn {
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useAudioRecording(options: UseAudioRecordingOptions = {}): UseAudioRecordingReturn {
  const { onRecordingComplete } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Get final duration before resetting
        const finalDuration = recordingTime;
        
        // Notify parent
        if (onRecordingComplete) {
          await onRecordingComplete(audioBlob, finalDuration);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Запись начата');
    } catch (error) {
      logger.error('Recording error', error);
      toast.error('Не удалось получить доступ к микрофону');
    }
  }, [onRecordingComplete, recordingTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
  };
}
