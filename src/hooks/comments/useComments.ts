// useComments Hook - Sprint 011 Task T050
// Query comments with infinite scroll and real-time subscriptions

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CommentWithUser } from '@/types/comment';

interface UseCommentsParams {
  trackId: string;
  parentCommentId?: string;
  enabled?: boolean;
}

interface CommentsPage {
  comments: CommentWithUser[];
  nextCursor?: string;
}

const COMMENTS_PER_PAGE = 50;

/**
 * Fetch comments with user data
 */
export function useComments({
  trackId,
  parentCommentId,
  enabled = true,
}: UseCommentsParams) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<CommentsPage>({
    queryKey: ['comments', trackId, parentCommentId],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam as number;

      // Build query
      let queryBuilder = supabase
        .from('comments')
        .select(
          `
          *,
          user:profiles!comments_user_id_fkey(
            user_id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `
        )
        .eq('track_id', trackId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + COMMENTS_PER_PAGE - 1);

      // Filter by parent comment if provided
      if (parentCommentId) {
        queryBuilder = queryBuilder.eq('parent_comment_id', parentCommentId);
      } else {
        queryBuilder = queryBuilder.is('parent_comment_id', null);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      // Transform to CommentWithUser format
      const comments: CommentWithUser[] = (data || []).map((comment) => ({
        id: comment.id,
        trackId: comment.track_id,
        userId: comment.user_id,
        parentCommentId: comment.parent_comment_id,
        content: comment.content,
        likesCount: comment.likes_count || 0,
        replyCount: comment.reply_count || 0,
        isEdited: comment.is_edited,
        isModerated: comment.is_moderated,
        moderationReason: comment.moderation_reason,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          id: comment.user?.user_id || comment.user_id,
          userId: comment.user?.user_id || comment.user_id,
          displayName: comment.user?.display_name,
          username: comment.user?.username,
          avatarUrl: comment.user?.avatar_url,
          isVerified: comment.user?.is_verified || false,
        },
      }));

      return {
        comments,
        nextCursor:
          comments.length === COMMENTS_PER_PAGE
            ? offset + COMMENTS_PER_PAGE
            : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !trackId) return;

    const channel = supabase
      .channel(`comments:track:${trackId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          // Only handle top-level comments or matching parent
          const newComment = payload.new;
          const matchesFilter = parentCommentId
            ? newComment.parent_comment_id === parentCommentId
            : !newComment.parent_comment_id;

          if (matchesFilter) {
            // Invalidate to refetch with user data
            queryClient.invalidateQueries({
              queryKey: ['comments', trackId, parentCommentId],
            });
          }
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
          // Invalidate on updates (edit, delete, likes)
          queryClient.invalidateQueries({
            queryKey: ['comments', trackId, parentCommentId],
          });
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
          // Invalidate on deletes
          queryClient.invalidateQueries({
            queryKey: ['comments', trackId, parentCommentId],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [enabled, trackId, parentCommentId, queryClient]);

  // Flatten all pages into single array
  const comments =
    query.data?.pages.flatMap((page) => page.comments) || [];

  return {
    comments,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
