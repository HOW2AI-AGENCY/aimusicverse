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
import { trackTypeColors } from '@/lib/design-colors';

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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.cover.bg)}>
                <Copy className={cn(iconSize, trackTypeColors.cover.text)} />
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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.extend.bg)}>
                <ArrowRight className={cn(iconSize, trackTypeColors.extend.text)} />
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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.vocals.bg)}>
                <Mic2 className={cn(iconSize, trackTypeColors.vocals.text)} />
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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.instrumental.bg)}>
                <Guitar className={cn(iconSize, trackTypeColors.instrumental.text)} />
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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.stems.bg)}>
                <Layers className={cn(iconSize, trackTypeColors.stems.text)} />
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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.midi.bg)}>
                <Music2 className={cn(iconSize, trackTypeColors.midi.text)} />
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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.pdf.bg)}>
                <FileText className={cn(iconSize, trackTypeColors.pdf.text)} />
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
              <div className={cn("cursor-help p-0.5 rounded", trackTypeColors.gp5.bg)}>
                <FileMusic className={cn(iconSize, trackTypeColors.gp5.text)} />
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
