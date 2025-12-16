/**
 * Unified Studio Player Bar
 * Common player controls for both studio modes
 */

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/lib/player-utils';
import { cn } from '@/lib/utils';

interface StudioPlayerBarProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkip: (direction: 'back' | 'forward') => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  className?: string;
  compact?: boolean;
}

export function StudioPlayerBar({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  onTogglePlay,
  onSeek,
  onSkip,
  onVolumeChange,
  onMuteToggle,
  className,
  compact = false,
}: StudioPlayerBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 p-2", className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSkip('back')}
          className="h-8 w-8"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={onTogglePlay}
          className="h-10 w-10 rounded-full"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSkip('forward')}
          className="h-8 w-8"
        >
          <SkipForward className="w-4 h-4" />
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground w-10">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={(val) => onSeek(val[0])}
            className="flex-1"
          />
          <span className="text-xs font-mono text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "px-4 sm:px-6 py-4 border-t border-border/50 bg-card/50 backdrop-blur",
      className
    )}>
      {/* Progress bar */}
      <div className="mb-3">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={(val) => onSeek(val[0])}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('back')}
            className="h-9 w-9 rounded-full"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={onTogglePlay}
            className="h-12 w-12 rounded-full shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('forward')}
            className="h-9 w-9 rounded-full"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMuteToggle}
            className="h-9 w-9 rounded-full"
          >
            {muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[muted ? 0 : volume * 100]}
            max={100}
            step={1}
            onValueChange={(val) => onVolumeChange(val[0] / 100)}
            className="w-24 hidden sm:flex"
          />
        </div>
      </div>
    </div>
  );
}
