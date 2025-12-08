import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Layers, Split, Music2 } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { useNavigate } from 'react-router-dom';

interface TrackStudioSectionProps {
  track: Track;
  stemCount: number;
}

export function TrackStudioSection({ track, stemCount }: TrackStudioSectionProps) {
  const navigate = useNavigate();

  const handleOpenInStudio = () => {
    navigate(`/studio/${track.id}`);
  };

  // Always show studio option - TrackStudioContent handles tracks without stems
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
