// CommentItem component - Sprint 011
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Reply, MoreHorizontal, Flag, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLikeComment } from '@/hooks/engagement/useLikeComment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  track_id: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  is_liked?: boolean;
  user?: {
    username: string | null;
    photo_url: string | null;
    display_name: string | null;
  };
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  trackId: string;
  onReply?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onReport?: (commentId: string) => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  trackId,
  onReply,
  onDelete,
  onReport,
  isReply = false,
}: CommentItemProps) {
  const { user } = useAuth();
  const likeComment = useLikeComment();
  
  const isOwner = user?.id === comment.user_id;
  const displayName = comment.user?.display_name || comment.user?.username || 'Пользователь';
  
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ru,
  });

  const handleLike = () => {
    likeComment.mutate({
      commentId: comment.id,
      trackId,
      isCurrentlyLiked: comment.is_liked || false,
    });
  };

  return (
    <div className={cn('flex gap-3', isReply && 'ml-10')}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user?.photo_url || undefined} />
        <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2 gap-1',
              comment.is_liked && 'text-red-500'
            )}
            onClick={handleLike}
            disabled={likeComment.isPending}
          >
            <Heart className={cn('h-4 w-4', comment.is_liked && 'fill-current')} />
            {comment.likes_count > 0 && (
              <span className="text-xs">{comment.likes_count}</span>
            )}
          </Button>

          {!isReply && onReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => onReply(comment.id)}
            >
              <Reply className="h-4 w-4" />
              <span className="text-xs">Ответить</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && onDelete && (
                <DropdownMenuItem onClick={() => onDelete(comment.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              )}
              {!isOwner && onReport && (
                <DropdownMenuItem onClick={() => onReport(comment.id)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Пожаловаться
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                trackId={trackId}
                onDelete={onDelete}
                onReport={onReport}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
