import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface RecognizedLyrics {
  text: string;
  language?: string;
  confidence?: number;
}

export interface LyricsRecognitionResult {
  success: boolean;
  lyrics?: RecognizedLyrics;
  error?: string;
}

export function useLyricsRecognition() {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<LyricsRecognitionResult | null>(null);

  // Recognize lyrics from audio URL
  const recognizeLyrics = useCallback(async (audioUrl: string): Promise<LyricsRecognitionResult> => {
    setIsRecognizing(true);
    setResult(null);

    try {
      logger.info('Recognizing lyrics from audio...', { audioUrl });
      
      const { data, error } = await supabase.functions.invoke('recognize-lyrics', {
        body: { audioUrl }
      });

      if (error) {
        logger.error('Lyrics recognition error:', { error });
        throw new Error(error.message || 'Recognition failed');
      }

      const recognitionResult = data as LyricsRecognitionResult;
      setResult(recognitionResult);

      if (recognitionResult.success && recognitionResult.lyrics) {
        toast.success('Текст песни распознан!');
      } else {
        toast.info('Текст не удалось распознать');
      }

      return recognitionResult;
    } catch (err) {
      logger.error('Lyrics recognition failed:', { error: err });
      const errorResult: LyricsRecognitionResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
      setResult(errorResult);
      toast.error('Ошибка распознавания текста');
      return errorResult;
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isRecognizing,
    result,
    recognizeLyrics,
    clearResult,
  };
}
