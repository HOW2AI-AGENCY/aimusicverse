import { useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Repeat, Shuffle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  useStudioStore, 
  selectAudio, 
  selectTrack 
} from '@/stores/useStudioStore';

/**
 * StudioPlayer - Unified playback controls for Studio
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface StudioPlayerProps {
  variant?: 'default' | 'compact' | 'minimal';
  onPlayPause?: () => void;
  onSeek?: (time: number) => void;
  onSkip?: (direction: 'back' | 'forward') => void;
  className?: string;
}

export function StudioPlayer({
  variant = 'default',
  onPlayPause,
  onSeek,
  onSkip,
  className,
}: StudioPlayerProps) {
  const audio = useStudioStore(selectAudio);
  const track = useStudioStore(selectTrack);
  const setVolume = useStudioStore((state) => state.setVolume);
  const toggleMute = useStudioStore((state) => state.toggleMute);
  const togglePlay = useStudioStore((state) => state.togglePlay);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handlePlayPause = () => {
    if (onPlayPause) {
      onPlayPause();
    } else {
      togglePlay();
    }
  };

  const handleSeek = (value: number[]) => {
    if (onSeek) {
      onSeek(value[0]);
    }
  };

  const handleSkip = (direction: 'back' | 'forward') => {
    if (onSkip) {
      onSkip(direction);
    } else {
      const skipAmount = 10;
      const newTime = direction === 'back'
        ? Math.max(0, audio.currentTime - skipAmount)
        : Math.min(audio.duration, audio.currentTime + skipAmount);
      onSeek?.(newTime);
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
          className="h-10 w-10 rounded-full"
        >
          {audio.isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTime(audio.currentTime)} / {formatTime(audio.duration)}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 bg-card/80 backdrop-blur border-t border-border/50",
        className
      )}>
        {/* Play Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('back')}
            className="h-8 w-8 rounded-full"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full"
          >
            {audio.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('forward')}
            className="h-8 w-8 rounded-full"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">
            {formatTime(audio.currentTime)}
          </span>
          
          <Slider
            value={[audio.currentTime]}
            min={0}
            max={audio.duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          
          <span className="text-[10px] text-muted-foreground tabular-nums w-10">
            {formatTime(audio.duration)}
          </span>
        </div>

        {/* Volume */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8 rounded-full shrink-0"
        >
          {audio.muted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "px-4 sm:px-6 py-4 bg-card/80 backdrop-blur border-t border-border/50",
      className
    )}>
      {/* Timeline */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
          {formatTime(audio.currentTime)}
        </span>
        
        <div className="flex-1 relative group">
          <Slider
            value={[audio.currentTime]}
            min={0}
            max={audio.duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-xs text-muted-foreground tabular-nums w-12">
          {formatTime(audio.duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left: Shuffle/Repeat */}
        <div className="flex items-center gap-1 w-[120px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Center: Play Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('back')}
            className="h-10 w-10 rounded-full"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="h-12 w-12 rounded-full shadow-lg"
          >
            {audio.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('forward')}
            className="h-10 w-10 rounded-full"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Right: Volume */}
        <div className="flex items-center gap-2 w-[120px] justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 rounded-full"
          >
            {audio.muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <Slider
            value={[audio.muted ? 0 : audio.volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => setVolume(v[0])}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
