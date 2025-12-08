import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ReplaceSectionParams {
  trackId: string;
  prompt?: string;
  tags?: string;
  infillStartS: number;
  infillEndS: number;
}

interface ReplaceSectionResponse {
  success: boolean;
  taskId: string;
  sunoTaskId: string;
  message: string;
}

export function useReplaceSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ReplaceSectionParams): Promise<ReplaceSectionResponse> => {
      logger.info('Starting section replacement', { 
        trackId: params.trackId, 
        infillStartS: params.infillStartS, 
        infillEndS: params.infillEndS 
      });

      const { data, error } = await supabase.functions.invoke('suno-replace-section', {
        body: params,
      });

      if (error) {
        logger.error('Replace section error', error);
        throw new Error(error.message || 'Failed to start section replacement');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to start section replacement');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Замена секции запущена', {
        description: 'Ожидайте, это займёт 1-2 минуты'
      });
      
      // Invalidate queries to show the new task
      queryClient.invalidateQueries({ queryKey: ['generation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['replaced-sections', variables.trackId] });
    },
    onError: (error: Error) => {
      logger.error('Replace section mutation error', error);
      toast.error('Ошибка замены секции', {
        description: error.message
      });
    }
  });
}

// Hook for tracking replace section task status
export function useReplaceSectionStatus(taskId: string | null) {
  // Subscribe to realtime updates on generation_tasks
  // The task status will update from 'pending' -> 'processing' -> 'completed'
  // When completed, a new track version will be created

  return {
    taskId,
    // Could add realtime subscription here if needed
  };
}
