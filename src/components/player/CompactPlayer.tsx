/**
 * CompactPlayer - Redesigned 2-row layout
 * Row 1: Interactive Waveform timeline (minimal mode)
 * Row 2: Cover + Info + Like/Playlist + Play/Next/Close
 */
import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, Music2, SkipForward, Heart, X, ListPlus, MoreHorizontal
} from 'lucide-react';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGestures } from '@/hooks/useGestures';
import { useTracks } from '@/hooks/useTracks';
import type { Track } from '@/types/track';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { AddToPlaylistDialog } from '@/components/track/AddToPlaylistDialog';
import { UnifiedTrackMenu } from '@/components/track-actions/UnifiedTrackMenu';
import { WaveformProgressBar } from './WaveformProgressBar';

interface CompactPlayerProps {
  track: Track;
  onExpand: () => void;
}

export const CompactPlayer = memo(function CompactPlayer({ track, onExpand }: CompactPlayerProps) {
  const { isPlaying, playTrack, pauseTrack, nextTrack, queue, closePlayer } = usePlayerStore();
  const { currentTime, duration, buffered, seek } = useAudioTime();
  const { toggleLike } = useTracks();
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

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

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    toggleLike({ trackId: track.id, isLiked: track.is_liked || false });
  }, [track.id, track.is_liked, toggleLike]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    closePlayer();
  }, [closePlayer]);

  const handleAddToPlaylist = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    setPlaylistDialogOpen(true);
  }, []);

  const handleSeek = useCallback((time: number) => {
    hapticImpact('light');
    seek(time);
  }, [seek]);

  // Swipe gesture handlers
  const { gestureHandlers } = useGestures({
    onSwipeUp: handleExpand,
    onSwipeLeft: hasNextTrack ? nextTrack : undefined,
    swipeThreshold: 40,
  });

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-[calc(5rem+max(var(--tg-safe-area-inset-bottom,0px),env(safe-area-inset-bottom,0px),0.5rem))] left-0 right-0 z-player px-3 sm:px-4"
        {...gestureHandlers}
      >
        <motion.div
          className={cn(
            "w-full max-w-2xl mx-auto",
            "bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl",
            "shadow-lg shadow-black/10",
            "flex flex-col overflow-hidden",
            "touch-manipulation"
          )}
        >
          {/* Row 1: Waveform Timeline (clickable to expand / seekable) */}
          <div 
            onClick={handleExpand}
            className="px-3 pt-3 pb-2 cursor-pointer"
          >
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

          {/* Row 2: Cover + Info + Actions */}
          <div className="flex items-center gap-2 px-3 pb-3">
            {/* Cover art */}
            <div 
              onClick={handleExpand}
              className="relative flex-shrink-0 cursor-pointer"
            >
              {track.cover_url ? (
                <motion.img
                  src={track.cover_url}
                  alt={track.title || 'Track cover'}
                  className="w-11 h-11 rounded-lg object-cover ring-1 ring-white/10"
                  animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center ring-1 ring-white/10">
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
            <div 
              onClick={handleExpand}
              className="flex-1 min-w-0 text-left cursor-pointer"
            >
              <p className="font-medium text-sm line-clamp-1">
                {track.title || 'Untitled Track'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {track.style || 'Unknown Style'}
              </p>
            </div>

            {/* Action buttons: Like + Playlist */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                className={cn(
                  "h-9 w-9 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50",
                  track.is_liked && "text-red-500"
                )}
                aria-label={track.is_liked ? 'Unlike' : 'Like'}
              >
                <Heart className={cn("h-4 w-4", track.is_liked && "fill-current")} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddToPlaylist}
                className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50"
                aria-label="Add to playlist"
              >
                <ListPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-0.5 flex-shrink-0 border-l border-border/30 pl-2">
              {/* Play/Pause button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="h-10 w-10 min-h-[44px] min-w-[44px] rounded-full bg-primary/10 hover:bg-primary/20"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                )}
              </Button>

              {/* Next track button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextTrack}
                className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50"
                aria-label="Next track"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              {/* More menu */}
              <div onClick={(e) => e.stopPropagation()}>
                <UnifiedTrackMenu 
                  track={track}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-full hover:bg-muted/50"
                aria-label="Close player"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        track={track}
      />
    </>
  );
});
