// CommentThread Component - Sprint 011 Task T047
// Recursive threaded comments (max 5 levels deep)

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useComments, useAddComment } from '@/hooks/comments';
import { cn } from '@/lib/utils';
import type { CommentWithUser } from '@/types/comment';

interface CommentThreadProps {
  comment: CommentWithUser;
  trackId: string;
  depth?: number;
  maxDepth?: number;
  onLike?: (commentId: string) => void;
  className?: string;
}

const MAX_THREAD_DEPTH = 5;

/**
 * Recursive comment thread component
 * Supports up to 5 levels of nesting with collapse/expand
 */
export function CommentThread({
  comment,
  trackId,
  depth = 0,
  maxDepth = MAX_THREAD_DEPTH,
  onLike,
  className,
}: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first 2 levels

  const addComment = useAddComment();

  // Fetch replies for this comment
  const {
    comments: replies,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useComments({
    trackId,
    parentCommentId: comment.id,
    enabled: showReplies && comment.replyCount > 0,
  });

  const hasReplies = comment.replyCount > 0;
  const canReply = depth < maxDepth;

  const handleReply = () => {
    setShowReplyForm(!showReplyForm);
    if (!showReplies) {
      setShowReplies(true);
    }
  };

  const handleSubmitReply = async (content: string) => {
    await addComment.mutateAsync({
      trackId,
      content,
      parentCommentId: comment.id,
    });
    setShowReplyForm(false);
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main comment */}
      <CommentItem
        comment={comment}
        trackId={trackId}
        onReply={canReply ? handleReply : undefined}
        onLike={onLike ? () => onLike(comment.id) : undefined}
      />

      {/* Reply form */}
      {showReplyForm && canReply && (
        <div className="ml-12 mt-3">
          <CommentForm
            onSubmit={handleSubmitReply}
            isSubmitting={addComment.isPending}
            placeholder={`Reply to ${comment.user.displayName || comment.user.username}...`}
            autoFocus
          />
        </div>
      )}

      {/* Toggle replies button */}
      {hasReplies && (
        <div className="ml-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleReplies}
            className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
          >
            {showReplies ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="text-xs">
              {showReplies ? 'Hide' : 'Show'} {comment.replyCount}{' '}
              {comment.replyCount === 1 ? 'reply' : 'replies'}
            </span>
          </Button>
        </div>
      )}

      {/* Nested replies */}
      {showReplies && hasReplies && (
        <div className="ml-12 space-y-3 border-l-2 border-muted pl-4">
          {isLoading && (
            <div className="text-sm text-muted-foreground py-4">
              Loading replies...
            </div>
          )}

          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              trackId={trackId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onLike={onLike}
            />
          ))}

          {/* Load more button */}
          {hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Load more replies
            </Button>
          )}

          {/* Max depth indicator */}
          {depth >= maxDepth - 1 && hasReplies && (
            <div className="text-xs text-muted-foreground italic py-2">
              Maximum thread depth reached. View full thread on comment page.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
