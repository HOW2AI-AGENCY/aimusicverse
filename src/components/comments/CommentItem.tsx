// CommentItem Component - Sprint 011 Task T046
// Single comment display with actions

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, MoreVertical, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteComment } from '@/hooks/comments';
import { cn } from '@/lib/utils';
import type { CommentWithUser } from '@/types/comment';

interface CommentItemProps {
  comment: CommentWithUser;
  trackId: string;
  onReply?: () => void;
  onEdit?: () => void;
  onLike?: () => void;
  className?: string;
}

/**
 * Single comment display with user info, content, and actions
 */
export function CommentItem({
  comment,
  trackId,
  onReply,
  onEdit,
  onLike,
  className,
}: CommentItemProps) {
  const { user } = useAuth();
  const deleteComment = useDeleteComment();
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnComment = user?.id === comment.userId;
  const isDeleted = comment.content === '[Deleted]';

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      await deleteComment.mutateAsync({
        commentId: comment.id,
        trackId,
        parentCommentId: comment.parentCommentId,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  return (
    <div className={cn('flex gap-3', className)}>
      {/* User avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage
          src={comment.user.avatarUrl}
          alt={comment.user.displayName || comment.user.username || 'User'}
        />
        <AvatarFallback>
          {(comment.user.displayName || comment.user.username || 'U')[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Comment content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header: user info and menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* User name */}
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-semibold text-sm truncate">
                {comment.user.displayName || comment.user.username || 'Unknown User'}
              </span>
              {comment.user.isVerified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>

            {/* Timestamp */}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo}
            </span>

            {/* Edited indicator */}
            {comment.isEdited && !isDeleted && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                (edited)
              </span>
            )}
          </div>

          {/* Actions menu */}
          {isOwnComment && !isDeleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Comment content */}
        <div
          className={cn(
            'text-sm',
            isDeleted && 'text-muted-foreground italic'
          )}
        >
          {comment.content}
        </div>

        {/* Action buttons */}
        {!isDeleted && (
          <div className="flex items-center gap-4">
            {/* Like button */}
            {onLike && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <Heart
                  className={cn(
                    'h-4 w-4',
                    comment.isLiked && 'fill-red-500 text-red-500'
                  )}
                />
                {comment.likesCount > 0 && (
                  <span className="text-xs">{comment.likesCount}</span>
                )}
              </Button>
            )}

            {/* Reply button */}
            {onReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                {comment.replyCount > 0 && (
                  <span className="text-xs">{comment.replyCount}</span>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
