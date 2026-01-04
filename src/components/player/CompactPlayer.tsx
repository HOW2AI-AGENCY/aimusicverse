/**
 * CompactPlayer - Minimal bottom bar player for quick access
 * Enhanced with action buttons, swipe gestures, previous/next track buttons
 */
import { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, ChevronUp, Music2, SkipForward, SkipBack,
  Heart, Download, X, ListPlus, Share2, Layers 
} from 'lucide-react';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGestures } from '@/hooks/useGestures';
import { useTracks } from '@/hooks/useTracks';
import { useTrackActions } from '@/hooks/useTrackActions';
import type { Track } from '@/types/track';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { AddToPlaylistDialog } from '@/components/track/AddToPlaylistDialog';
import { UnifiedTrackMenu } from '@/components/track-actions/UnifiedTrackMenu';

interface CompactPlayerProps {
  track: Track;
  onExpand: () => void;
}

export const CompactPlayer = memo(function CompactPlayer({ track, onExpand }: CompactPlayerProps) {
  const navigate = useNavigate();
  const { isPlaying, playTrack, pauseTrack, nextTrack, previousTrack, queue, closePlayer } = usePlayerStore();
  const { currentTime, duration } = useAudioTime();
  const { toggleLike, downloadTrack } = useTracks();
  const { handleShare } = useTrackActions();
  const [showActions, setShowActions] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  
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

  const handlePreviousTrack = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    previousTrack();
  }, [previousTrack]);

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

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    const audioUrl = track.streaming_url || track.audio_url;
    if (audioUrl) {
      downloadTrack({ trackId: track.id, audioUrl, coverUrl: track.cover_url || undefined });
    }
  }, [track, downloadTrack]);

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

  const handleShareClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    handleShare(track);
  }, [track, handleShare]);

  const handleOpenStudio = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    navigate(`/studio-v2/track/${track.id}`);
  }, [track.id, navigate]);

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
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-3 sm:px-4"
        {...gestureHandlers}
      >
        <motion.div
          onClick={handleExpand}
          className={cn(
            "w-full max-w-2xl mx-auto",
            "bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl",
            "shadow-lg shadow-black/10",
            "flex items-center gap-2 p-2.5 sm:p-3",
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

          {/* Expand/Actions toggle - LEFT SIDE */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 touch-manipulation"
            aria-label={showActions ? 'Hide actions' : 'Show actions'}
          >
            <ChevronUp className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              showActions && "rotate-180"
            )} />
          </button>

          {/* Cover art */}
          <div className="relative flex-shrink-0">
            {track.cover_url ? (
              <motion.img
                src={track.cover_url}
                alt={track.title || 'Track cover'}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover ring-1 ring-white/10"
                animate={isPlaying ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center ring-1 ring-white/10">
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
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Action buttons - show on toggle */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-0.5"
                >
                  {/* Like button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLike}
                    className={cn(
                      "h-7 w-7 rounded-full hover:bg-muted/50",
                      track.is_liked && "text-red-500"
                    )}
                    aria-label={track.is_liked ? 'Unlike' : 'Like'}
                  >
                    <Heart className={cn("h-3.5 w-3.5", track.is_liked && "fill-current")} />
                  </Button>

                  {/* Add to Playlist button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAddToPlaylist}
                    className="h-7 w-7 rounded-full hover:bg-muted/50"
                    aria-label="Add to playlist"
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                  </Button>

                  {/* Download button - hidden on mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownload}
                    className="h-7 w-7 rounded-full hover:bg-muted/50 hidden sm:flex"
                    aria-label="Download"
                    disabled={!track.audio_url && !track.streaming_url}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>

                  {/* More Actions Menu */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <UnifiedTrackMenu track={track} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Previous track button - HIDDEN ON MOBILE */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousTrack}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-muted/50 hidden sm:flex"
              aria-label="Previous track"
            >
              <SkipBack className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            {/* Play/Pause button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
              )}
            </Button>

            {/* Next track button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextTrack}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-muted/50"
              aria-label="Next track"
            >
              <SkipForward className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            {/* Close button - RIGHT SIDE */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-muted/50"
              aria-label="Close player"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
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

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        track={track}
      />
    </>
  );
});
