// CommentsList Component - Sprint 011 Task T045
// Virtualized list of top-level comments

import React, { useRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Loader2 } from 'lucide-react';
import { CommentThread } from './CommentThread';
import { CommentForm } from './CommentForm';
import { useComments, useAddComment } from '@/hooks/comments';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommentsListProps {
  trackId: string;
  className?: string;
}

/**
 * Virtualized list of top-level comments
 * Supports infinite scroll and real-time updates
 */
export function CommentsList({
  trackId,
  className,
}: CommentsListProps) {
  const { user } = useAuth();
  const virtuosoRef = useRef<any>(null);

  // Fetch top-level comments (no parent)
  const {
    comments,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComments({
    trackId,
    parentCommentId: undefined,
  });

  const addComment = useAddComment();

  const handleSubmit = async (content: string) => {
    await addComment.mutateAsync({
      trackId,
      content,
    });

    // Scroll to top to see new comment
    virtuosoRef.current?.scrollToIndex({
      index: 0,
      behavior: 'smooth',
    });
  };

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Empty state
  if (!isLoading && comments.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Comment form */}
        {user && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Add a comment</h3>
            <CommentForm
              onSubmit={handleSubmit}
              isSubmitting={addComment.isPending}
              placeholder="Be the first to comment..."
            />
          </div>
        )}

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">No comments yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {user
              ? 'Be the first to share your thoughts on this track!'
              : 'Sign in to be the first to comment on this track.'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">Failed to load comments</h3>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Something went wrong'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Comment form */}
      {user && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Comments ({comments.length})
          </h3>
          <CommentForm
            onSubmit={handleSubmit}
            isSubmitting={addComment.isPending}
            placeholder="Share your thoughts..."
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Comments count header */}
          {!user && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Comments ({comments.length})
              </h3>
            </div>
          )}

          {/* Virtualized comments list */}
          <div className="space-y-6">
            <Virtuoso
              ref={virtuosoRef}
              style={{ height: '600px' }}
              data={comments}
              endReached={loadMore}
              itemContent={(index, comment) => (
                <div className="pb-6">
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    trackId={trackId}
                    depth={0}
                  />
                </div>
              )}
              components={{
                Footer: () =>
                  isFetchingNextPage ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : hasNextPage ? (
                    <div className="flex justify-center py-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMore}
                      >
                        Load more comments
                      </Button>
                    </div>
                  ) : comments.length > 10 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      You've reached the end of comments
                    </div>
                  ) : null,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
