/**
 * Hook to fetch failed generation tasks for the current user
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FailedGeneration {
  id: string;
  track_id: string | null;
  prompt: string;
  status: string;
  error_message: string | null;
  generation_mode: string | null;
  model_used: string | null;
  created_at: string;
}

export function useFailedGenerations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['failed_generations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('generation_tasks')
        .select('id, track_id, prompt, status, error_message, generation_mode, model_used, created_at')
        .eq('user_id', user.id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw new Error(error.message);
      return data as FailedGeneration[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['failed_generations', user?.id] });
  };

  return {
    ...query,
    failedGenerations: query.data || [],
    refetchFailed: refetch,
  };
}
