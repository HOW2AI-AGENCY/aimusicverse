/**
 * TrackPromptSection - Prompt display with bookmark action
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, BookmarkPlus } from 'lucide-react';
import { DetailSection } from '@/components/common/DetailSection';
import { savePromptToBookmarks } from '@/components/generate-form/PromptHistory';
import type { Track } from '@/types/track';

interface TrackPromptSectionProps {
  track: Track;
  /** If true, prompt and lyrics are the same (skip showing prompt) */
  promptAndLyricsSame?: boolean;
}

export const TrackPromptSection = memo(function TrackPromptSection({ 
  track, 
  promptAndLyricsSame = false 
}: TrackPromptSectionProps) {
  if (!track.prompt || promptAndLyricsSame) return null;

  const handleBookmark = () => {
    const promptName = track.title || track.prompt.substring(0, 30);
    savePromptToBookmarks({
      name: promptName,
      mode: track.generation_mode === 'custom' ? 'custom' : 'simple',
      description: track.generation_mode === 'simple' ? track.prompt : undefined,
      title: track.title || undefined,
      style: track.style || undefined,
      lyrics: track.lyrics || undefined,
      model: track.suno_model || 'V4_5ALL',
    });
  };

  const bookmarkAction = (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleBookmark}
    >
      <BookmarkPlus className="w-4 h-4" />
      <span className="hidden sm:inline">В закладки</span>
    </Button>
  );

  return (
    <DetailSection icon={Wand2} title="Промпт" action={bookmarkAction} showSeparator>
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{track.prompt}</p>
      </div>
    </DetailSection>
  );
});
