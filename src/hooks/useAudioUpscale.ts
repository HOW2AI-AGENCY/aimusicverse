/**
 * useAudioUpscale hook
 * 
 * React hook for audio upscaling to 48kHz using AudioSR
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { upscaleAudio, UpscaleOptions, UpscaleResult } from '@/api/audio-upscale.api';
import { logger } from '@/lib/logger';

interface UseAudioUpscaleReturn {
  upscale: (options: UpscaleOptions) => Promise<UpscaleResult | null>;
  isLoading: boolean;
  progress: number;
  error: string | null;
  result: UpscaleResult | null;
  reset: () => void;
}

export function useAudioUpscale(): UseAudioUpscaleReturn {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpscaleResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (options: UpscaleOptions) => {
      setProgress(10);
      setError(null);
      
      // Simulate progress during processing
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 3000);

      try {
        const res = await upscaleAudio(options);
        clearInterval(progressInterval);
        setProgress(100);
        return res;
      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }
    },
    onSuccess: (data, variables) => {
      setResult(data);
      logger.info('[useAudioUpscale] Upscale completed', { 
        trackId: variables.trackId,
        processingTime: data.processingTimeMs 
      });
      
      toast.success('Аудио улучшено до 48kHz', {
        description: 'HD версия трека готова',
      });

      // Invalidate track queries to refresh data
      if (variables.trackId) {
        queryClient.invalidateQueries({ queryKey: ['tracks', variables.trackId] });
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
      }
    },
    onError: (err: Error) => {
      const errorMsg = err.message || 'Ошибка при улучшении аудио';
      setError(errorMsg);
      setProgress(0);
      logger.error('[useAudioUpscale] Upscale failed', err);
      
      toast.error('Не удалось улучшить аудио', {
        description: errorMsg,
      });
    },
  });

  const upscale = useCallback(async (options: UpscaleOptions): Promise<UpscaleResult | null> => {
    try {
      return await mutation.mutateAsync(options);
    } catch {
      return null;
    }
  }, [mutation]);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
    setResult(null);
    mutation.reset();
  }, [mutation]);

  return {
    upscale,
    isLoading: mutation.isPending,
    progress,
    error,
    result,
    reset,
  };
}
