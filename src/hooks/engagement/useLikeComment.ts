// useLikeComment Hook - Sprint 011 Task T063
// Like/unlike comments with optimistic updates

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LikeCommentParams {
  commentId: string;
  trackId: string;
}

/**
 * Hook to like/unlike a comment
 * Includes optimistic updates and notification creation
 */
export function useLikeComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, trackId }: LikeCommentParams) => {
      if (!user) {
        throw new Error('Must be logged in to like comments');
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      if (existingLike) {
        // Unlike: remove the like
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) {
          console.error('Error unliking comment:', error);
          throw error;
        }

        return { liked: false };
      } else {
        // Like: add the like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId,
          });

        if (error) {
          // Ignore duplicate errors (ON CONFLICT)
          if (error.code !== '23505') {
            console.error('Error liking comment:', error);
            throw error;
          }
        }

        // Create notification for comment owner (if not self)
        const { data: comment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', commentId)
          .single();

        if (comment && comment.user_id !== user.id) {
          // Check if notification already exists
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', comment.user_id)
            .eq('actor_id', user.id)
            .eq('entity_id', commentId)
            .eq('notification_type', 'like_comment')
            .single();

          if (!existingNotif) {
            await supabase.from('notifications').insert({
              user_id: comment.user_id,
              actor_id: user.id,
              notification_type: 'like_comment',
              entity_type: 'comment',
              entity_id: commentId,
              content: 'liked your comment',
              is_read: false,
            });
          }
        }

        return { liked: true };
      }
    },
    onMutate: async ({ commentId, trackId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['comment-liked', commentId] });
      await queryClient.cancelQueries({ queryKey: ['comments', trackId] });

      // Snapshot previous value
      const previousLiked = queryClient.getQueryData(['comment-liked', commentId]);

      // Optimistically update
      queryClient.setQueryData(['comment-liked', commentId], (old: boolean) => !old);

      return { previousLiked };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(
          ['comment-liked', variables.commentId],
          context.previousLiked
        );
      }
      console.error('Like comment error:', err);
      toast.error('Failed to like comment');
    },
    onSuccess: (result, variables) => {
      // Invalidate to refetch with updated counts
      queryClient.invalidateQueries({
        queryKey: ['comment-liked', variables.commentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.trackId],
      });
    },
  });
}

/**
 * Hook to check if current user has liked a comment
 */
export function useIsCommentLiked(commentId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comment-liked', commentId],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking if comment is liked:', error);
        throw error;
      }

      return !!data;
    },
    enabled: !!user && !!commentId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
