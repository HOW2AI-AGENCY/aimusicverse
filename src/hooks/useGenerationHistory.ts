import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface GenerationHistoryEntry {
  id: string;
  user_id: string;
  prompt: string;
  style: string | null;
  tags: string[] | null;
  generation_mode: string | null;
  model_name: string | null;
  is_instrumental: boolean;
  lyrics: string | null;
  reference_audio_id: string | null;
  track_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AddHistoryParams {
  prompt: string;
  style?: string;
  tags?: string[];
  generation_mode?: string;
  model_name?: string;
  is_instrumental?: boolean;
  lyrics?: string;
  reference_audio_id?: string;
  track_id?: string;
  metadata?: Record<string, unknown>;
}

export function useGenerationHistory(limit = 50) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['generation-history', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_generation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as GenerationHistoryEntry[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAddToHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: AddHistoryParams) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_generation_history')
        .insert({
          user_id: user.id,
          prompt: params.prompt,
          style: params.style,
          tags: params.tags,
          generation_mode: params.generation_mode,
          model_name: params.model_name,
          is_instrumental: params.is_instrumental,
          lyrics: params.lyrics,
          reference_audio_id: params.reference_audio_id,
          track_id: params.track_id,
          metadata: params.metadata,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as GenerationHistoryEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-history'] });
    },
  });
}

export function useClearHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_generation_history')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-history'] });
    },
  });
}

export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('user_generation_history')
        .delete()
        .eq('id', entryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-history'] });
    },
  });
}
