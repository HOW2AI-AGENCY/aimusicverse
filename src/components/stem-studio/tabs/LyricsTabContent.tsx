/**
 * Lyrics Tab Content for Studio
 * Displays synchronized lyrics
 */

import { StudioLyricsPanelCompact } from '../StudioLyricsPanelCompact';
import { TimestampedLyricsData } from '@/hooks/useTimestampedLyrics';

interface LyricsTabContentProps {
  lyricsData: TimestampedLyricsData | null;
  currentTime: number;
  onSeek: (time: number) => void;
  taskId?: string | null;
  audioId?: string | null;
  plainLyrics?: string | null;
  isPlaying?: boolean;
}

export function LyricsTabContent({
  lyricsData,
  currentTime,
  onSeek,
  taskId = null,
  audioId = null,
  plainLyrics = null,
  isPlaying = false,
}: LyricsTabContentProps) {
  return (
    <div className="p-4">
      <StudioLyricsPanelCompact
        taskId={taskId}
        audioId={audioId}
        plainLyrics={plainLyrics}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onSeek={onSeek}
      />
    </div>
  );
}
