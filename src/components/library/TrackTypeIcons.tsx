import { Mic2, Guitar, Layers, Music2, FileText, FileMusic, Copy, ArrowRight, Sparkles, Zap } from 'lucide-react';
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
  showModel?: boolean;
}

// Get model display info
function getModelInfo(track: Track): { label: string; color: string; icon: 'sparkles' | 'zap' } | null {
  const model = (track as any).suno_model || (track as any).model_name;
  if (!model) return null;
  
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('v4')) {
    return { label: 'V4', color: 'text-purple-500', icon: 'sparkles' };
  }
  if (modelLower.includes('v3.5')) {
    return { label: 'V3.5', color: 'text-blue-500', icon: 'zap' };
  }
  if (modelLower.includes('v3')) {
    return { label: 'V3', color: 'text-cyan-500', icon: 'zap' };
  }
  
  return { label: model.slice(0, 4), color: 'text-muted-foreground', icon: 'zap' };
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

  // Get model info
  const modelInfo = showModel ? getModelInfo(track) : null;

  const hasAnyIcon = hasVocals || isInstrumental || hasStems || hasMidi || hasPdf || hasGp5 || isCover || isExtend || modelInfo;

  if (!hasAnyIcon) {
    return null;
  }

  const iconSize = compact ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        {/* Model indicator */}
        {modelInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("cursor-help px-1 py-0.5 rounded flex items-center gap-0.5", 
                modelInfo.color.replace('text-', 'bg-').replace('-500', '-500/10')
              )}>
                {modelInfo.icon === 'sparkles' ? (
                  <Sparkles className={cn("w-2.5 h-2.5", modelInfo.color)} />
                ) : (
                  <Zap className={cn("w-2.5 h-2.5", modelInfo.color)} />
                )}
                <span className={cn("text-[9px] font-semibold", modelInfo.color)}>{modelInfo.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Модель: {modelInfo.label}</p>
            </TooltipContent>
          </Tooltip>
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
