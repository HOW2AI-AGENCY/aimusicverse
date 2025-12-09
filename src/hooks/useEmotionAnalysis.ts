import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'EmotionAnalysis' });

export interface EmotionResult {
  arousal: number;
  valence: number;
  quadrant: string;
  confidence: number;
}

export function useEmotionAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trackId, 
      audioUrl,
      embeddingType = 'msd-musicnn'
    }: { 
      trackId: string; 
      audioUrl: string;
      embeddingType?: 'msd-musicnn' | 'audioset-vggish';
    }): Promise<EmotionResult> => {
      log.info('Starting emotion analysis', { trackId, embeddingType });
      
      const { data, error } = await supabase.functions.invoke('analyze-music-emotion', {
        body: {
          track_id: trackId,
          audio_url: audioUrl,
          embedding_type: embeddingType,
          update_analysis: true
        },
      });

      if (error) {
        log.error('Emotion analysis error', { error });
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Emotion analysis failed');
      }

      log.info('Emotion analysis completed', { trackId, emotion: data.emotion });
      return data.emotion as EmotionResult;
    },
    onSuccess: (data, variables) => {
      toast.success('Анализ эмоций завершён');
      queryClient.invalidateQueries({ queryKey: ['audio-analysis', variables.trackId] });
    },
    onError: (error: Error) => {
      log.error('Error analyzing emotion', { error: error.message });
      toast.error(`Ошибка анализа: ${error.message}`);
    },
  });
}
