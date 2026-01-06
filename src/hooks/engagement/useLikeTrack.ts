// useLikeTrack hook - Sprint 011
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export function useLikeTrack(trackId: string, initialLiked?: boolean) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  // If initialLiked is provided, use it and skip the query
  const { data: isLiked, isLoading: isCheckingLike } = useQuery({
    queryKey: ['track-like', trackId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from('track_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!trackId && initialLiked === undefined,
    initialData: initialLiked,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Не авторизован');

      if (isLiked) {
        const { error } = await supabase
          .from('track_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);
        if (error) throw error;
        return { action: 'unlike' as const };
      } else {
        const { error } = await supabase
          .from('track_likes')
          .insert({ user_id: user.id, track_id: trackId });
        if (error) throw error;
        return { action: 'like' as const };
      }
    },
    onMutate: () => {
      haptic.impact('light');
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['track-like', trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['public-content'] });
    },
    onError: (error) => {
      console.error('Error toggling like:', error);
      toast.error('Не удалось обновить лайк');
    },
  });

  return {
    isLiked: isLiked ?? false,
    isLoading: isCheckingLike || likeMutation.isPending,
    toggleLike: likeMutation.mutate,
  };
}
