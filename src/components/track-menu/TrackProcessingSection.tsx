import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Scissors, Wand2, ImagePlus, FileAudio } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';

interface TrackProcessingSectionProps {
  track: Track;
  isProcessing: boolean;
  onSeparateVocals: (mode: 'simple' | 'detailed') => void;
  onGenerateCover: () => void;
  onConvertToWav: () => void;
}

export function TrackProcessingSection({
  track,
  isProcessing,
  onSeparateVocals,
  onGenerateCover,
  onConvertToWav,
}: TrackProcessingSectionProps) {
  if (!track.audio_url || track.status !== 'completed') {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator />

      {track.suno_task_id && track.suno_id && (
        <>
          <DropdownMenuItem onClick={() => onSeparateVocals('simple')} disabled={isProcessing}>
            <Scissors className="w-4 h-4 mr-2" />
            Стемы: Вокал/Инструментал
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onSeparateVocals('detailed')} disabled={isProcessing}>
            <Wand2 className="w-4 h-4 mr-2" />
            Стемы: Детальное разделение
          </DropdownMenuItem>
        </>
      )}

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onGenerateCover} disabled={isProcessing}>
        <ImagePlus className="w-4 h-4 mr-2" />
        Сгенерировать обложку
      </DropdownMenuItem>

      {track.suno_id && (
        <DropdownMenuItem onClick={onConvertToWav} disabled={isProcessing}>
          <FileAudio className="w-4 h-4 mr-2" />
          Конвертировать в WAV
        </DropdownMenuItem>
      )}
    </>
  );
}
