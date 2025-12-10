/**
 * Swipeable Mini Player Component
 * 
 * Enhanced mini player with swipe gestures:
 * - Swipe up: Expand to full player
 * - Swipe down: Minimize/Close
 * - Swipe left/right: Skip tracks
 * - Tap to expand
 * 
 * With smooth animations and haptic feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/hooks/audio';
import { useAudioTime } from '@/hooks/audio';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated, config } from '@react-spring/web';
import { hapticImpact } from '@/lib/haptic';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

const AnimatedDiv = animated.div;

interface SwipeableMiniPlayerProps {
  onExpand?: () => void;
  onMinimize?: () => void;
}

export function SwipeableMiniPlayer({
  onExpand,
  onMinimize,
}: SwipeableMiniPlayerProps) {
  const {
    activeTrack,
    isPlaying,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    closePlayer,
    playerMode,
  } = usePlayerStore();

  const { currentTime, duration } = useAudioTime();

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Spring animation for swipe
  const [{ y, opacity }, api] = useSpring(() => ({
    y: 0,
    opacity: 1,
    config: config.stiff,
  }));

  // Spring animation for progress bar
  const [{ progressWidth }, progressApi] = useSpring(() => ({
    progressWidth: 0,
    config: config.gentle,
  }));

  /**
   * Update progress bar animation
   */
  useEffect(() => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    progressApi.start({ progressWidth: progress });
  }, [currentTime, duration, progressApi]);

  /**
   * Handle vertical swipe (up to expand, down to close)
   */
  const handleVerticalSwipe = useCallback((deltaY: number, velocityY: number) => {
    const threshold = 50;
    const velocityThreshold = 0.5;

    if (deltaY < -threshold || velocityY < -velocityThreshold) {
      // Swipe up - expand
      hapticImpact('medium');
      onExpand?.();
      api.start({ y: -100, opacity: 0 });
    } else if (deltaY > threshold || velocityY > velocityThreshold) {
      // Swipe down - close
      hapticImpact('medium');
      api.start({ y: 100, opacity: 0, onRest: () => {
        closePlayer();
        onMinimize?.();
      }});
    } else {
      // Reset to original position
      api.start({ y: 0, opacity: 1 });
    }
  }, [api, onExpand, onMinimize, closePlayer]);

  /**
   * Handle horizontal swipe (left/right for track skip)
   */
  const handleHorizontalSwipe = useCallback((deltaX: number, velocityX: number) => {
    const threshold = 80;
    const velocityThreshold = 0.7;

    if (deltaX > threshold || velocityX > velocityThreshold) {
      // Swipe right - previous track
      hapticImpact('medium');
      previousTrack();
    } else if (deltaX < -threshold || velocityX < -velocityThreshold) {
      // Swipe left - next track
      hapticImpact('medium');
      nextTrack();
    }
  }, [previousTrack, nextTrack]);

  /**
   * Gesture handler using use-gesture
   */
  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], cancel }) => {
      setIsDragging(down);

      if (down) {
        // Apply drag feedback
        api.start({
          y: my,
          opacity: 1 - Math.abs(my) / 200,
          immediate: true,
        });
      } else {
        // Swipe ended - determine action
        const isVertical = Math.abs(my) > Math.abs(mx);
        
        if (isVertical) {
          handleVerticalSwipe(my, vy * dy);
        } else {
          handleHorizontalSwipe(mx, vx * dx);
          // Reset position after horizontal swipe
          api.start({ y: 0, opacity: 1 });
        }
      }
    },
    {
      axis: undefined, // Allow both axes
      filterTaps: true,
      bounds: { top: -200, bottom: 200, left: -400, right: 400 },
      rubberband: true,
    }
  );

  /**
   * Handle tap to expand
   */
  const handleTap = useCallback(() => {
    if (!isDragging) {
      hapticImpact('light');
      onExpand?.();
    }
  }, [isDragging, onExpand]);

  /**
   * Handle play/pause
   */
  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }, [isPlaying, pauseTrack, playTrack]);

  /**
   * Handle next track
   */
  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    nextTrack();
  }, [nextTrack]);

  /**
   * Handle previous track
   */
  const handlePrevious = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    previousTrack();
  }, [previousTrack]);

  /**
   * Handle close
   */
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    api.start({ y: 100, opacity: 0, onRest: () => {
      closePlayer();
      onMinimize?.();
    }});
  }, [api, closePlayer, onMinimize]);

  if (!activeTrack || playerMode !== 'compact') {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatedDiv
      ref={containerRef}
      {...bind()}
      onClick={handleTap}
      style={{
        y,
        opacity,
        touchAction: 'none',
      }}
      className={cn(
        'fixed bottom-16 left-0 right-0 z-40',
        'bg-card/95 backdrop-blur-xl border-t shadow-lg',
        'cursor-pointer select-none',
        isDragging && 'cursor-grabbing'
      )}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-muted overflow-hidden">
        <AnimatedDiv
          style={{
            width: progressWidth.to(w => `${w}%`),
          }}
          className="h-full bg-primary transition-all duration-300"
        />
      </div>

      {/* Mini player content */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Album cover */}
        <div className="flex-shrink-0">
          <img
            src={activeTrack.cover_url ?? '/placeholder-album.png'}
            alt={activeTrack.title ?? 'Track'}
            className="w-12 h-12 rounded-lg object-cover"
            draggable={false}
          />
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">
            {activeTrack.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {activeTrack.artist_name || 'Unknown Artist'}
          </p>
        </div>

        {/* Time */}
        <div className="hidden sm:block text-xs text-muted-foreground font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handlePrevious}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleNext}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Expand/Close buttons */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              hapticImpact('light');
              onExpand?.();
            }}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Swipe hint (shows on first use) */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
          <ChevronUp className="h-3 w-3 animate-bounce" />
          <span>Свайп вверх для открытия</span>
        </div>
      </div>
    </AnimatedDiv>
  );
}
