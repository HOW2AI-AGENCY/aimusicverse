import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Maximize2, ListMusic, Heart, Sparkles } from 'lucide-react';
import { useAudioTime } from '@/hooks/audio';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { QueueSheet } from './QueueSheet';
import { VersionSwitcher } from './VersionSwitcher';
import { useTracks, Track } from '@/hooks/useTracksOptimized';
import { TooltipWrapper } from '@/components/tooltips';
import { cn } from '@/lib/utils';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { hapticImpact } from '@/lib/haptic';
import { GlassCard } from '@/components/ui/glass-card';
import { usePlayerStore } from '@/hooks/audio';

interface ExpandedPlayerProps {
  track: Track;
  onClose: () => void;
  onMaximize: () => void;
}

export function ExpandedPlayer({ track, onClose, onMaximize }: ExpandedPlayerProps) {
  const { toggleLike } = useTracks();
  const [queueOpen, setQueueOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { isPlaying } = usePlayerStore();

  const { currentTime, duration, buffered, seek } = useAudioTime();

  const handleLike = async () => {
    setIsLiking(true);
    hapticImpact('light');
    await toggleLike({
      trackId: track.id,
      isLiked: track.is_liked || false,
    });
    setTimeout(() => setIsLiking(false), 300);
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
        {/* Background glow effect */}
        {track.cover_url && (
          <motion.div
            className="absolute inset-0 -z-10 blur-3xl opacity-30 scale-125"
            style={{
              backgroundImage: `url(${track.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            animate={{
              opacity: isPlaying ? [0.2, 0.35, 0.2] : 0.2,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        <GlassCard className="p-4 sm:p-6 shadow-2xl rounded-2xl max-w-2xl mx-auto border-primary/20 relative overflow-hidden">
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/30"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: isPlaying ? [-10, 10, -10] : 0,
                  opacity: isPlaying ? [0.3, 0.6, 0.3] : 0.2,
                  scale: isPlaying ? [1, 1.5, 1] : 1,
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Swipe indicator */}
          <div className="flex justify-center mb-4">
            <motion.div 
              className="w-12 h-1 bg-muted-foreground/30 rounded-full"
              whileHover={{ width: 48, backgroundColor: 'hsl(var(--primary) / 0.5)' }}
              animate={{
                backgroundColor: isPlaying 
                  ? ['hsl(var(--muted-foreground) / 0.3)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--muted-foreground) / 0.3)']
                  : 'hsl(var(--muted-foreground) / 0.3)'
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  onClose();
                }}
                className="h-11 w-11 touch-manipulation hover:bg-primary/10 relative group"
                aria-label="Close"
              >
                <motion.div
                  className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100"
                  layoutId="button-bg"
                />
                <ChevronDown className="h-5 w-5 relative z-10" />
              </Button>
            </motion.div>
            
            <div className="flex items-center gap-2">
              <TooltipWrapper tooltipId="player-queue">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
                </motion.div>
              </TooltipWrapper>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
              </motion.div>
            </div>
          </div>

          {/* Cover Art with enhanced glow effect */}
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
                  {/* Animated glow effect behind cover */}
                  <motion.div 
                    className="absolute inset-0 blur-2xl scale-125 rounded-xl"
                    style={{ 
                      backgroundImage: `url(${track.cover_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    animate={{
                      opacity: isPlaying ? [0.4, 0.6, 0.4] : 0.5,
                      scale: isPlaying ? [1.1, 1.2, 1.1] : 1.1,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  <motion.img
                    src={track.cover_url}
                    alt={track.title || 'Track cover'}
                    className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-lg object-cover ring-2 ring-white/10"
                    animate={{
                      rotate: isPlaying ? [0, 1, 0, -1, 0] : 0,
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
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
              <motion.div 
                className="absolute inset-0 rounded-xl transition-colors hover:bg-foreground/10"
              />
              
              {/* Playing indicator sparkle */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Sparkles className="w-5 h-5 text-primary drop-shadow-glow" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Track Info with gradient text */}
          <motion.div 
            className="text-center mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-semibold text-xl sm:text-2xl line-clamp-1 mb-1 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
              {track.title || 'Untitled Track'}
            </h3>
            <motion.p 
              className="text-sm sm:text-base text-muted-foreground line-clamp-1"
              animate={{
                opacity: isPlaying ? [0.7, 1, 0.7] : 0.7
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {track.style || 'Unknown Style'}
            </motion.p>
          </motion.div>

          {/* Version Switcher */}
          <div className="flex justify-center mb-4">
            <VersionSwitcher track={track} size="medium" />
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
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
              animate={isLiking ? { scale: [1, 1.3, 1] } : {}}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                className={cn(
                  'h-11 w-11 touch-manipulation transition-all duration-300 relative',
                  track.is_liked && 'text-red-500'
                )}
                aria-label={track.is_liked ? 'Unlike' : 'Like'}
              >
                {/* Like glow effect */}
                <AnimatePresence>
                  {track.is_liked && (
                    <motion.div
                      className="absolute inset-0 bg-red-500/20 rounded-full blur-md"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    />
                  )}
                </AnimatePresence>
                <Heart 
                  className="h-5 w-5 relative z-10 transition-transform" 
                  fill={track.is_liked ? 'currentColor' : 'none'} 
                />
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
