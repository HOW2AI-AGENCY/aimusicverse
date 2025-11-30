import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Plus, Mic, Volume2, Music } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';

interface TrackEditSectionProps {
  track: Track;
  isProcessing: boolean;
  onExtendClick: () => void;
  onAddVocalsClick: () => void;
  onAddInstrumentalClick: () => void;
  onRemix: () => void;
}

export function TrackEditSection({
  track,
  isProcessing,
  onExtendClick,
  onAddVocalsClick,
  onAddInstrumentalClick,
  onRemix,
}: TrackEditSectionProps) {
  return (
    <>
      <DropdownMenuItem onClick={onExtendClick}>
        <Plus className="w-4 h-4 mr-2" />
        Расширить трек
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddVocalsClick}>
        <Mic className="w-4 h-4 mr-2" />
        Добавить вокал
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onAddInstrumentalClick}>
        <Volume2 className="w-4 h-4 mr-2" />
        Добавить инструментал
      </DropdownMenuItem>

      {track.suno_id && (
        <DropdownMenuItem onClick={onRemix} disabled={isProcessing}>
          <Music className="w-4 h-4 mr-2" />
          Создать ремикс
        </DropdownMenuItem>
      )}
    </>
  );
}
