import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Info, FileText } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';

interface TrackInfoSectionProps {
  track: Track;
  onDetailClick: () => void;
  onLyricsClick: () => void;
}

export function TrackInfoSection({ track, onDetailClick, onLyricsClick }: TrackInfoSectionProps) {
  return (
    <>
      <DropdownMenuItem onClick={onDetailClick}>
        <Info className="w-4 h-4 mr-2" />
        Детали трека
      </DropdownMenuItem>

      {track.audio_url && track.status === 'completed' && (track.lyrics || (track.suno_task_id && track.suno_id)) && (
        <DropdownMenuItem onClick={onLyricsClick}>
          <FileText className="w-4 h-4 mr-2" />
          Текст песни
        </DropdownMenuItem>
      )}
    </>
  );
}
