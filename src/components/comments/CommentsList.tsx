// CommentsList component - Sprint 011 Phase 5
// Virtualized top-level comments list with sorting

import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useComments } from '@/hooks/comments/useComments';
import { useLikeComment } from '@/hooks/engagement/useLikeComment';
import { CommentForm } from './CommentForm';
import { CommentThread } from './CommentThread';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Loader2, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentsListProps {
  trackId: string;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'popular';

export function CommentsList({ trackId, className }: CommentsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const { data: comments, isLoading, error } = useComments({ trackId, sortBy });
  const { mutate: likeComment } = useLikeComment();

  const handleLikeComment = (commentId: string) => {
    likeComment({ commentId, trackId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Не удалось загрузить комментарии</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Комментарии
          {comments && comments.length > 0 && (
            <span className="text-sm text-muted-foreground">({comments.length})</span>
          )}
        </h3>

        {comments && comments.length > 0 && (
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Сначала новые
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 rotate-180" />
                  Сначала старые
                </div>
              </SelectItem>
              <SelectItem value="popular">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Популярные
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Comment Form */}
      <CommentForm trackId={trackId} />

      {/* Comments List */}
      {comments && comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              trackId={trackId}
              onLikeComment={handleLikeComment}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Пока нет комментариев. Будьте первым!
          </p>
        </div>
      )}
    </div>
  );
}
