/**
 * TrackLyricsSection - Lyrics display with optional bookmark
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, BookmarkPlus } from 'lucide-react';
import { DetailSection } from '@/components/common/DetailSection';
import { savePromptToBookmarks } from '@/components/generate-form/PromptHistory';
import type { Track } from '@/types/track';

interface TrackLyricsSectionProps {
  track: Track;
  /** If true, show bookmark button here (prompt was same as lyrics) */
  showBookmark?: boolean;
}

export const TrackLyricsSection = memo(function TrackLyricsSection({ 
  track, 
  showBookmark = false 
}: TrackLyricsSectionProps) {
  if (!track.lyrics) return null;

  const handleBookmark = () => {
    const promptName = track.title || track.lyrics!.substring(0, 30);
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

  const bookmarkAction = showBookmark ? (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleBookmark}
    >
      <BookmarkPlus className="w-4 h-4" />
      <span className="hidden sm:inline">В закладки</span>
    </Button>
  ) : undefined;

  return (
    <DetailSection icon={FileText} title="Текст песни" action={bookmarkAction} showSeparator>
      <div className="p-4 rounded-lg bg-muted/50 border border-border max-h-80 overflow-y-auto">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{track.lyrics}</p>
      </div>
    </DetailSection>
  );
});
