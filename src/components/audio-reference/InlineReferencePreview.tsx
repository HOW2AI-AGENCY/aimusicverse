/**
 * Inline Reference Preview Component
 * Compact preview of active audio reference in generation form
 */

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useAudioReference } from '@/hooks/useAudioReference';
import { cn } from '@/lib/utils';

interface InlineReferencePreviewProps {
  onRemove?: () => void;
  onOpenDrawer?: () => void;
  className?: string;
}

export function InlineReferencePreview({ 
  onRemove, 
  onOpenDrawer,
  className,
}: InlineReferencePreviewProps) {
  const { activeReference, clearActive, analysisStatus } = useAudioReference();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!activeReference) return null;

  const handlePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(activeReference.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRemove = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    clearActive();
    onRemove?.();
  };

  const getSourceIcon = () => {
    switch (activeReference.source) {
      case 'upload': return <Music className="h-3.5 w-3.5" />;
      case 'record': return <Mic className="h-3.5 w-3.5" />;
      case 'cloud': return <Cloud className="h-3.5 w-3.5" />;
      case 'drums': return <Drum className="h-3.5 w-3.5" />;
      case 'dj': return <Radio className="h-3.5 w-3.5" />;
      case 'guitar': return <Guitar className="h-3.5 w-3.5" />;
      default: return <FileAudio className="h-3.5 w-3.5" />;
    }
  };

  const getModeLabel = () => {
    if (activeReference.intendedMode === 'cover') return 'Кавер';
    if (activeReference.intendedMode === 'extend') return 'Расширение';
    return 'Референс';
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-muted/30",
        "transition-all hover:bg-muted/50",
        className
      )}
    >
      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handlePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Waveform placeholder / info */}
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onOpenDrawer}
      >
        <div className="flex items-center gap-1.5">
          {getSourceIcon()}
          <span className="text-sm font-medium truncate max-w-[120px]">
            {activeReference.fileName}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {getModeLabel()}
          </Badge>
          
          {activeReference.durationSeconds && (
            <span className="text-xs text-muted-foreground">
              {Math.round(activeReference.durationSeconds)}с
            </span>
          )}
          
          {analysisStatus === 'processing' && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          
          {activeReference.analysis?.bpm && (
            <span className="text-xs text-muted-foreground">
              {activeReference.analysis.bpm} BPM
            </span>
          )}
        </div>
      </div>

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
  );
}
