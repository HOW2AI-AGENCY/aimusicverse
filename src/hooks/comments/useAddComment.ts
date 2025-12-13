// useAddComment hook - Sprint 011 Phase 5
// Create comment with @mention parsing

import { useMutation, useQueryClient } from '@tantml:react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface AddCommentParams {
  trackId: string;
  content: string;
  parentCommentId?: string;
}

// Parse @mentions from comment content
function parseMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]); // Extract username without @
  }

  return mentions;
}

export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerHapticFeedback } = useHapticFeedback();

  return useMutation({
    mutationFn: async ({ trackId, content, parentCommentId }: AddCommentParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      const trimmedContent = content.trim();
      if (!trimmedContent) throw new Error('Комментарий не может быть пустым');
      if (trimmedContent.length > 2000) throw new Error('Комментарий слишком длинный (макс. 2000 символов)');

      // Parse mentions
      const mentions = parseMentions(trimmedContent);

      // Insert comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          track_id: trackId,
          user_id: user.id,
          parent_comment_id: parentCommentId || null,
          content: trimmedContent,
        })
        .select(`
          id,
          track_id,
          user_id,
          parent_comment_id,
          content,
          likes_count,
          reply_count,
          is_edited,
          is_moderated,
          created_at,
          updated_at
        `)
        .single();

      if (commentError) throw commentError;

      // If parent comment exists, increment its reply_count
      if (parentCommentId) {
        const { error: updateError } = await supabase.rpc('increment_comment_reply_count', {
          comment_id: parentCommentId,
        });

        if (updateError) {
          console.error('Error incrementing reply count:', updateError);
        }
      }

      // TODO: Create notifications for mentions
      // This would be handled by a database trigger or edge function in production

      return comment;
    },
    onSuccess: (data, { trackId, parentCommentId }) => {
      // Invalidate comments queries
      queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
      if (parentCommentId) {
        queryClient.invalidateQueries({ queryKey: ['comment-replies', parentCommentId] });
      }

      triggerHapticFeedback('light');
      toast.success('Комментарий добавлен');
    },
    onError: (error: any) => {
      console.error('Error adding comment:', error);
      const message = error.message || 'Не удалось добавить комментарий';
      toast.error(message);
    },
  });
}
