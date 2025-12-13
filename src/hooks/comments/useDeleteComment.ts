// useDeleteComment hook - Sprint 011 Phase 5
// Soft/hard delete comment based on replies

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface DeleteCommentParams {
  commentId: string;
  trackId: string;
  hasReplies: boolean;
  parentCommentId?: string;
}

export function useDeleteComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();

  return useMutation({
    mutationFn: async ({ commentId, hasReplies, parentCommentId }: DeleteCommentParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      if (hasReplies) {
        // Soft delete: mark as moderated with special reason
        const { error } = await supabase
          .from('comments')
          .update({
            content: '[Комментарий удален]',
            is_moderated: true,
            moderation_reason: 'deleted_by_author',
            updated_at: new Date().toISOString(),
          })
          .eq('id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Hard delete: completely remove comment
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;

        // If this was a reply, decrement parent's reply_count
        if (parentCommentId) {
          const { error: updateError } = await supabase.rpc('decrement_comment_reply_count', {
            comment_id: parentCommentId,
          });

          if (updateError) {
            console.error('Error decrementing reply count:', updateError);
          }
        }
      }

      return { commentId, hasReplies };
    },
    onSuccess: ({ hasReplies }, { trackId, parentCommentId }) => {
      // Invalidate comments queries
      queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
      if (parentCommentId) {
        queryClient.invalidateQueries({ queryKey: ['comment-replies', parentCommentId] });
      }

      triggerHapticFeedback('medium');
      toast.success(hasReplies ? 'Комментарий скрыт' : 'Комментарий удален');
    },
    onError: (error: any) => {
      console.error('Error deleting comment:', error);
      toast.error('Не удалось удалить комментарий');
    },
  });
}
