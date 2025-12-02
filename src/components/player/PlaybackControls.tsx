import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  size?: 'compact' | 'medium' | 'large';
  className?: string;
}

export function PlaybackControls({ size = 'medium', className }: PlaybackControlsProps) {
  const { 
    isPlaying, 
    shuffle, 
    repeat, 
    playTrack, 
    pauseTrack, 
    nextTrack, 
    previousTrack,
    toggleShuffle,
    toggleRepeat
  } = usePlayerStore();

  const buttonSizeClasses = {
    compact: 'h-8 w-8',
    medium: 'h-11 w-11',
    large: 'h-14 w-14'
  };

  const iconSizeClasses = {
    compact: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  const buttonSize = buttonSizeClasses[size];
  const iconSize = iconSizeClasses[size];

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-4', className)}>
      {/* Shuffle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleShuffle}
        className={cn(
          buttonSize,
          'touch-manipulation transition-colors',
          shuffle && 'text-primary'
        )}
        aria-label="Shuffle"
      >
        <Shuffle className={iconSize} />
      </Button>

      {/* Previous */}
      <Button
        variant="ghost"
        size="icon"
        onClick={previousTrack}
        className={cn(buttonSize, 'touch-manipulation')}
        aria-label="Previous track"
      >
        <SkipBack className={iconSize} />
      </Button>

      {/* Play/Pause */}
      <Button
        variant="default"
        size="icon"
        onClick={handlePlayPause}
        className={cn(
          buttonSize,
          'touch-manipulation rounded-full bg-primary hover:bg-primary/90'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className={iconSize} fill="currentColor" />
        ) : (
          <Play className={iconSize} fill="currentColor" />
        )}
      </Button>

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        onClick={nextTrack}
        className={cn(buttonSize, 'touch-manipulation')}
        aria-label="Next track"
      >
        <SkipForward className={iconSize} />
      </Button>

      {/* Repeat */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleRepeat}
        className={cn(
          buttonSize,
          'touch-manipulation transition-colors',
          repeat !== 'off' && 'text-primary'
        )}
        aria-label="Repeat"
      >
        <Repeat className={iconSize} />
      </Button>
    </div>
  );
}
