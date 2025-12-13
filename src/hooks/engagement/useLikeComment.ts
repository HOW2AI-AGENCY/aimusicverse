// useLikeComment hook - Sprint 011
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface LikeCommentParams {
  commentId: string;
  trackId: string;
  isCurrentlyLiked: boolean;
}

export function useLikeComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  return useMutation({
    mutationFn: async ({ commentId, isCurrentlyLiked }: LikeCommentParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
        if (error) throw error;
        return { action: 'unlike' as const };
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
        return { action: 'like' as const };
      }
    },
    onMutate: () => {
      haptic.impact('light');
    },
    onSuccess: (_, { trackId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
    },
    onError: (error) => {
      console.error('Error toggling comment like:', error);
      toast.error('Не удалось обновить лайк');
    },
  });
}
