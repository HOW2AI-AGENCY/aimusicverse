import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'ReplicateMidiTranscription' });

interface TranscriptionResult {
  midiUrl: string;
  model: string;
}

interface UseReplicateMidiTranscriptionReturn {
  transcribe: (audioUrl: string, options?: { trackId?: string; recordingId?: string }) => Promise<TranscriptionResult | null>;
  isLoading: boolean;
  error: string | null;
  result: TranscriptionResult | null;
  progress: number;
}

export function useReplicateMidiTranscription(): UseReplicateMidiTranscriptionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [progress, setProgress] = useState(0);

  const transcribe = useCallback(async (
    audioUrl: string,
    options?: { trackId?: string; recordingId?: string }
  ): Promise<TranscriptionResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      log.info('Starting MT3 MIDI transcription', { audioUrl, options });

      // Simulate progress while waiting for Replicate
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 85));
      }, 2000);

      const { data, error: invokeError } = await supabase.functions.invoke('replicate-midi-transcription', {
        body: {
          audioUrl,
          trackId: options?.trackId,
          recordingId: options?.recordingId,
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
      const transcriptionResult: TranscriptionResult = {
        midiUrl: data.midiUrl,
        model: data.model,
      };

      setResult(transcriptionResult);
      log.info('MT3 transcription completed', { midiUrl: data.midiUrl });
      toast.success('MIDI транскрипция завершена');

      return transcriptionResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      log.error('MT3 transcription error', { error: errorMessage });
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
