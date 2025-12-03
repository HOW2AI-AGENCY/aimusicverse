import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Maximize2, ListMusic, Heart } from 'lucide-react';
import { useAudioTime } from '@/hooks/useAudioTime';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { QueueSheet } from './QueueSheet';
import { useTracks, Track } from '@/hooks/useTracksOptimized';
import { cn } from '@/lib/utils';
import { motion, PanInfo } from 'framer-motion';
import { hapticImpact } from '@/lib/haptic';

interface ExpandedPlayerProps {
  track: Track;
  onClose: () => void;
  onMaximize: () => void;
}

export function ExpandedPlayer({ track, onClose, onMaximize }: ExpandedPlayerProps) {
  const { toggleLike } = useTracks();
  const [queueOpen, setQueueOpen] = useState(false);

  // Use global audio system instead of local useAudioPlayer
  const { currentTime, duration, buffered, seek } = useAudioTime();

  const handleLike = () => {
    hapticImpact('light');
    toggleLike({
      trackId: track.id,
      isLiked: track.is_liked || false,
    });
  };

  const handleDragEnd = (_event: any, info: PanInfo) => {
    // Swipe down to close
    if (info.offset.y > 50) {
      hapticImpact('light');
      onClose();
    }
  };

  return (
    <>
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-20 sm:bottom-20 md:bottom-4 left-0 right-0 z-40 px-2 sm:px-4 bottom-nav-safe"
      >
        <Card className="glass-card border-primary/20 p-4 sm:p-6 shadow-2xl rounded-2xl max-w-2xl mx-auto">
          {/* Swipe indicator */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                onClose();
              }}
              className="h-11 w-11 touch-manipulation"
              aria-label="Close"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  setQueueOpen(true);
                }}
                className="h-11 w-11 touch-manipulation"
                aria-label="Queue"
              >
                <ListMusic className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  onMaximize();
                }}
                className="h-11 w-11 touch-manipulation"
                aria-label="Fullscreen"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Cover Art */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                hapticImpact('medium');
                onMaximize();
              }}
              className="relative group cursor-pointer"
              aria-label="Expand to fullscreen"
            >
              {track.cover_url ? (
                <img
                  src={track.cover_url}
                  alt={track.title || 'Track cover'}
                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-lg object-cover transition-transform group-hover:scale-105 group-active:scale-95"
                />
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-4xl font-bold text-primary/20">
                    {track.title?.charAt(0) || '♪'}
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
            </button>
          </div>

          {/* Track Info */}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-xl sm:text-2xl line-clamp-1 mb-1">
              {track.title || 'Untitled Track'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-1">
              {track.style || 'Unknown Style'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              buffered={buffered}
              onSeek={seek}
            />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={cn(
                'h-11 w-11 touch-manipulation',
                track.is_liked && 'text-red-500'
              )}
              aria-label={track.is_liked ? 'Unlike' : 'Like'}
            >
              <Heart className="h-5 w-5" fill={track.is_liked ? 'currentColor' : 'none'} />
            </Button>

            <div className="flex-1 max-w-md">
              <PlaybackControls size="medium" />
            </div>

            <div className="w-11" /> {/* Spacer for symmetry */}
          </div>
        </Card>
      </motion.div>

      {/* Queue Sheet */}
      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </>
  );
}
