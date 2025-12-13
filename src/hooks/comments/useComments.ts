// useComments hook - Sprint 011 Phase 5
// Fetch comments with real-time subscriptions

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CommentThread, CommentWithUser } from '@/types/comment';

interface UseCommentsParams {
  trackId: string;
  sortBy?: 'newest' | 'oldest' | 'popular';
  enabled?: boolean;
}

export function useComments({ trackId, sortBy = 'newest', enabled = true }: UseCommentsParams) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['comments', trackId, sortBy],
    queryFn: async (): Promise<CommentThread[]> => {
      // Fetch top-level comments only
      let query = supabase
        .from('comments')
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
          moderation_reason,
          created_at,
          updated_at,
          user:profiles!comments_user_id_fkey (
            user_id,
            display_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('track_id', trackId)
        .is('parent_comment_id', null)
        .eq('is_moderated', false);

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data: comments, error } = await query;

      if (error) throw error;

      // Check if current user liked each comment
      let userLikes: Set<string> = new Set();
      if (user?.id && comments && comments.length > 0) {
        const commentIds = comments.map((c: any) => c.id);
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        if (likesData) {
          userLikes = new Set(likesData.map((l) => l.comment_id));
        }
      }

      return (comments || []).map((comment: any) => ({
        id: comment.id,
        trackId: comment.track_id,
        userId: comment.user_id,
        parentCommentId: comment.parent_comment_id || undefined,
        content: comment.content,
        likesCount: comment.likes_count,
        replyCount: comment.reply_count,
        isEdited: comment.is_edited,
        isModerated: comment.is_moderated,
        moderationReason: comment.moderation_reason || undefined,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          id: comment.user.user_id,
          userId: comment.user.user_id,
          displayName: comment.user.display_name || undefined,
          username: comment.user.username || undefined,
          avatarUrl: comment.user.avatar_url || undefined,
          isVerified: comment.user.is_verified || false,
        },
        isLiked: userLikes.has(comment.id),
        replies: [],
        hasMoreReplies: comment.reply_count > 0,
        depth: 0,
      }));
    },
    enabled: !!trackId && enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Real-time subscription for new comments
  useEffect(() => {
    if (!trackId || !enabled) return;

    const channel = supabase
      .channel(`comments:${trackId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `track_id=eq.${trackId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `track_id=eq.${trackId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `track_id=eq.${trackId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trackId, enabled, queryClient]);

  return query;
}
