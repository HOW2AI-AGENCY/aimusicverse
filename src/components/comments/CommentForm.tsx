// CommentForm component - Sprint 011
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  trackId: string;
  parentId?: string | null;
  replyToUsername?: string | null;
  onSubmit: (content: string, parentId?: string | null) => Promise<void>;
  onCancelReply?: () => void;
  isLoading?: boolean;
  className?: string;
  userDisplayName?: string;
  userAvatarUrl?: string | null;
  id?: string; // Sprint 32: Add id for anchoring from FirstCommentCTA
}

export function CommentForm({
  trackId,
  parentId,
  replyToUsername,
  onSubmit,
  onCancelReply,
  isLoading = false,
  className,
  userDisplayName = 'Вы',
  userAvatarUrl,
  id,
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    await onSubmit(content.trim(), parentId);
    setContent('');
  };

  if (!user) {
    return (
      <div className={cn('p-4 bg-accent/30 rounded-lg text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Войдите, чтобы оставить комментарий
        </p>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      {replyToUsername && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Ответ для @{replyToUsername}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={userAvatarUrl || undefined} />
          <AvatarFallback>{userDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentId ? 'Напишите ответ...' : 'Напишите комментарий...'}
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isLoading}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isLoading ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
