// useLikeComment hook - Sprint 011 Phase 6
// Like/unlike comments with optimistic UI updates

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface LikeCommentParams {
  commentId: string;
  trackId: string;
}

export function useLikeComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();

  const likeMutation = useMutation({
    mutationFn: async ({ commentId }: LikeCommentParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);

        if (error) throw error;
        return { action: 'unlike' as const };
      } else {
        // Like
        const { data, error } = await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId,
          })
          .select()
          .single();

        if (error) throw error;
        return { action: 'like' as const, data };
      }
    },
    onMutate: async ({ commentId, trackId }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['comments', trackId] });
      await queryClient.cancelQueries({ queryKey: ['comment-replies'] });

      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['comments', trackId] }, (old: any) => {
        if (!old) return old;

        const updateComment = (comment: any): any => {
          if (comment.id === commentId) {
            const isCurrentlyLiked = comment.isLiked || false;
            return {
              ...comment,
              isLiked: !isCurrentlyLiked,
              likesCount: isCurrentlyLiked
                ? Math.max((comment.likesCount || 0) - 1, 0)
                : (comment.likesCount || 0) + 1,
            };
          }
          return comment;
        };

        return Array.isArray(old) ? old.map(updateComment) : old;
      });

      triggerHapticFeedback('light');
    },
    onSuccess: (result, { trackId, commentId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
      queryClient.invalidateQueries({ queryKey: ['comment-replies'] });
    },
    onError: (error, { trackId }) => {
      console.error('Error liking/unliking comment:', error);
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
      toast.error('Не удалось обновить лайк');
    },
  });

  return {
    mutate: likeMutation.mutate,
    isLoading: likeMutation.isPending,
  };
}
