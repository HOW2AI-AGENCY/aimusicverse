// CommentForm Component - Sprint 011 Task T048
// Form for adding comments with character counter and validation

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { validateCommentContent } from '@/lib/content-moderation';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
  className?: string;
  onMentionTrigger?: (query: string, position: number) => void;
}

const MAX_COMMENT_LENGTH = 2000;

/**
 * Comment form with character counter and validation
 */
export function CommentForm({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Write a comment...',
  autoFocus = false,
  maxLength = MAX_COMMENT_LENGTH,
  className,
  onMentionTrigger,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remainingChars = maxLength - content.length;
  const isNearLimit = remainingChars <= 100;
  const isOverLimit = remainingChars < 0;

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      setError(null);

      // Check for @mention trigger
      if (onMentionTrigger) {
        const cursorPosition = e.target.selectionStart;
        const beforeCursor = newContent.substring(0, cursorPosition);
        const lastAtIndex = beforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
          const afterAt = beforeCursor.substring(lastAtIndex + 1);
          // Only trigger if no space after @
          if (!afterAt.includes(' ')) {
            onMentionTrigger(afterAt, lastAtIndex);
          }
        }
      }
    },
    [onMentionTrigger]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate content
      const validation = validateCommentContent(content);
      if (!validation.valid) {
        setError(validation.reason || 'Invalid comment');
        return;
      }

      // Submit
      onSubmit(content);

      // Clear form on success
      setContent('');
      setError(null);
    },
    [content, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder={placeholder}
          disabled={isSubmitting}
          autoFocus={autoFocus}
          rows={3}
          className={cn(
            'resize-none',
            isOverLimit && 'border-destructive focus-visible:ring-destructive'
          )}
        />

        <div className="flex items-center justify-between text-sm">
          {/* Character counter */}
          <span
            className={cn(
              'text-muted-foreground',
              isNearLimit && !isOverLimit && 'text-warning',
              isOverLimit && 'text-destructive font-medium'
            )}
          >
            {remainingChars} characters remaining
          </span>

          {/* Mention hint */}
          <span className="text-muted-foreground text-xs">
            Type @ to mention users
          </span>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim() || isOverLimit}
          size="sm"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}
