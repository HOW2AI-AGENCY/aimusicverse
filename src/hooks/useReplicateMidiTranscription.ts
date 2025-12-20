import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'KlangioTranscription' });

export interface TranscriptionFiles {
  midi?: string;
  midi_quant?: string;
  mxml?: string;
  gp5?: string;
  pdf?: string;
}

interface TranscriptionResult {
  midiUrl: string;
  files: TranscriptionFiles;
  notes: Array<{
    pitch: number;
    startTime: number;
    endTime: number;
    duration: number;
    velocity: number;
    noteName?: string;
  }>;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  model: string;
}

interface UseKlangioTranscriptionReturn {
  transcribe: (audioUrl: string, options?: { 
    trackId?: string; 
    model?: 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal';
    outputs?: string[];
  }) => Promise<TranscriptionResult | null>;
  isLoading: boolean;
  error: string | null;
  result: TranscriptionResult | null;
  progress: number;
}

export function useReplicateMidiTranscription(): UseKlangioTranscriptionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [progress, setProgress] = useState(0);

  const transcribe = useCallback(async (
    audioUrl: string,
    options?: { 
      trackId?: string; 
      model?: 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal';
      outputs?: string[];
    }
  ): Promise<TranscriptionResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      log.info('Starting Klangio transcription', { audioUrl, options });

      // Simulate progress while waiting for Klangio
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 85));
      }, 3000);

      // Request all available formats
      const outputs = options?.outputs || ['midi', 'midi_quant', 'mxml', 'gp5', 'pdf'];

      const { data, error: invokeError } = await supabase.functions.invoke('klangio-analyze', {
        body: {
          audio_url: audioUrl,
          mode: 'transcription',
          model: options?.model || 'guitar',
          outputs,
          track_id: options?.trackId,
        },
      });

      clearInterval(progressInterval);

      if (invokeError) {
        throw invokeError;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Transcription failed');
      }

      setProgress(100);
      
      const files: TranscriptionFiles = data.files || {};
      
      // Check if we got at least some usable output
      const hasAnyFile = Object.keys(files).length > 0;
      const hasMidi = !!files.midi;
      
      const transcriptionResult: TranscriptionResult = {
        midiUrl: files.midi || data.midi_url || '',
        files,
        notes: data.notes || [],
        bpm: data.bpm,
        key: data.key,
        timeSignature: data.time_signature,
        model: 'klangio',
      };

      setResult(transcriptionResult);
      log.info('Klangio transcription completed', { 
        midiUrl: transcriptionResult.midiUrl,
        filesCount: Object.keys(files).length,
        notesCount: transcriptionResult.notes.length,
        hasMidi,
      });
      
      if (hasAnyFile) {
        if (hasMidi) {
          toast.success('Транскрипция завершена', {
            description: `Создано ${Object.keys(files).length} файлов`
          });
        } else {
          toast.warning('Частичная транскрипция', {
            description: 'MIDI не сгенерирован, но доступны ноты в PDF'
          });
        }
      } else {
        toast.error('Не удалось создать файлы транскрипции');
      }

      return transcriptionResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      log.error('Klangio transcription error', { error: errorMessage });
      setError(errorMessage);
      toast.error(`Ошибка транскрипции: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    transcribe,
    isLoading,
    error,
    result,
    progress,
  };
}