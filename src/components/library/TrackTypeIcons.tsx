import { Mic2, Guitar, Layers, Music2, FileText, FileMusic } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Track } from '@/types/track';
import { cn } from '@/lib/utils';

interface TrackTypeIconsProps {
  track: Track;
  compact?: boolean;
  hasMidi?: boolean;
  hasPdf?: boolean;
  hasGp5?: boolean;
}

export function TrackTypeIcons({ 
  track, 
  compact = false,
  hasMidi = false,
  hasPdf = false,
  hasGp5 = false,
}: TrackTypeIconsProps) {
  const hasVocals = track.has_vocals === true;
  // is_instrumental derived from has_vocals if not explicitly set
  const isInstrumental = track.is_instrumental === true || (track.is_instrumental == null && track.has_vocals === false);
  const hasStems = track.has_stems === true;

  if (!hasVocals && !isInstrumental && !hasStems && !hasMidi && !hasPdf && !hasGp5) {
    return null;
  }

  const iconSize = compact ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        {hasVocals && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-blue-500/10">
                <Mic2 className={cn(iconSize, "text-blue-500")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Вокал</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {isInstrumental && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-green-500/10">
                <Guitar className={cn(iconSize, "text-green-500")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Инструментал</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {hasStems && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-purple-500/10">
                <Layers className={cn(iconSize, "text-purple-500")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Стемы</p>
            </TooltipContent>
          </Tooltip>
        )}

        {hasMidi && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-primary/10">
                <Music2 className={cn(iconSize, "text-primary")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>MIDI</p>
            </TooltipContent>
          </Tooltip>
        )}

        {hasPdf && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-amber-500/10">
                <FileText className={cn(iconSize, "text-amber-500")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Ноты (PDF)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {hasGp5 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-orange-500/10">
                <FileMusic className={cn(iconSize, "text-orange-500")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Guitar Pro 5</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
