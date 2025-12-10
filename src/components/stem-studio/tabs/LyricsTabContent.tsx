/**
 * Lyrics Tab Content for Studio
 * Displays synchronized lyrics
 */

import { StudioLyricsPanelCompact } from '../StudioLyricsPanelCompact';
import { TimestampedLyricsData } from '@/hooks/useTimestampedLyrics';

interface LyricsTabContentProps {
  lyricsData: TimestampedLyricsData | null;
  currentTime: number;
  onSeek: (time: number[]) => void;
}

export function LyricsTabContent({
  lyricsData,
  currentTime,
  onSeek,
}: LyricsTabContentProps) {
  return (
    <div className="p-4">
      <StudioLyricsPanelCompact
        lyricsData={lyricsData}
        currentTime={currentTime}
        onSeek={onSeek}
      />
    </div>
  );
}
