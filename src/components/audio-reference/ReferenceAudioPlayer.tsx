/**
 * Reference Audio Player Component
 * Full-featured audio player for reference audio with waveform visualization
 */

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { MiniWaveform } from './MiniWaveform';
import { useReferenceAudioPlayer } from '@/hooks/audio/useReferenceAudioPlayer';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReferenceAudioPlayerProps {
  audioUrl: string;
  fileName?: string;
  className?: string;
  showWaveform?: boolean;
  showVolumeControl?: boolean;
  compact?: boolean;
  onEnded?: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const ReferenceAudioPlayer = memo(function ReferenceAudioPlayer({
  audioUrl,
  fileName,
  className,
  showWaveform = true,
  showVolumeControl = true,
  compact = false,
  onEnded,
}: ReferenceAudioPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    isBuffering,
    error,
    togglePlay,
    seek,
    setVolume,
    reset,
  } = useReferenceAudioPlayer({ audioUrl, onEnded });

  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolumeState(newVolume);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  }, [setVolume]);

  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(volume);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, setVolume]);

  const handleSeek = useCallback((time: number) => {
    seek(time);
  }, [seek]);

  const handleSliderSeek = useCallback((value: number[]) => {
    seek(value[0]);
  }, [seek]);

  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive",
        className
      )}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading || isBuffering ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderSeek}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with file name */}
      {fileName && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{fileName}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      )}

      {/* Waveform */}
      {showWaveform && duration > 0 && (
        <MiniWaveform
          audioUrl={audioUrl}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          height={48}
        />
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading || isBuffering ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        {/* Reset */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={reset}
          disabled={currentTime === 0}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Time */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums w-10">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderSeek}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume */}
        {showVolumeControl && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleToggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        )}
      </div>
    </div>
  );
});
