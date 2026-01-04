import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Layers, Music2, AlertCircle } from 'lucide-react';
import { Track } from '@/types/track';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface TrackStudioSectionProps {
  track: Track;
  stemCount: number;
}

export function TrackStudioSection({ track, stemCount }: TrackStudioSectionProps) {
  const navigate = useNavigate();

  const handleOpenInStudio = () => {
    // Only allow studio for generated tracks with audio
    if (!track.audio_url) {
      toast.error('Трек ещё не сгенерирован', {
        description: 'Дождитесь завершения генерации'
      });
      return;
    }
    navigate(`/studio/${track.id}`);
  };

  // Don't show studio option for tracks without audio
  if (!track.audio_url) {
    return (
      <DropdownMenuItem disabled className="opacity-50">
        <AlertCircle className="w-4 h-4 mr-2" />
        Студия недоступна
        <span className="ml-auto text-xs text-muted-foreground">нет аудио</span>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem onClick={handleOpenInStudio}>
      {stemCount > 0 ? (
        <>
          <Layers className="w-4 h-4 mr-2" />
          Стем-студия
          <span className="ml-auto text-xs text-muted-foreground">{stemCount} стемов</span>
        </>
      ) : (
        <>
          <Music2 className="w-4 h-4 mr-2" />
          Открыть в студии
        </>
      )}
    </DropdownMenuItem>
  );
}
