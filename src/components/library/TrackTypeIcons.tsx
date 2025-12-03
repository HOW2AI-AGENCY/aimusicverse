import { Music, Guitar, Sliders } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Track } from '@/hooks/useTracksOptimized';

interface TrackTypeIconsProps {
  track: Track;
}

export function TrackTypeIcons({ track }: TrackTypeIconsProps) {
  const hasVocals = track.has_vocals;
  // is_instrumental derived from has_vocals if not explicitly set
  const isInstrumental = track.is_instrumental === true || (track.is_instrumental == null && track.has_vocals === false);
  const hasStems = track.has_stems === true;

  if (!hasVocals && !isInstrumental && !hasStems) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {hasVocals && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <Music className="w-4 h-4 text-blue-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Has vocals</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {isInstrumental && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <Guitar className="w-4 h-4 text-green-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Instrumental</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {hasStems && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <Sliders className="w-4 h-4 text-purple-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stems available</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
