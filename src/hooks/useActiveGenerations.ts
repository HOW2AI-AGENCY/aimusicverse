import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ActiveGeneration {
  id: string;
  prompt: string;
  status: string;
  generation_mode: string;
  model_used: string;
  created_at: string;
}

export function useActiveGenerations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active_generations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('generation_tasks')
        .select('id, prompt, status, generation_mode, model_used, created_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing', 'streaming_ready'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw new Error(error.message);
      return data as ActiveGeneration[];
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  });
}
