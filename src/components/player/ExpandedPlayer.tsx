import { useState } from 'react';
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
import { GlassCard } from '@/components/ui/glass-card';

interface ExpandedPlayerProps {
  track: Track;
  onClose: () => void;
  onMaximize: () => void;
}

export function ExpandedPlayer({ track, onClose, onMaximize }: ExpandedPlayerProps) {
  const { toggleLike } = useTracks();
  const [queueOpen, setQueueOpen] = useState(false);

  const { currentTime, duration, buffered, seek } = useAudioTime();

  const handleLike = () => {
    hapticImpact('light');
    toggleLike({
      trackId: track.id,
      isLiked: track.is_liked || false,
    });
  };

  const handleDragEnd = (_event: any, info: PanInfo) => {
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
        <GlassCard className="p-4 sm:p-6 shadow-2xl rounded-2xl max-w-2xl mx-auto border-primary/20">
          {/* Swipe indicator */}
          <div className="flex justify-center mb-4">
            <motion.div 
              className="w-12 h-1 bg-muted-foreground/30 rounded-full"
              whileHover={{ width: 48, backgroundColor: 'hsl(var(--primary) / 0.5)' }}
            />
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
              className="h-11 w-11 touch-manipulation hover:bg-primary/10"
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
                className="h-11 w-11 touch-manipulation hover:bg-primary/10"
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
                className="h-11 w-11 touch-manipulation hover:bg-primary/10"
                aria-label="Fullscreen"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Cover Art with glow effect */}
          <div className="flex justify-center mb-6">
            <motion.button
              onClick={() => {
                hapticImpact('medium');
                onMaximize();
              }}
              className="relative group cursor-pointer"
              aria-label="Expand to fullscreen"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {track.cover_url ? (
                <>
                  {/* Glow effect behind cover */}
                  <div 
                    className="absolute inset-0 blur-2xl opacity-50 scale-110 rounded-xl transition-opacity group-hover:opacity-70"
                    style={{ 
                      backgroundImage: `url(${track.cover_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <img
                    src={track.cover_url}
                    alt={track.title || 'Track cover'}
                    className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-lg object-cover ring-2 ring-white/10"
                  />
                </>
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-lg bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center ring-2 ring-white/10">
                  <motion.div 
                    className="text-4xl font-bold text-primary/40"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {track.title?.charAt(0) || '♪'}
                  </motion.div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
            </motion.button>
          </div>

          {/* Track Info */}
          <div className="text-center mb-6">
            <h3 className="font-semibold text-xl sm:text-2xl line-clamp-1 mb-1 text-gradient">
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
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                className={cn(
                  'h-11 w-11 touch-manipulation transition-colors',
                  track.is_liked && 'text-red-500'
                )}
                aria-label={track.is_liked ? 'Unlike' : 'Like'}
              >
                <Heart className="h-5 w-5" fill={track.is_liked ? 'currentColor' : 'none'} />
              </Button>
            </motion.div>

            <div className="flex-1 max-w-md">
              <PlaybackControls size="medium" />
            </div>

            <div className="w-11" />
          </div>
        </GlassCard>
      </motion.div>

      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </>
  );
}
