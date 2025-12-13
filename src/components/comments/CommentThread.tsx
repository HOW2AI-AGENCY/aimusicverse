// CommentThread component - Sprint 011 Phase 5
// Recursive nested replies (max 5 levels deep)

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CommentItem } from './CommentItem';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommentThread as CommentThreadType, CommentWithUser } from '@/types/comment';

interface CommentThreadProps {
  comment: CommentThreadType;
  trackId: string;
  depth?: number;
  onLikeComment?: (commentId: string) => void;
  className?: string;
}

const MAX_DEPTH = 5;

export function CommentThread({
  comment,
  trackId,
  depth = 0,
  onLikeComment,
  className,
}: CommentThreadProps) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first 2 levels
  const [fetchReplies, setFetchReplies] = useState(false);

  // Fetch replies when expanded
  const { data: replies, isLoading } = useQuery({
    queryKey: ['comment-replies', comment.id],
    queryFn: async (): Promise<CommentWithUser[]> => {
      const { data, error } = await supabase
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
        .eq('parent_comment_id', comment.id)
        .eq('is_moderated', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check if user liked each reply
      let userLikes: Set<string> = new Set();
      if (user?.id && data && data.length > 0) {
        const replyIds = data.map((r: any) => r.id);
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', replyIds);

        if (likesData) {
          userLikes = new Set(likesData.map((l) => l.comment_id));
        }
      }

      return (data || []).map((reply: any) => ({
        id: reply.id,
        trackId: reply.track_id,
        userId: reply.user_id,
        parentCommentId: reply.parent_comment_id,
        content: reply.content,
        likesCount: reply.likes_count,
        replyCount: reply.reply_count,
        isEdited: reply.is_edited,
        isModerated: reply.is_moderated,
        moderationReason: reply.moderation_reason || undefined,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
        user: {
          id: reply.user.user_id,
          userId: reply.user.user_id,
          displayName: reply.user.display_name || undefined,
          username: reply.user.username || undefined,
          avatarUrl: reply.user.avatar_url || undefined,
          isVerified: reply.user.is_verified || false,
        },
        isLiked: userLikes.has(reply.id),
      }));
    },
    enabled: fetchReplies && showReplies && comment.replyCount > 0,
    staleTime: 30 * 1000,
  });

  const hasReplies = comment.replyCount > 0;
  const canShowMore = depth < MAX_DEPTH && hasReplies;

  const handleToggleReplies = () => {
    if (!fetchReplies) {
      setFetchReplies(true);
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Comment */}
      <CommentItem
        comment={comment}
        trackId={trackId}
        depth={depth}
        onLike={() => onLikeComment?.(comment.id)}
      />

      {/* Show/Hide Replies Button */}
      {canShowMore && (
        <div className={cn('ml-11', depth > 0 && 'border-l-2 border-border pl-4')}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleReplies}
            className="h-7 text-xs text-muted-foreground"
          >
            {showReplies ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Скрыть ответы ({comment.replyCount})
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Показать ответы ({comment.replyCount})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Nested Replies */}
      {showReplies && hasReplies && (
        <div className={cn('ml-11 space-y-3', depth > 0 && 'border-l-2 border-border pl-4')}>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : replies && replies.length > 0 ? (
            replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={{ ...reply, replies: [], hasMoreReplies: reply.replyCount > 0, depth: depth + 1 }}
                trackId={trackId}
                depth={depth + 1}
                onLikeComment={onLikeComment}
              />
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}
