/**
 * Integration Patch for CommentsList.tsx
 * Adds Sprint 32 comment engagement components
 *
 * Инструкция по применению:
 * 1. Открыть src/components/comments/CommentsList.tsx
 * 2. Добавить импорты
 * 3. Добавить компоненты в соответствующие места
 */

// ============ STEP 1: Add imports after existing imports ============
// После строки ~9 (после import { cn } from '@/lib/utils')

import { FirstCommentCTA } from '@/components/comments/FirstCommentCTA';
import { CommentSuggestions } from '@/components/comments/CommentSuggestions';
import { Track } from '@/integrations/supabase/types/track';

// ============ STEP 2: Add track prop to CommentsListProps ============
// Заменить interface на:

interface CommentsListProps {
  trackId: string;
  trackTitle?: string;
  track?: Track; // Add track prop for context-aware suggestions
  className?: string;
}

// ============ STEP 3: Update component signature ============
// Заменить строку ~16:

export function CommentsList({ trackId, trackTitle, track, className }: CommentsListProps) {
  // ... existing code

  ============

export function CommentsList({ trackId, track, className }: CommentsListProps) {
  const trackTitle = track?.title || trackTitle;

  // ============ STEP 4: Add First Comment CTA before Comment Form ============
  // Добавить перед CommentForm (перед строкой ~93):

  {/* First Comment CTA - shown when no comments yet */}
  {comments.length === 0 && !isLoading && (
    <div className="mb-4">
      <FirstCommentCTA
        trackId={trackId}
        trackTitle={trackTitle || 'этот трек'}
        variant="card"
        onOpenComments={() => {
          // Scroll to form
          document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  )}

  // ============ STEP 5: Add Comment Suggestions above form ============
  // Добавить перед CommentForm (после CTA):

  {/* Comment Suggestions - shown when form is visible */}
  <CommentSuggestions
    trackStyle={track?.style}
    trackMood={track?.mood}
    maxSuggestions={4}
    variant="chips"
    onSuggestionSelect={(suggestion) => {
      // Pre-fill form with suggestion
      const formInput = document.querySelector('textarea[name="comment"]') as HTMLTextAreaElement;
      if (formInput) {
        formInput.value = suggestion;
        formInput.focus();
        // Trigger input event to update form state
        formInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }}
    className="mb-3"
  />

  // ============ STEP 6: Update CommentForm with id ============
// Добавить id к CommentForm:

<CommentForm
  id="comment-form"
  trackId={trackId}
  parentId={replyTo?.id}
  replyToUsername={replyTo?.username}
  onSubmit={handleSubmitComment}
  onCancelReply={() => setReplyTo(null)}
  isLoading={addComment.isPending}
  track={track} // Pass track for context
/>

// ============ STEP 7: Use enhanced skeletons ============
// Заменить существующий skeleton (строки ~76-88) на:

import { CommentsSectionSkeleton } from '@/components/ui/skeletons/TrackListSkeleton';

if (isLoading) {
  return (
    <div className={cn('space-y-4', className)}>
      <CommentsSectionSkeleton count={3} />
    </div>
  );
}

// ============ ADDITIONAL: Update CommentForm to accept track prop ============
// В src/components/comments/CommentForm.tsx добавить:

interface CommentFormProps {
  trackId: string;
  parentId?: string;
  replyToUsername?: string;
  onSubmit: (content: string, parentId?: string | null) => Promise<void>;
  onCancelReply?: () => void;
  isLoading?: boolean;
  track?: Track; // Add this
  id?: string; // Add this for anchoring
}

// Внутри CommentForm добавить placeholder suggestion:

const placeholderSuggestions = track?.style
  ? `Что вам нравится в этом ${track.style} треке?`
  : 'Напишите комментарий...';

// И использовать в textarea:

<textarea
  placeholder={placeholderSuggestions}
  // ... existing props
/>
