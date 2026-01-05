import { Mic2, Guitar, Layers, Music2, FileText, FileMusic, Copy, ArrowRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Track } from '@/types/track';
import { cn } from '@/lib/utils';
import { ModelBadge } from './ModelBadge';

interface TrackTypeIconsProps {
  track: Track;
  compact?: boolean;
  hasMidi?: boolean;
  hasPdf?: boolean;
  hasGp5?: boolean;
  showModel?: boolean;
}

export function TrackTypeIcons({ 
  track, 
  compact = false,
  hasMidi = false,
  hasPdf = false,
  hasGp5 = false,
  showModel = true,
}: TrackTypeIconsProps) {
  const hasVocals = track.has_vocals === true;
  // is_instrumental derived from has_vocals if not explicitly set
  const isInstrumental = track.is_instrumental === true || (track.is_instrumental == null && track.has_vocals === false);
  const hasStems = track.has_stems === true;
  
  // Detect cover/extend based on generation_mode
  const isCover = track.generation_mode === 'remix' || 
    track.generation_mode === 'cover' || 
    track.generation_mode === 'upload_cover';
  const isExtend = track.generation_mode === 'extend' || 
    track.generation_mode === 'upload_extend';

  // Get model from track
  const model = (track as any).suno_model || (track as any).model_name;
  const hasModel = showModel && !!model;

  const hasAnyIcon = hasVocals || isInstrumental || hasStems || hasMidi || hasPdf || hasGp5 || isCover || isExtend || hasModel;

  if (!hasAnyIcon) {
    return null;
  }

  const iconSize = compact ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        {/* Model indicator - using ModelBadge component */}
        {hasModel && (
          <ModelBadge model={model} compact={compact} />
        )}

        {/* Cover indicator */}
        {isCover && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-purple-500/10">
                <Copy className={cn(iconSize, "text-purple-500")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Кавер</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Extend indicator */}
        {isExtend && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help p-0.5 rounded bg-cyan-500/10">
                <ArrowRight className={cn(iconSize, "text-cyan-500")} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Расширение</p>
            </TooltipContent>
          </Tooltip>
        )}

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
