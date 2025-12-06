import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VoiceInputContext = 'description' | 'style' | 'lyrics' | 'title' | 'general';

interface UseVoiceInputOptions {
  onResult: (text: string) => void;
  context?: VoiceInputContext;
  autoCorrect?: boolean;
  language?: string;
}

export function useVoiceInput({ 
  onResult, 
  context = 'general',
  autoCorrect = true,
  language = 'ru'
}: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        if (chunksRef.current.length === 0) {
          toast.error('Не удалось записать аудио');
          return;
        }

        setIsProcessing(true);

        try {
          // Convert chunks to base64
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Convert to base64
          let binary = '';
          const chunkSize = 0x8000;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64Audio = btoa(binary);

          // Send to speech-to-text
          const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke('speech-to-text', {
            body: { audio: base64Audio, language },
          });

          if (transcriptError) throw transcriptError;

          if (!transcriptData?.text) {
            toast.error('Речь не распознана');
            return;
          }

          let finalText = transcriptData.text;

          // Auto-correct if enabled
          if (autoCorrect && finalText.length > 0) {
            const { data: correctionData, error: correctionError } = await supabase.functions.invoke('correct-text', {
              body: { text: finalText, context },
            });

            if (!correctionError && correctionData?.correctedText) {
              finalText = correctionData.correctedText;
              if (correctionData.wasModified) {
                toast.success('Текст исправлен AI ✨');
              }
            }
          }

          onResult(finalText);
          toast.success('Голос распознан');

        } catch (error) {
          console.error('Voice processing error:', error);
          toast.error('Ошибка обработки голоса', {
            description: error instanceof Error ? error.message : 'Попробуйте снова'
          });
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Нет доступа к микрофону', {
        description: 'Разрешите доступ в настройках браузера'
      });
    }
  }, [onResult, context, autoCorrect, language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
