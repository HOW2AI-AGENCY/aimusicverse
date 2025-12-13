// useFollow hook - Sprint 011 Phase 4
// Follow/unfollow users with optimistic UI updates

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface FollowParams {
  followingId: string;
}

export function useFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();

  const followMutation = useMutation({
    mutationFn: async ({ followingId }: FollowParams) => {
      if (!user?.id) throw new Error('Не авторизован');
      if (user.id === followingId) throw new Error('Нельзя подписаться на самого себя');

      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: followingId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ followingId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['profile', followingId] });
      await queryClient.cancelQueries({ queryKey: ['followers', followingId] });
      await queryClient.cancelQueries({ queryKey: ['following', user?.id] });

      // Optimistic update - increment follower count
      queryClient.setQueryData(['profile', followingId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          stats: {
            ...old.stats,
            followers: (old.stats?.followers || 0) + 1,
          },
        };
      });

      triggerHapticFeedback('light');
    },
    onSuccess: (_, { followingId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', followingId] });
      queryClient.invalidateQueries({ queryKey: ['followers', followingId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast.success('Вы подписались');
    },
    onError: (error, { followingId }) => {
      console.error('Error following user:', error);
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['profile', followingId] });
      toast.error('Не удалось подписаться');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async ({ followingId }: FollowParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;
    },
    onMutate: async ({ followingId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['profile', followingId] });
      await queryClient.cancelQueries({ queryKey: ['followers', followingId] });
      await queryClient.cancelQueries({ queryKey: ['following', user?.id] });

      // Optimistic update - decrement follower count
      queryClient.setQueryData(['profile', followingId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          stats: {
            ...old.stats,
            followers: Math.max((old.stats?.followers || 0) - 1, 0),
          },
        };
      });

      triggerHapticFeedback('light');
    },
    onSuccess: (_, { followingId }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', followingId] });
      queryClient.invalidateQueries({ queryKey: ['followers', followingId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      toast.success('Вы отписались');
    },
    onError: (error, { followingId }) => {
      console.error('Error unfollowing user:', error);
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['profile', followingId] });
      toast.error('Не удалось отписаться');
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  };
}
