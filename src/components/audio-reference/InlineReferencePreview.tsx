/**
 * Inline Reference Preview Component
 * Compact preview of active audio reference in generation form with waveform
 */

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  X, 
  Music, 
  Mic, 
  Cloud, 
  Drum, 
  Radio, 
  Guitar,
  FileAudio,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAudioReference } from '@/hooks/useAudioReference';
import { useReferenceAudioPlayer } from '@/hooks/audio/useReferenceAudioPlayer';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { MiniWaveform } from './MiniWaveform';
import { ReferenceAnalysisDisplay } from './ReferenceAnalysisDisplay';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface InlineReferencePreviewProps {
  onRemove?: () => void;
  onOpenDrawer?: () => void;
  className?: string;
  showAnalysis?: boolean;
}

export const InlineReferencePreview = memo(function InlineReferencePreview({ 
  onRemove, 
  onOpenDrawer,
  className,
  showAnalysis = true,
}: InlineReferencePreviewProps) {
  const { activeReference, clearActive, analysisStatus } = useAudioReference();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    isBuffering,
    togglePlay,
    seek,
  } = useReferenceAudioPlayer({
    audioUrl: activeReference?.audioUrl ?? null,
  });

  const handleRemove = useCallback(() => {
    clearActive();
    onRemove?.();
  }, [clearActive, onRemove]);

  if (!activeReference) return null;

  const getSourceIcon = () => {
    switch (activeReference.source) {
      case 'upload': return <Music className="h-3.5 w-3.5" />;
      case 'record': return <Mic className="h-3.5 w-3.5" />;
      case 'cloud': return <Cloud className="h-3.5 w-3.5" />;
      case 'drums': return <Drum className="h-3.5 w-3.5" />;
      case 'dj': return <Radio className="h-3.5 w-3.5" />;
      case 'guitar': return <Guitar className="h-3.5 w-3.5" />;
      case 'stem': return <Sparkles className="h-3.5 w-3.5" />;
      case 'track': return <Music className="h-3.5 w-3.5" />;
      default: return <FileAudio className="h-3.5 w-3.5" />;
    }
  };

  const getModeLabel = () => {
    if (activeReference.intendedMode === 'cover') return 'Кавер';
    if (activeReference.intendedMode === 'extend') return 'Расширение';
    return 'Референс';
  };

  const getModeColor = () => {
    if (activeReference.intendedMode === 'cover') return 'bg-purple-500/20 text-purple-700 dark:text-purple-400';
    if (activeReference.intendedMode === 'extend') return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    return 'bg-muted';
  };

  const hasAnalysisData = activeReference.analysis && (
    activeReference.analysis.genre ||
    activeReference.analysis.bpm ||
    activeReference.analysis.mood ||
    activeReference.analysis.styleDescription
  );

  const effectiveDuration = duration || activeReference.durationSeconds || 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div 
        className={cn(
          "flex flex-col rounded-lg border bg-card/50 backdrop-blur-sm",
          "transition-all duration-200",
          isExpanded && "ring-1 ring-primary/20",
          className
        )}
      >
        {/* Main content */}
        <div className="flex flex-col gap-2 p-3">
          {/* Header row */}
          <div className="flex items-center gap-2">
            {/* Play/Pause button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full bg-primary/10 hover:bg-primary/20"
              onClick={togglePlay}
              disabled={isLoading}
            >
              {isLoading || isBuffering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            {/* Info */}
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={onOpenDrawer}
            >
              <div className="flex items-center gap-1.5">
                {getSourceIcon()}
                <span className="text-sm font-medium truncate max-w-[160px]">
                  {activeReference.fileName}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="secondary" className={cn("text-xs px-1.5 py-0", getModeColor())}>
                  {getModeLabel()}
                </Badge>
                
                {analysisStatus === 'processing' && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    Анализ
                  </Badge>
                )}
                
                {activeReference.analysis?.bpm && (
                  <span className="text-xs text-muted-foreground">
                    {activeReference.analysis.bpm} BPM
                  </span>
                )}

                {activeReference.analysis?.genre && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    • {activeReference.analysis.genre}
                  </span>
                )}
              </div>
            </div>

            {/* Expand button (if has analysis) */}
            {showAnalysis && hasAnalysisData && (
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
            )}

            {/* Remove button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Waveform with time */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-9 text-right shrink-0 tabular-nums">
              {formatTime(currentTime)}
            </span>
            
            <MiniWaveform
              audioUrl={activeReference.audioUrl}
              currentTime={currentTime}
              duration={effectiveDuration}
              isPlaying={isPlaying}
              onSeek={seek}
              height={36}
              className="flex-1"
            />
            
            <span className="text-xs text-muted-foreground w-9 shrink-0 tabular-nums">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Expanded analysis section */}
        {showAnalysis && hasAnalysisData && (
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-1 border-t border-border/50">
              <ReferenceAnalysisDisplay
                analysis={activeReference.analysis}
                status={analysisStatus}
                compact
              />
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
});
