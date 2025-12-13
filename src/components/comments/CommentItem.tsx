// CommentItem component - Sprint 011 Phase 5
// Single comment display with actions (like, reply, delete, report)

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteComment } from '@/hooks/comments/useDeleteComment';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CommentForm } from './CommentForm';
import { Heart, MessageCircle, MoreVertical, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { CommentWithUser } from '@/types/comment';
import { useNavigate } from 'react-router-dom';

interface CommentItemProps {
  comment: CommentWithUser;
  trackId: string;
  onReply?: () => void;
  onLike?: () => void;
  depth?: number;
  className?: string;
}

const MAX_DEPTH = 5;

export function CommentItem({
  comment,
  trackId,
  onReply,
  onLike,
  depth = 0,
  className,
}: CommentItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();

  const isOwnComment = user?.id === comment.userId;
  const canReply = depth < MAX_DEPTH;
  const hasReplies = comment.replyCount > 0;

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: ru,
  });

  const handleDelete = () => {
    deleteComment({
      commentId: comment.id,
      trackId,
      hasReplies,
      parentCommentId: comment.parentCommentId,
    });
    setShowDeleteDialog(false);
  };

  const handleReplyClick = () => {
    if (canReply) {
      setShowReplyForm(!showReplyForm);
      onReply?.();
    }
  };

  return (
    <div className={cn('flex gap-3', className)}>
      <Avatar
        className="h-8 w-8 cursor-pointer flex-shrink-0"
        onClick={() => navigate(`/profile/${comment.userId}`)}
      >
        <AvatarImage src={comment.user.avatarUrl} alt={comment.user.displayName || comment.user.username} />
        <AvatarFallback>
          {(comment.user.displayName || comment.user.username || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate(`/profile/${comment.userId}`)}
              className="font-medium text-sm hover:underline truncate"
            >
              {comment.user.displayName || comment.user.username || 'Пользователь'}
            </button>
            {comment.user.isVerified && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
            <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo}</span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground flex-shrink-0">(изм.)</span>
            )}
          </div>

          {isOwnComment && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={cn('h-7 px-2', comment.isLiked && 'text-red-500')}
          >
            <Heart className={cn('h-4 w-4', comment.isLiked && 'fill-current')} />
            {comment.likesCount > 0 && (
              <span className="ml-1 text-xs">{comment.likesCount}</span>
            )}
          </Button>

          {canReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplyClick}
              className="h-7 px-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="ml-1 text-xs">Ответить</span>
            </Button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="pt-2">
            <CommentForm
              trackId={trackId}
              parentCommentId={comment.id}
              placeholder={`Ответ ${comment.user.displayName || comment.user.username}...`}
              autoFocus
              onSuccess={() => setShowReplyForm(false)}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
              <AlertDialogDescription>
                {hasReplies
                  ? 'У этого комментария есть ответы. Комментарий будет скрыт, но ответы останутся.'
                  : 'Это действие нельзя отменить. Комментарий будет удален навсегда.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {hasReplies ? 'Скрыть' : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
