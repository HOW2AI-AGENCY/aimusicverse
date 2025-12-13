// useFollow hook - Sprint 011
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  const { data: isFollowing, isLoading: isCheckingFollow } = useQuery({
    queryKey: ['follow-status', targetUserId, user?.id],
    queryFn: async () => {
      if (!user?.id || user.id === targetUserId) return false;
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Не авторизован');

      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        if (error) throw error;
        return { action: 'unfollow' as const };
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
        return { action: 'follow' as const };
      }
    },
    onMutate: () => {
      haptic.impact('light');
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(result.action === 'follow' ? 'Вы подписались' : 'Вы отписались');
    },
    onError: (error) => {
      console.error('Error toggling follow:', error);
      toast.error('Не удалось выполнить действие');
    },
  });

  return {
    isFollowing: isFollowing ?? false,
    isLoading: isCheckingFollow || followMutation.isPending,
    toggleFollow: followMutation.mutate,
  };
}
