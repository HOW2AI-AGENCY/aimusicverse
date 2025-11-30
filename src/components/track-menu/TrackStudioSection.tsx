import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Layers, Wand2, Music } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { useNavigate } from 'react-router-dom';

interface TrackStudioSectionProps {
  track: Track;
  stemCount: number;
}

export function TrackStudioSection({ track, stemCount }: TrackStudioSectionProps) {
  const navigate = useNavigate();

  if (stemCount === 0) return null;

  return (
    <DropdownMenuItem onClick={() => navigate(`/studio/${track.id}`)}>
      <Layers className="w-4 h-4 mr-2" />
      Открыть в студии
      <span className="ml-auto text-xs text-muted-foreground">{stemCount} стемов</span>
    </DropdownMenuItem>
  );
}
