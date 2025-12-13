// CommentForm component - Sprint 011 Phase 5
// Textarea with character counter and @mention support
// Enhanced with profanity filter (T098)

import { useState, useRef, KeyboardEvent } from 'react';
import { useAddComment } from '@/hooks/comments/useAddComment';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MentionInput } from './MentionInput';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateCommentContent } from '@/lib/content-moderation';

interface CommentFormProps {
  trackId: string;
  parentCommentId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const MAX_COMMENT_LENGTH = 2000;

export function CommentForm({
  trackId,
  parentCommentId,
  placeholder = 'Добавить комментарий...',
  autoFocus = false,
  onSuccess,
  onCancel,
  className,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: addComment, isPending } = useAddComment();

  const remainingChars = MAX_COMMENT_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars < 100 && remainingChars >= 0;

  const handleSubmit = () => {
    if (!content.trim() || isOverLimit || isPending) return;

    // Validate content for profanity and spam (T098)
    const validation = validateCommentContent(content.trim());
    if (!validation.valid) {
      setValidationError(validation.reason || 'Invalid comment');
      return;
    }
    
    // Clear validation error
    setValidationError(null);

    addComment(
      {
        trackId,
        content: content.trim(),
        parentCommentId,
      },
      {
        onSuccess: () => {
          setContent('');
          onSuccess?.();
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }

    // Check for @ symbol to show mention dropdown
    if (e.key === '@') {
      setShowMentions(true);
    }

    // Hide mentions on Escape
    if (e.key === 'Escape') {
      setShowMentions(false);
      if (onCancel) {
        onCancel();
      }
    }
  };

  const handleMentionSelect = (username: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || content.length;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const newContent =
        content.slice(0, lastAtIndex) +
        `@${username} ` +
        textAfterCursor;
      setContent(newContent);
    }

    setShowMentions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            // Clear validation error on change
            if (validationError) setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isPending}
          className={cn(
            'min-h-[80px] resize-none',
            isOverLimit && 'border-destructive focus-visible:ring-destructive',
            validationError && 'border-destructive focus-visible:ring-destructive'
          )}
        />

        {showMentions && (
          <MentionInput
            // Note: Using split('@').pop() is a simplification
            // For cursor-aware mention detection, track textarea.selectionStart
            searchQuery={content.split('@').pop() || ''}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentions(false)}
          />
        )}
      </div>

      {/* Validation error message (T098) */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn(isOverLimit && 'text-destructive', isNearLimit && 'text-yellow-500')}>
            {remainingChars} символов
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span>Ctrl+Enter для отправки</span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
              Отмена
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isOverLimit || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Отправка...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="ml-2">Отправить</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
