// useAddComment Hook - Sprint 011 Task T051
// Add comment with @mention parsing and notifications

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  validateCommentContent,
  sanitizeContent,
  isCommentRateLimitExceeded,
} from '@/lib/content-moderation';
import {
  extractMentions,
  validateMentions,
  generateMentionNotifications,
  validateMentionLimit,
} from '@/lib/mention-parser';
import { toast } from 'sonner';
import type { CommentCreateInput } from '@/types/comment';

interface AddCommentParams {
  trackId: string;
  content: string;
  parentCommentId?: string;
}

/**
 * Hook to add a comment with mention support
 */
export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Rate limiting: track comment timestamps in memory
  const recentComments: Date[] = [];

  return useMutation({
    mutationFn: async ({ trackId, content, parentCommentId }: AddCommentParams) => {
      if (!user) {
        throw new Error('Must be logged in to comment');
      }

      // Rate limiting check
      if (isCommentRateLimitExceeded(recentComments)) {
        throw new Error(
          "You're commenting too fast. Please wait a moment."
        );
      }

      // Sanitize content
      const sanitized = sanitizeContent(content);

      // Validate content
      const validation = validateCommentContent(sanitized);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      // Extract mentions
      const rawMentions = extractMentions(sanitized);

      // Validate mentions
      const validatedMentions = await validateMentions(
        rawMentions,
        async (username) => {
          const { data } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .eq('username', username)
            .single();

          if (!data) return null;

          return {
            userId: data.user_id,
            displayName: data.display_name,
          };
        }
      );

      // Validate mention limit
      const mentionValidation = validateMentionLimit(validatedMentions);
      if (!mentionValidation.valid) {
        throw new Error(mentionValidation.reason);
      }

      // Insert comment
      const commentData: CommentCreateInput = {
        track_id: trackId,
        content: sanitized,
        parent_comment_id: parentCommentId,
      };

      const { data: comment, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      // Create notifications for mentions
      if (validatedMentions.length > 0) {
        const mentionNotifications = generateMentionNotifications(
          validatedMentions,
          comment.id,
          sanitized,
          user.id
        );

        const notificationInserts = mentionNotifications.map((notif) => ({
          user_id: notif.userId,
          actor_id: notif.actorId,
          notification_type: 'mention',
          entity_type: 'comment',
          entity_id: notif.entityId,
          content: notif.content,
          is_read: false,
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notificationInserts);

        if (notifError) {
          console.error('Error creating mention notifications:', notifError);
        }
      }

      // Create notification for parent comment owner (if reply)
      if (parentCommentId) {
        // Fetch parent comment owner
        const { data: parentComment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', parentCommentId)
          .single();

        if (parentComment && parentComment.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: parentComment.user_id,
            actor_id: user.id,
            notification_type: 'reply',
            entity_type: 'comment',
            entity_id: comment.id,
            content: `replied to your comment: "${sanitized.substring(0, 50)}${sanitized.length > 50 ? '...' : ''}"`,
            is_read: false,
          });
        }
      } else {
        // Create notification for track owner (if top-level comment)
        const { data: track } = await supabase
          .from('tracks')
          .select('user_id')
          .eq('id', trackId)
          .single();

        if (track && track.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: track.user_id,
            actor_id: user.id,
            notification_type: 'comment',
            entity_type: 'track',
            entity_id: trackId,
            content: `commented on your track: "${sanitized.substring(0, 50)}${sanitized.length > 50 ? '...' : ''}"`,
            is_read: false,
          });
        }
      }

      // Track for rate limiting
      recentComments.push(new Date());

      return { ...comment, mentions: validatedMentions };
    },
    onSuccess: (_, variables) => {
      // Invalidate comments queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.trackId, variables.parentCommentId],
      });

      // Also invalidate parent-less comments if this is a reply
      if (variables.parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ['comments', variables.trackId, undefined],
        });
      }

      toast.success('Comment added!');
    },
    onError: (error: Error) => {
      console.error('Add comment error:', error);
      toast.error(error.message || 'Failed to add comment');
    },
  });
}
