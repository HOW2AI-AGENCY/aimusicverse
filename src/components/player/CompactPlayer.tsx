/**
 * CompactPlayer - Simplified 2-row layout (Phase 1 Redesign)
 * 
 * Core elements only:
 * - Row 1: Waveform timeline (44px touch zone)
 * - Row 2: Cover + Title + Play/Pause + Next
 * 
 * Secondary actions moved to swipe-up (fullscreen) or long-press menu
 */
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music2, SkipForward, ChevronUp } from 'lucide-react';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGestures } from '@/hooks/useGestures';
import type { Track } from '@/types/track';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { glass } from '@/lib/glass';
import { UnifiedTrackMenu } from '@/components/track-actions/UnifiedTrackMenu';
import { WaveformProgressBar } from './WaveformProgressBar';

interface CompactPlayerProps {
  track: Track;
  onExpand: () => void;
}

export const CompactPlayer = memo(function CompactPlayer({ track, onExpand }: CompactPlayerProps) {
  const { isPlaying, playTrack, pauseTrack, nextTrack, queue } = usePlayerStore();
  const { currentTime, duration, buffered, seek } = useAudioTime();
  const [showExpandHint, setShowExpandHint] = useState(false);

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

  const handleSeek = useCallback((time: number) => {
    hapticImpact('light');
    seek(time);
  }, [seek]);

  // Swipe gestures: up = expand, left = next track, right = rewind 10s
  const { gestureHandlers } = useGestures({
    onSwipeUp: handleExpand,
    onSwipeLeft: hasNextTrack ? nextTrack : undefined,
    onSwipeRight: () => {
      hapticImpact('light');
      seek(Math.max(0, currentTime - 10));
    },
    swipeThreshold: 40,
  });

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-[calc(5rem+max(var(--tg-safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px),0.5rem))] left-0 right-0 z-player px-3 sm:px-4"
      role="region"
      aria-label="Music player"
      {...gestureHandlers}
      onMouseEnter={() => setShowExpandHint(true)}
      onMouseLeave={() => setShowExpandHint(false)}
    >
      <motion.div
        className={cn(
          "w-full max-w-2xl mx-auto",
          glass.card,
          "shadow-lg shadow-black/10",
          "flex flex-col overflow-hidden",
          "touch-manipulation"
        )}
      >
        {/* Row 1: Waveform Timeline - 44px touch zone */}
        <div
          onClick={handleExpand}
          className="px-3 pt-3 pb-1.5 cursor-pointer min-h-[44px] flex items-center"
          role="button"
          tabIndex={0}
          aria-label="Expand player"
        >
          <div className="flex-1">
            <WaveformProgressBar
              audioUrl={track.streaming_url || track.audio_url}
              trackId={track.id}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              buffered={buffered}
              mode="minimal"
              showLabels={false}
              className="pointer-events-auto"
            />
          </div>
          
          {/* Expand hint - visible on hover or when swiping */}
          <motion.div
            className="ml-2 flex-shrink-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: showExpandHint ? 0.6 : 0 }}
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>

        {/* Row 2: Cover + Info + Play/Next */}
        <div className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 pb-3 lg:pb-4">
          {/* Cover art with long-press menu */}
          <UnifiedTrackMenu
            track={track}
            trigger={
              <div
                className="relative flex-shrink-0 cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`Track options: ${track.title || 'Untitled Track'}`}
              >
                {track.cover_url ? (
                  <motion.img
                    src={track.cover_url}
                    alt={track.title || 'Track cover'}
                    className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-primary/30 transition-all"
                    animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                ) : (
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center ring-1 ring-white/10 group-hover:ring-primary/30 transition-all">
                    <Music2 className="w-5 h-5 lg:w-6 lg:h-6 text-primary/60" aria-hidden="true" />
                  </div>
                )}

                {/* Playing indicator */}
                {isPlaying && (
                  <motion.div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    aria-hidden="true"
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
            }
          />

          {/* Track info - tap to expand */}
          <div
            onClick={handleExpand}
            className="flex-1 min-w-0 text-left cursor-pointer py-1 lg:py-2"
            role="button"
            tabIndex={0}
            aria-label={`Expand player: ${track.title || 'Untitled Track'}`}
          >
            <p className="font-medium text-sm lg:text-base line-clamp-1">
              {track.title || 'Untitled Track'}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground line-clamp-1">
              {track.style || 'Unknown Style'}
            </p>
          </div>

          {/* Playback controls - minimal set */}
          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {/* Play/Pause - primary action, larger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="h-11 w-11 lg:h-12 lg:w-12 min-h-[44px] min-w-[44px] rounded-full bg-primary/10 hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 lg:h-6 lg:w-6" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5 lg:h-6 lg:w-6 ml-0.5" fill="currentColor" />
              )}
            </Button>

            {/* Next track */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextTrack}
              disabled={!hasNextTrack}
              className={cn(
                "h-10 w-10 lg:h-11 lg:w-11 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50 hover:scale-105 active:scale-95 transition-all",
                !hasNextTrack && "opacity-40"
              )}
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4 lg:h-5 lg:w-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
