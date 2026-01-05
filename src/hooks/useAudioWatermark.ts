/**
 * Audio Watermark Hook
 * 
 * React hook for applying and detecting watermarks on audio
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  applyWatermark as applyWatermarkApi, 
  detectWatermark as detectWatermarkApi,
  WatermarkResult 
} from '@/api/audio-watermark.api';

interface UseAudioWatermarkReturn {
  applyWatermark: (audioUrl: string, trackId?: string) => Promise<WatermarkResult | null>;
  detectWatermark: (audioUrl: string) => Promise<boolean | null>;
  isApplying: boolean;
  isDetecting: boolean;
  error: string | null;
}

export function useAudioWatermark(): UseAudioWatermarkReturn {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: ({ audioUrl, trackId }: { audioUrl: string; trackId?: string }) =>
      applyWatermarkApi(audioUrl, trackId),
    onMutate: () => {
      setError(null);
      toast.loading('Добавление водяного знака...', { id: 'watermark-apply' });
    },
    onSuccess: (result) => {
      toast.success('Водяной знак добавлен', { id: 'watermark-apply' });
      
      // Invalidate track queries to refresh data
      if (result.trackId) {
        queryClient.invalidateQueries({ queryKey: ['tracks', result.trackId] });
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
      }
    },
    onError: (err: Error) => {
      const message = err.message || 'Ошибка при добавлении водяного знака';
      setError(message);
      toast.error(message, { id: 'watermark-apply' });
    },
  });

  const detectMutation = useMutation({
    mutationFn: (audioUrl: string) => detectWatermarkApi(audioUrl),
    onMutate: () => {
      setError(null);
      toast.loading('Проверка водяного знака...', { id: 'watermark-detect' });
    },
    onSuccess: (hasWatermark) => {
      if (hasWatermark) {
        toast.success('Водяной знак обнаружен ✓', { id: 'watermark-detect' });
      } else {
        toast.info('Водяной знак не обнаружен', { id: 'watermark-detect' });
      }
    },
    onError: (err: Error) => {
      const message = err.message || 'Ошибка при проверке водяного знака';
      setError(message);
      toast.error(message, { id: 'watermark-detect' });
    },
  });

  const applyWatermark = useCallback(
    async (audioUrl: string, trackId?: string): Promise<WatermarkResult | null> => {
      try {
        return await applyMutation.mutateAsync({ audioUrl, trackId });
      } catch {
        return null;
      }
    },
    [applyMutation]
  );

  const detectWatermark = useCallback(
    async (audioUrl: string): Promise<boolean | null> => {
      try {
        return await detectMutation.mutateAsync(audioUrl);
      } catch {
        return null;
      }
    },
    [detectMutation]
  );

  return {
    applyWatermark,
    detectWatermark,
    isApplying: applyMutation.isPending,
    isDetecting: detectMutation.isPending,
    error,
  };
}
