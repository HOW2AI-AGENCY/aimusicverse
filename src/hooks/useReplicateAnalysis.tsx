import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      console.log('Starting Replicate analysis:', { trackId, audioUrl, analysisTypes });
      
      const { data, error } = await supabase.functions.invoke('replicate-music-analysis', {
        body: {
          trackId,
          audioUrl,
          analysisTypes,
        },
      });

      if (error) {
        console.error('Replicate analysis error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      console.log('Replicate analysis completed:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Расширенный анализ завершён');
      queryClient.invalidateQueries({ queryKey: ['audio-analysis', variables.trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error: Error) => {
      console.error('Error analyzing with Replicate:', error);
      toast.error(`Ошибка анализа: ${error.message}`);
    },
  });
}
