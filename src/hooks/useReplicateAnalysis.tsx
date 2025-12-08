import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'ReplicateAnalysis' });

export function useReplicateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      trackId, 
      audioUrl,
      analysisTypes = ['bpm', 'beats', 'emotion', 'approachability']
    }: { 
      trackId: string; 
      audioUrl: string;
      analysisTypes?: string[];
    }) => {
      log.info('Starting Replicate analysis', { trackId, analysisTypes });
      
      const { data, error } = await supabase.functions.invoke('replicate-music-analysis', {
        body: {
          trackId,
          audioUrl,
          analysisTypes,
        },
      });

      if (error) {
        log.error('Replicate analysis error', { error });
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      log.info('Replicate analysis completed', { trackId });
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Расширенный анализ завершён');
      queryClient.invalidateQueries({ queryKey: ['audio-analysis', variables.trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: Error) => {
      log.error('Error analyzing with Replicate', { error: error.message });
      toast.error(`Ошибка анализа: ${error.message}`);
    },
  });
}
