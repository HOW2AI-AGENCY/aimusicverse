// useDeleteComment Hook - Sprint 011 Task T052
// Delete comment with soft/hard delete logic

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DeleteCommentParams {
  commentId: string;
  trackId: string;
  parentCommentId?: string;
}

/**
 * Hook to delete a comment
 * Uses soft delete if comment has replies, hard delete otherwise
 */
export function useDeleteComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      trackId,
      parentCommentId,
    }: DeleteCommentParams) => {
      if (!user) {
        throw new Error('Must be logged in to delete comment');
      }

      // Fetch comment to check ownership and reply count
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id, reply_count')
        .eq('id', commentId)
        .single();

      if (fetchError) {
        console.error('Error fetching comment:', fetchError);
        throw fetchError;
      }

      // Verify ownership
      if (comment.user_id !== user.id) {
        throw new Error('You can only delete your own comments');
      }

      // Determine delete strategy
      if (comment.reply_count > 0) {
        // Soft delete: replace content with [Deleted]
        const { error: updateError } = await supabase
          .from('comments')
          .update({
            content: '[Deleted]',
            is_moderated: true,
            moderation_reason: 'User deleted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', commentId);

        if (updateError) {
          console.error('Error soft deleting comment:', updateError);
          throw updateError;
        }

        return { deleted: false, commentId };
      } else {
        // Hard delete: remove from database
        const { error: deleteError } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);

        if (deleteError) {
          console.error('Error hard deleting comment:', deleteError);
          throw deleteError;
        }

        return { deleted: true, commentId };
      }
    },
    onSuccess: (result, variables) => {
      // Invalidate comments queries
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.trackId, variables.parentCommentId],
      });

      // Also invalidate parent-less comments if this is a reply
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ['comments', variables.trackId, undefined],
        });
      }

      toast.success(
        result.deleted
          ? 'Comment deleted'
          : 'Comment hidden (has replies)'
      );
    },
    onError: (error: Error) => {
      console.error('Delete comment error:', error);
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}
