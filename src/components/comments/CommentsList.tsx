// CommentsList component - Sprint 011
import { useState } from 'react';
import { CommentItem, type Comment } from './CommentItem';
import { CommentForm } from './CommentForm';
import { ReportCommentDialog } from './ReportCommentDialog';
import { useComments, useAddComment, useDeleteComment, type Comment as CommentType } from '@/hooks/comments/useComments';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
// Sprint 32: Comment engagement components
import { FirstCommentCTA } from '@/components/comments/FirstCommentCTA';
import { CommentSuggestions } from '@/components/comments/CommentSuggestions';
import type { Track } from '@/types/track';
import { CommentsSectionSkeleton } from '@/components/ui/skeletons/TrackListSkeleton';

interface CommentsListProps {
  trackId: string;
  trackTitle?: string;
  track?: Track; // Add track prop for context-aware suggestions
  className?: string;
}

export function CommentsList({ trackId, trackTitle, track, className }: CommentsListProps) {
  const title = track?.title || trackTitle;
  const { data: comments = [], isLoading } = useComments(trackId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    commentId: string;
    userId: string;
    preview: string;
  } | null>(null);

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
    const comment = comments.find((c: CommentType) => c.id === commentId);
    if (comment) {
      setReportTarget({
        commentId: comment.id,
        userId: comment.user_id,
        preview: comment.content,
      });
    }
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
        <CommentsSectionSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Sprint 32: Comment Suggestions - shown before form */}
      {mappedComments.length === 0 && (
        <>
          {/* First Comment CTA - shown when no comments yet */}
          <div className="mb-4">
            <FirstCommentCTA
              trackId={trackId}
              trackTitle={title || 'этот трек'}
              variant="card"
              onOpenComments={() => {
                document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          {/* Comment Suggestions - context-aware by track style/mood */}
          <CommentSuggestions
            trackStyle={track?.style || undefined}
            trackMood={undefined}
            maxSuggestions={4}
            variant="chips"
            onSuggestionSelect={(suggestion) => {
              const formInput = document.querySelector('#comment-form textarea') as HTMLTextAreaElement;
              if (formInput) {
                formInput.value = suggestion;
                formInput.focus();
                formInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }}
            className="mb-3"
          />
        </>
      )}

      {/* Comment Form */}
      <CommentForm
        id="comment-form"
        trackId={trackId}
        parentId={replyTo?.id}
        replyToUsername={replyTo?.username}
        onSubmit={handleSubmitComment}
        onCancelReply={() => setReplyTo(null)}
        isLoading={addComment.isPending}
      />

      {/* Comments List */}
      {mappedComments.length === 0 ? (
        <div className="py-6 text-center bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-border/30">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium text-foreground mb-1">
            Будьте первым!
          </p>
          <p className="text-sm text-muted-foreground">
            Оставьте комментарий и начните обсуждение
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

      {/* Report Dialog */}
      {reportTarget && (
        <ReportCommentDialog
          open={!!reportTarget}
          onOpenChange={(open) => !open && setReportTarget(null)}
          commentId={reportTarget.commentId}
          commentUserId={reportTarget.userId}
          commentPreview={reportTarget.preview}
        />
      )}
    </div>
  );
}
