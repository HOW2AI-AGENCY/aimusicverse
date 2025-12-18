/**
 * Inline Reference Preview Component
 * Compact preview of active audio reference in generation form with waveform
 */

import { useState, useRef, useEffect, useCallback } from 'react';
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
import { MiniWaveform } from './MiniWaveform';

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element once
  useEffect(() => {
    if (!activeReference?.audioUrl) return;

    const audio = new Audio(activeReference.audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [activeReference?.audioUrl]);

  // Set duration from reference if available
  useEffect(() => {
    if (activeReference?.durationSeconds && duration === 0) {
      setDuration(activeReference.durationSeconds);
    }
  }, [activeReference?.durationSeconds, duration]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleRemove = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
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
      default: return <FileAudio className="h-3.5 w-3.5" />;
    }
  };

  const getModeLabel = () => {
    if (activeReference.intendedMode === 'cover') return 'Кавер';
    if (activeReference.intendedMode === 'extend') return 'Расширение';
    return 'Референс';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg border bg-muted/30",
        "transition-all hover:bg-muted/50",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
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

        {/* Info */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onOpenDrawer}
        >
          <div className="flex items-center gap-1.5">
            {getSourceIcon()}
            <span className="text-sm font-medium truncate max-w-[140px]">
              {activeReference.fileName}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {getModeLabel()}
            </Badge>
            
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

      {/* Waveform with time */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
          {formatTime(currentTime)}
        </span>
        
        <MiniWaveform
          audioUrl={activeReference.audioUrl}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          height={32}
          className="flex-1"
        />
        
        <span className="text-xs text-muted-foreground w-8 shrink-0">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
