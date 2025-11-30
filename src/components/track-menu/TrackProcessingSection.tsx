import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Scissors, Wand2, ImagePlus, FileAudio, Music2 } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';

interface TrackProcessingSectionProps {
  track: Track;
  isProcessing: boolean;
  onSeparateVocals: (mode: 'simple' | 'detailed') => void;
  onGenerateCover: () => void;
  onConvertToWav: () => void;
  onTranscribeMidi: () => void;
}

export function TrackProcessingSection({
  track,
  isProcessing,
  onSeparateVocals,
  onGenerateCover,
  onConvertToWav,
  onTranscribeMidi,
}: TrackProcessingSectionProps) {
  if (!track.audio_url || track.status !== 'completed') {
    return null;
  }

  return (
    <>
      {track.suno_task_id && track.suno_id && (
        <>
          <DropdownMenuItem onClick={() => onSeparateVocals('simple')} disabled={isProcessing}>
            <Scissors className="w-4 h-4 mr-2" />
            Стемы (простое)
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onSeparateVocals('detailed')} disabled={isProcessing}>
            <Wand2 className="w-4 h-4 mr-2" />
            Стемы (детальное)
          </DropdownMenuItem>
        </>
      )}

      <DropdownMenuItem onClick={onGenerateCover} disabled={isProcessing}>
        <ImagePlus className="w-4 h-4 mr-2" />
        Обложка
      </DropdownMenuItem>

      {track.suno_id && (
        <DropdownMenuItem onClick={onConvertToWav} disabled={isProcessing}>
          <FileAudio className="w-4 h-4 mr-2" />
          WAV формат
        </DropdownMenuItem>
      )}

      <DropdownMenuItem onClick={onTranscribeMidi} disabled={isProcessing}>
        <Music2 className="w-4 h-4 mr-2" />
        MIDI файл
      </DropdownMenuItem>
    </>
  );
}
