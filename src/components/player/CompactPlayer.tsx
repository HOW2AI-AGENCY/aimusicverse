/**
 * CompactPlayer - Minimal bottom bar player for quick access
 * Enhanced with swipe gestures and next track button
 */
import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, ChevronUp, Music2, SkipForward } from 'lucide-react';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGestures } from '@/hooks/useGestures';
import type { Track } from '@/types/track';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';

interface CompactPlayerProps {
  track: Track;
  onExpand: () => void;
}

export const CompactPlayer = memo(function CompactPlayer({ track, onExpand }: CompactPlayerProps) {
  const { isPlaying, playTrack, pauseTrack, nextTrack, queue } = usePlayerStore();
  const { currentTime, duration } = useAudioTime();
  
  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasNextTrack = queue.length > 0;

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }, [isPlaying, playTrack, pauseTrack]);

  const handleNextTrack = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    nextTrack();
  }, [nextTrack]);

  const handleExpand = useCallback(() => {
    hapticImpact('light');
    onExpand();
  }, [onExpand]);

  // Swipe gesture handlers
  const { gestureHandlers } = useGestures({
    onSwipeUp: handleExpand,
    onSwipeLeft: hasNextTrack ? nextTrack : undefined,
    swipeThreshold: 40,
  });

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-3 sm:px-4"
      {...gestureHandlers}
    >
      <motion.div
        onClick={handleExpand}
        className={cn(
          "w-full max-w-2xl mx-auto",
          "bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl",
          "shadow-lg shadow-black/10",
          "flex items-center gap-3 p-3 pr-2",
          "touch-manipulation cursor-pointer",
          "hover:bg-card/100 transition-colors"
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Progress bar at top */}
        <div className="absolute top-0 left-3 right-3 h-0.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ type: 'tween', ease: 'linear' }}
          />
        </div>

        {/* Cover art */}
        <div className="relative flex-shrink-0">
          {track.cover_url ? (
            <motion.img
              src={track.cover_url}
              alt={track.title || 'Track cover'}
              className="w-12 h-12 rounded-lg object-cover ring-1 ring-white/10"
              animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center ring-1 ring-white/10">
              <Music2 className="w-5 h-5 text-primary/60" />
            </div>
          )}
          
          {/* Playing indicator */}
          {isPlaying && (
            <motion.div
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-primary rounded-full"
                  animate={{ height: [3, 8, 3] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-sm line-clamp-1">
            {track.title || 'Untitled Track'}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {track.style || 'Unknown Style'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Play/Pause button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
            )}
          </Button>

          {/* Next track button - only show if queue has tracks */}
          {hasNextTrack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextTrack}
              className="h-9 w-9 rounded-full hover:bg-muted/50"
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}

          {/* Expand indicator */}
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-1" />
        </div>
      </motion.div>
      
      {/* Swipe hint - subtle indicator */}
      <motion.div 
        className="flex justify-center mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
      >
        <span className="text-[10px] text-muted-foreground/50">↑ свайп вверх</span>
      </motion.div>
    </motion.div>
  );
});
