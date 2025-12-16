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
            "bg-card/98 backdrop-blur-xl rounded-xl shadow-xl border border-border/50",
            "overflow-hidden",
            className
          )}
        >
          {/* Progress bar */}
          <div className="h-0.5 bg-muted/50 relative overflow-hidden">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2 p-2">
            {/* Cover */}
            <button
              onClick={onExpand || (() => setPlayerMode('expanded'))}
              className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0"
              aria-label="Развернуть плеер"
            >
              {activeTrack.cover_url ? (
                <img src={activeTrack.cover_url} alt={activeTrack.title || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Music2 className="w-4 h-4 text-primary/60" />
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex gap-0.5 items-end">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-white rounded-full"
                        animate={{ height: ['6px', '12px', '6px'] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </button>

            {/* Info */}
            <button onClick={onExpand || (() => setPlayerMode('expanded'))} className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium truncate">{activeTrack.title || 'Без названия'}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {activeTrack.artist_name || activeTrack.style?.slice(0, 30) || 'AI'}
              </p>
            </button>

            {/* Controls - Compact */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQueueOpen(true)}
                className={cn("h-8 w-8 rounded-full relative", queue.length > 0 && "text-primary")}
              >
                <ListMusic className="w-3.5 h-3.5" />
                {queue.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 text-[8px] bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    {queue.length > 9 ? '9+' : queue.length}
                  </span>
                )}
              </Button>

              <Button variant="ghost" size="icon" onClick={previousTrack} className="h-8 w-8 rounded-full">
                <SkipBack className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={handleTogglePlay}
                className="h-9 w-9 rounded-full bg-primary shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={nextTrack} className="h-8 w-8 rounded-full">
                <SkipForward className="w-3.5 h-3.5" />
              </Button>

              <Button variant="ghost" size="icon" onClick={minimizePlayer} className="h-7 w-7 rounded-full text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </>
  );
}
