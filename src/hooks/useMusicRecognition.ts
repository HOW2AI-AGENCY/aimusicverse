import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface RecognizedTrack {
  artist: string;
  title: string;
  album?: string;
  releaseDate?: string;
  label?: string;
  timecode?: string;
  songLink?: string;
  appleMusic?: any;
  spotify?: any;
  deezer?: any;
  lyrics?: any;
}

export interface RecognitionResult {
  success: boolean;
  found: boolean;
  message?: string;
  track?: RecognizedTrack;
}

export function useMusicRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Recognize music from base64 audio
  const recognizeFromBase64 = useCallback(async (audioBase64: string): Promise<RecognitionResult> => {
    setIsRecognizing(true);
    setResult(null);

    try {
      logger.info('Recognizing music from base64 audio...');
      
      const { data, error } = await supabase.functions.invoke('recognize-music', {
        body: { audioBase64 }
      });

      if (error) {
      logger.error('Recognition error:', { error });
        throw new Error(error.message || 'Recognition failed');
      }

      const recognitionResult = data as RecognitionResult;
      setResult(recognitionResult);

      if (recognitionResult.found && recognitionResult.track) {
        toast.success(`Найдено: ${recognitionResult.track.artist} - ${recognitionResult.track.title}`);
      } else {
        toast.info('Музыка не распознана');
      }

      return recognitionResult;
    } catch (err) {
      logger.error('Recognition failed:', { error: err });
      const errorResult: RecognitionResult = {
        success: false,
        found: false,
        message: err instanceof Error ? err.message : 'Unknown error'
      };
      setResult(errorResult);
      toast.error('Ошибка распознавания');
      return errorResult;
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  // Recognize music from URL
  const recognizeFromUrl = useCallback(async (audioUrl: string): Promise<RecognitionResult> => {
    setIsRecognizing(true);
    setResult(null);

    try {
      logger.info('Recognizing music from URL:', { audioUrl });
      
      const { data, error } = await supabase.functions.invoke('recognize-music', {
        body: { audioUrl }
      });

      if (error) {
        logger.error('Recognition error:', { error });
        throw new Error(error.message || 'Recognition failed');
      }

      const recognitionResult = data as RecognitionResult;
      setResult(recognitionResult);

      if (recognitionResult.found && recognitionResult.track) {
        toast.success(`Найдено: ${recognitionResult.track.artist} - ${recognitionResult.track.title}`);
      } else {
        toast.info('Музыка не распознана');
      }

      return recognitionResult;
    } catch (err) {
      logger.error('Recognition failed:', err);
      const errorResult: RecognitionResult = {
        success: false,
        found: false,
        message: err instanceof Error ? err.message : 'Unknown error'
      };
      setResult(errorResult);
      toast.error('Ошибка распознавания');
      return errorResult;
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  // Recognize music from file
  const recognizeFromFile = useCallback(async (file: File): Promise<RecognitionResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await recognizeFromBase64(base64);
        resolve(result);
      };
      reader.onerror = () => {
        const errorResult: RecognitionResult = {
          success: false,
          found: false,
          message: 'Failed to read file'
        };
        setResult(errorResult);
        toast.error('Не удалось прочитать файл');
        resolve(errorResult);
      };
      reader.readAsDataURL(file);
    });
  }, [recognizeFromBase64]);

  // Start recording from microphone
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      toast.info('Запись началась. Поднесите устройство к источнику звука.');
      logger.info('Recording started');
    } catch (err) {
      logger.error('Failed to start recording:', { error: err });
      toast.error('Не удалось получить доступ к микрофону');
    }
  }, []);

  // Stop recording and recognize
  const stopRecordingAndRecognize = useCallback(async (): Promise<RecognitionResult> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        const errorResult: RecognitionResult = {
          success: false,
          found: false,
          message: 'No active recording'
        };
        resolve(errorResult);
        return;
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // Combine audio chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const result = await recognizeFromBase64(base64);
          resolve(result);
        };
        reader.onerror = () => {
          const errorResult: RecognitionResult = {
            success: false,
            found: false,
            message: 'Failed to process recording'
          };
          setResult(errorResult);
          toast.error('Ошибка обработки записи');
          resolve(errorResult);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.stop();
      setIsRecording(false);
      logger.info('Recording stopped');
    });
  }, [recognizeFromBase64]);

  // Cancel recording without recognizing
  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      mediaRecorder.stop();
    }
    
    audioChunksRef.current = [];
    setIsRecording(false);
    logger.info('Recording cancelled');
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isRecognizing,
    isRecording,
    result,
    recognizeFromBase64,
    recognizeFromUrl,
    recognizeFromFile,
    startRecording,
    stopRecordingAndRecognize,
    cancelRecording,
    clearResult,
  };
}
