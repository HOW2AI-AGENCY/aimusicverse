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
  hasVocals?: boolean;
  analysis?: {
    genre?: string;
    mood?: string;
    vocalStyle?: string;
  };
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
      
      const { data, error } = await supabase.functions.invoke('transcribe-lyrics', {
        body: { audio_url: audioUrl }
      });

      if (error) {
        logger.error('Lyrics recognition error:', { error });
        throw new Error(error.message || 'Recognition failed');
      }

      const recognitionResult: LyricsRecognitionResult = {
        success: true,
        hasVocals: data.has_vocals,
        lyrics: data.lyrics ? {
          text: data.lyrics,
          language: data.language,
        } : undefined,
        analysis: data.analysis ? {
          genre: data.analysis.genre,
          mood: data.analysis.mood,
          vocalStyle: data.analysis.vocal_style,
        } : undefined,
      };
      
      setResult(recognitionResult);

      if (recognitionResult.hasVocals && recognitionResult.lyrics) {
        toast.success('Текст песни распознан!');
      } else if (!recognitionResult.hasVocals) {
        toast.info('Инструментальный трек (вокал не обнаружен)');
      } else {
        toast.info('Не удалось извлечь текст');
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

  // Recognize from File (uploads first)
  const recognizeLyricsFromFile = useCallback(async (file: File): Promise<LyricsRecognitionResult> => {
    setIsRecognizing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');
      
      const fileName = `lyrics-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);
        
      return await recognizeLyrics(publicUrl);
    } catch (err) {
      logger.error('File upload for lyrics recognition failed:', { error: err });
      const errorResult: LyricsRecognitionResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Upload failed'
      };
      setResult(errorResult);
      toast.error('Ошибка загрузки файла');
      setIsRecognizing(false);
      return errorResult;
    }
  }, [recognizeLyrics]);

  // Clear result
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isRecognizing,
    result,
    recognizeLyrics,
    recognizeLyricsFromFile,
    clearResult,
  };
}
