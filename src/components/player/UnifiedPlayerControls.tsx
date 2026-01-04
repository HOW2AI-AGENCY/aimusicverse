/**
 * UnifiedPlayerControls - Shared playback controls component
 * 
 * Adaptive controls for both compact and fullscreen modes.
 * Features play/pause, skip, shuffle, repeat, and volume control.
 */

import { memo, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';

type ControlSize = 'sm' | 'md' | 'lg';

interface UnifiedPlayerControlsProps {
  variant?: 'compact' | 'fullscreen';
  size?: ControlSize;
  showVolume?: boolean;
  showShuffleRepeat?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { 
    main: 'h-10 w-10', 
    secondary: 'h-8 w-8', 
    icon: 'h-4 w-4',
    mainIcon: 'h-5 w-5'
  },
  md: { 
    main: 'h-12 w-12', 
    secondary: 'h-10 w-10', 
    icon: 'h-5 w-5',
    mainIcon: 'h-6 w-6'
  },
  lg: { 
    main: 'h-16 w-16', 
    secondary: 'h-12 w-12', 
    icon: 'h-6 w-6',
    mainIcon: 'h-8 w-8'
  },
};

export const UnifiedPlayerControls = memo(function UnifiedPlayerControls({
  variant = 'fullscreen',
  size = 'md',
  showVolume = false,
  showShuffleRepeat = true,
  className,
}: UnifiedPlayerControlsProps) {
  const { 
    isPlaying, 
    playTrack, 
    pauseTrack, 
    nextTrack, 
    previousTrack,
    repeat,
    shuffle,
    toggleRepeat,
    toggleShuffle,
    volume,
    setVolume,
  } = usePlayerStore();
  
  const config = sizeConfig[size];

  const handlePlayPause = useCallback(() => {
    hapticImpact('medium');
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }, [isPlaying, playTrack, pauseTrack]);

  const handlePrevious = useCallback(() => {
    hapticImpact('light');
    previousTrack();
  }, [previousTrack]);

  const handleNext = useCallback(() => {
    hapticImpact('light');
    nextTrack();
  }, [nextTrack]);

  const handleShuffle = useCallback(() => {
    hapticImpact('light');
    toggleShuffle();
  }, [toggleShuffle]);

  const handleRepeat = useCallback(() => {
    hapticImpact('light');
    toggleRepeat();
  }, [toggleRepeat]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
  }, [setVolume]);

  const isCompact = variant === 'compact';

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Main controls row */}
      <div className={cn(
        'flex items-center justify-center',
        isCompact ? 'gap-2' : 'gap-6'
      )}>
        {/* Shuffle */}
        {showShuffleRepeat && !isCompact && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShuffle}
              className={cn(
                config.secondary,
                'touch-manipulation rounded-full transition-all',
                shuffle && 'text-primary bg-primary/10'
              )}
              aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
            >
              <Shuffle className={config.icon} />
            </Button>
          </motion.div>
        )}

        {/* Previous */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className={cn(
              config.secondary,
              'touch-manipulation rounded-full hover:bg-muted/50'
            )}
            aria-label="Previous track"
          >
            <SkipBack className={config.icon} />
          </Button>
        </motion.div>

        {/* Play/Pause - Main button */}
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
        >
          {/* Glow effect for fullscreen */}
          {!isCompact && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
              animate={isPlaying ? { 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.2, 0.5]
              } : { scale: 1, opacity: 0.3 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <Button
            size="icon"
            onClick={handlePlayPause}
            className={cn(
              'relative rounded-full touch-manipulation',
              config.main,
              isCompact 
                ? 'bg-primary/10 hover:bg-primary/20' 
                : 'bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90'
            )}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Pause className={config.mainIcon} fill="currentColor" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Play className={cn(config.mainIcon, 'ml-0.5')} fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Next */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className={cn(
              config.secondary,
              'touch-manipulation rounded-full hover:bg-muted/50'
            )}
            aria-label="Next track"
          >
            <SkipForward className={config.icon} />
          </Button>
        </motion.div>

        {/* Repeat */}
        {showShuffleRepeat && !isCompact && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRepeat}
              className={cn(
                config.secondary,
                'touch-manipulation rounded-full relative transition-all',
                repeat !== 'off' && 'text-primary bg-primary/10'
              )}
              aria-label={`Repeat: ${repeat}`}
            >
              <Repeat className={config.icon} />
              {repeat === 'one' && (
                <span className="absolute text-[10px] font-bold">1</span>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Volume control (desktop only) */}
      {showVolume && (
        <div className="flex items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="h-9 w-9 flex-shrink-0 touch-manipulation rounded-full"
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
            aria-label="Volume"
          />
        </div>
      )}
    </div>
  );
});

export default UnifiedPlayerControls;
