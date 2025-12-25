/**
 * Studio Transport Controls
 * Play/Pause, Stop, Seek, Time display
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';

interface StudioTransportProps {
  className?: string;
  compact?: boolean;
}

export const StudioTransport = memo(function StudioTransport({ 
  className,
  compact = false,
}: StudioTransportProps) {
  const {
    project,
    isPlaying,
    currentTime,
    play,
    pause,
    stop,
    seek,
    setMasterVolume,
  } = useUnifiedStudioStore();

  const duration = project?.durationSeconds || 180;
  const masterVolume = project?.masterVolume ?? 0.85;
  const isMuted = masterVolume === 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? pause() : play();
          break;
        case 'Home':
          e.preventDefault();
          seek(0);
          break;
        case 'End':
          e.preventDefault();
          seek(duration);
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault();
            seek(Math.max(0, currentTime - 10));
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault();
            seek(Math.min(duration, currentTime + 10));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, play, pause, seek]);

  const handlePlayPause = useCallback(() => {
    isPlaying ? pause() : play();
  }, [isPlaying, play, pause]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleSkipBack = useCallback(() => {
    seek(0);
  }, [seek]);

  const handleSkipForward = useCallback(() => {
    seek(duration);
  }, [seek, duration]);

  const handleSeek = useCallback((value: number[]) => {
    seek(value[0]);
  }, [seek]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setMasterVolume(value[0]);
  }, [setMasterVolume]);

  const toggleMute = useCallback(() => {
    setMasterVolume(isMuted ? 0.85 : 0);
  }, [isMuted, setMasterVolume]);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <span className="text-xs font-mono text-muted-foreground min-w-[80px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2 bg-card/50 backdrop-blur-sm border-b border-border/50',
      className
    )}>
      {/* Main Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSkipBack}
          title="В начало (Home)"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={handlePlayPause}
          title="Play/Pause (Space)"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleStop}
          title="Стоп"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSkipForward}
          title="В конец (End)"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Time Display */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-sm font-mono font-medium">
          {formatTime(currentTime)}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-mono text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>

      {/* Seek Slider */}
      <div className="flex-1 max-w-md">
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
      </div>

      {/* BPM Display */}
      {project?.bpm && (
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/50">
          <span className="text-xs text-muted-foreground">BPM</span>
          <span className="text-sm font-mono font-medium">{project.bpm}</span>
        </div>
      )}

      {/* Master Volume */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[masterVolume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-20"
        />
      </div>
    </div>
  );
});
