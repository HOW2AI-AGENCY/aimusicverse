// useLikeTrack hook - Sprint 011 Phase 6
// Like/unlike tracks with optimistic UI updates

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface LikeTrackParams {
  trackId: string;
}

export function useLikeTrack() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();

  const likeMutation = useMutation({
    mutationFn: async ({ trackId }: LikeTrackParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      const { data, error } = await supabase
        .from('track_likes')
        .insert({
          user_id: user.id,
          track_id: trackId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ trackId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['track-stats', trackId] });
      await queryClient.cancelQueries({ queryKey: ['track', trackId] });

      // Optimistic update - increment like count
      queryClient.setQueryData(['track-stats', trackId], (old: any) => {
        if (!old) return { likesCount: 1, isLiked: true };
        return {
          ...old,
          likesCount: (old.likesCount || 0) + 1,
          isLiked: true,
        };
      });

      triggerHapticFeedback('light');
    },
    onSuccess: (_, { trackId }) => {
      queryClient.invalidateQueries({ queryKey: ['track-stats', trackId] });
      queryClient.invalidateQueries({ queryKey: ['track', trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error, { trackId }) => {
      console.error('Error liking track:', error);
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['track-stats', trackId] });
      toast.error('Не удалось поставить лайк');
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async ({ trackId }: LikeTrackParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      const { error } = await supabase
        .from('track_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId);

      if (error) throw error;
    },
    onMutate: async ({ trackId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['track-stats', trackId] });
      await queryClient.cancelQueries({ queryKey: ['track', trackId] });

      // Optimistic update - decrement like count
      queryClient.setQueryData(['track-stats', trackId], (old: any) => {
        if (!old) return { likesCount: 0, isLiked: false };
        return {
          ...old,
          likesCount: Math.max((old.likesCount || 0) - 1, 0),
          isLiked: false,
        };
      });

      triggerHapticFeedback('light');
    },
    onSuccess: (_, { trackId }) => {
      queryClient.invalidateQueries({ queryKey: ['track-stats', trackId] });
      queryClient.invalidateQueries({ queryKey: ['track', trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error, { trackId }) => {
      console.error('Error unliking track:', error);
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['track-stats', trackId] });
      toast.error('Не удалось убрать лайк');
    },
  });

  return {
    like: likeMutation.mutate,
    unlike: unlikeMutation.mutate,
    isLiking: likeMutation.isPending,
    isUnliking: unlikeMutation.isPending,
    isLoading: likeMutation.isPending || unlikeMutation.isPending,
  };
}
