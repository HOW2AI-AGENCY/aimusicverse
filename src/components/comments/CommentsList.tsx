// CommentsList component - Sprint 011
import { useState } from 'react';
import { CommentItem, type Comment } from './CommentItem';
import { CommentForm } from './CommentForm';
import { useComments, useAddComment, useDeleteComment, type Comment as CommentType } from '@/hooks/comments/useComments';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentsListProps {
  trackId: string;
  className?: string;
}

export function CommentsList({ trackId, className }: CommentsListProps) {
  const { data: comments = [], isLoading } = useComments(trackId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);

  const handleSubmitComment = async (content: string, parentId?: string | null) => {
    await addComment.mutateAsync({ trackId, content, parentId: parentId || undefined });
    setReplyTo(null);
  };

  const handleReply = (commentId: string) => {
    const comment = comments.find((c: CommentType) => c.id === commentId);
    if (comment?.user) {
      setReplyTo({
        id: commentId,
        username: comment.user.username || comment.user.first_name || 'Пользователь',
      });
    }
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate({ commentId, trackId });
  };

  const handleReport = (commentId: string) => {
    // TODO: Implement report functionality
    console.log('Report comment:', commentId);
  };

  // Map CommentType to Comment interface expected by CommentItem
  const mappedComments: Comment[] = comments.map((c: CommentType) => ({
    id: c.id,
    content: c.content,
    user_id: c.user_id,
    track_id: c.track_id,
    parent_id: c.parent_id,
    likes_count: c.likes_count,
    created_at: c.created_at,
    is_liked: c.isLiked,
    user: c.user ? {
      username: c.user.username,
      photo_url: c.user.photo_url,
      display_name: c.user.first_name,
    } : undefined,
  }));

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Comment Form */}
      <CommentForm
        trackId={trackId}
        parentId={replyTo?.id}
        replyToUsername={replyTo?.username}
        onSubmit={handleSubmitComment}
        onCancelReply={() => setReplyTo(null)}
        isLoading={addComment.isPending}
      />

      {/* Comments List */}
      {mappedComments.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Пока нет комментариев. Будьте первым!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {mappedComments.map((comment: Comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              trackId={trackId}
              onReply={handleReply}
              onDelete={handleDelete}
              onReport={handleReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
