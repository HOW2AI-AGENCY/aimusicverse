import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, SkipForward, SkipBack, X, Music2, ListMusic, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayerStore, useAudioTime } from '@/hooks/audio';
import { cn } from '@/lib/utils';
import { QueueSheet } from './QueueSheet';

interface MiniPlayerProps {
  className?: string;
  onExpand?: () => void;
}

export function MiniPlayer({ className, onExpand }: MiniPlayerProps) {
  const { 
    activeTrack, 
    isPlaying, 
    playTrack, 
    pauseTrack, 
    nextTrack, 
    previousTrack,
    playerMode, 
    setPlayerMode, 
    minimizePlayer,
    queue 
  } = usePlayerStore();
  const { currentTime, duration } = useAudioTime();
  const [queueOpen, setQueueOpen] = useState(false);

  if (!activeTrack || playerMode !== 'compact') {
    return null;
  }

  const handleTogglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            "fixed bottom-20 left-2 right-2 z-40",
            "bg-card/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50",
            "overflow-hidden",
            className
          )}
        >
          {/* Background glow effect */}
          {activeTrack.cover_url && isPlaying && (
            <motion.div
              className="absolute inset-0 opacity-20 blur-2xl scale-150 -z-10"
              style={{
                backgroundImage: `url(${activeTrack.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              animate={{ opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}

          {/* Progress bar at top with animated gradient */}
          <div className="h-1 bg-muted/50 relative overflow-hidden">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-primary to-generate"
              style={{ width: `${progress}%` }}
            />
            {/* Shimmer effect */}
            {isPlaying && (
              <motion.div
                className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '500%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>

          <div className="flex items-center gap-2 p-2.5">
            {/* Cover with expand action */}
            <button
              onClick={onExpand || (() => setPlayerMode('expanded'))}
              className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0 group shadow-lg"
              aria-label="Развернуть плеер"
            >
              {activeTrack.cover_url ? (
                <motion.img
                  src={activeTrack.cover_url}
                  alt={activeTrack.title || 'Track'}
                  className="w-full h-full object-cover"
                  animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Music2 className="w-5 h-5 text-primary/60" />
                </div>
              )}
              {/* Playing indicator */}
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex gap-0.5 items-end">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-white rounded-full"
                        animate={{ height: ['8px', '16px', '8px'] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Expand indicator on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronUp className="w-5 h-5 text-white" />
              </div>
            </button>

            {/* Info */}
            <button
              onClick={onExpand || (() => setPlayerMode('expanded'))}
              className="flex-1 min-w-0 text-left"
              aria-label="Развернуть плеер"
            >
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">
                  {activeTrack.title || 'Без названия'}
                </p>
                {isPlaying && (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                  </motion.div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeTrack.artist_name || activeTrack.style?.slice(0, 35) || 'AI Generated'}
              </p>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-0.5">
              {/* Queue button */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQueueOpen(true)}
                  className={cn(
                    "h-9 w-9 rounded-full relative",
                    queue.length > 0 && "text-primary"
                  )}
                  title="Очередь"
                >
                  <ListMusic className="w-4 h-4" />
                  {queue.length > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-primary text-primary-foreground border-0 shadow-md"
                    >
                      {queue.length > 9 ? '9+' : queue.length}
                    </Badge>
                  )}
                </Button>
              </motion.div>

              {/* Previous */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previousTrack}
                  className="h-9 w-9 rounded-full"
                  title="Предыдущий трек"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              </motion.div>

              {/* Play/Pause - enhanced */}
              <motion.div 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {/* Glow effect when playing */}
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 bg-primary/30 rounded-full blur-lg"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleTogglePlay}
                  className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg relative"
                  title={isPlaying ? 'Пауза' : 'Воспроизвести'}
                >
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                      >
                        <Pause className="w-5 h-5 fill-current" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -90 }}
                      >
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
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
                  onClick={nextTrack}
                  className="h-9 w-9 rounded-full"
                  title="Следующий трек"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </motion.div>

              {/* Close */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={minimizePlayer}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  title="Свернуть"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </>
  );
}
