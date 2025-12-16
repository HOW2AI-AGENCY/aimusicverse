import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, SkipForward, SkipBack, X, Music2, ListMusic, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/hooks/audio';
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

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            "fixed bottom-20 left-2 right-2 z-40",
            "bg-card/98 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50",
            "overflow-hidden",
            className
          )}
        >
          {/* Progress bar at top */}
          <div className="h-0.5 bg-muted/50 relative">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-generate"
              initial={{ width: '0%' }}
              animate={{ width: '45%' }}
            />
          </div>

          <div className="flex items-center gap-2 p-2.5">
            {/* Cover with expand action */}
            <button
              onClick={onExpand || (() => setPlayerMode('expanded'))}
              className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0 group"
              aria-label="Развернуть плеер"
            >
              {activeTrack.cover_url ? (
                <img
                  src={activeTrack.cover_url}
                  alt={activeTrack.title || 'Track'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Music2 className="w-5 h-5 text-primary/60" />
                </div>
              )}
              {/* Playing indicator */}
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-white rounded-full"
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
              <p className="text-sm font-medium truncate">
                {activeTrack.title || 'Без названия'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeTrack.artist_name || activeTrack.style?.slice(0, 35) || 'AI Generated'}
              </p>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-0.5">
              {/* Queue button */}
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
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                    {queue.length > 9 ? '9+' : queue.length}
                  </span>
                )}
              </Button>

              {/* Previous */}
              <Button
                variant="ghost"
                size="icon"
                onClick={previousTrack}
                className="h-9 w-9 rounded-full"
                title="Предыдущий трек"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              {/* Play/Pause */}
              <Button
                variant="default"
                size="icon"
                onClick={handleTogglePlay}
                className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                title={isPlaying ? 'Пауза' : 'Воспроизвести'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                )}
              </Button>

              {/* Next */}
              <Button
                variant="ghost"
                size="icon"
                onClick={nextTrack}
                className="h-9 w-9 rounded-full"
                title="Следующий трек"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={minimizePlayer}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                title="Свернуть"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </>
  );
}
