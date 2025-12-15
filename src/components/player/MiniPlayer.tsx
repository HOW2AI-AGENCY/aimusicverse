import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, SkipForward, X, Music2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/hooks/audio';
import { cn } from '@/lib/utils';
import { MusicRecognitionDialog } from '@/components/music-recognition/MusicRecognitionDialog';

interface MiniPlayerProps {
  className?: string;
  onExpand?: () => void;
}

export function MiniPlayer({ className, onExpand }: MiniPlayerProps) {
  const { activeTrack, isPlaying, playTrack, pauseTrack, nextTrack, playerMode, setPlayerMode, minimizePlayer } = usePlayerStore();
  const [recognitionOpen, setRecognitionOpen] = useState(false);

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
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed bottom-20 left-2 right-2 z-40",
          "bg-card/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50",
          "overflow-hidden",
          className
        )}
      >
        <div className="flex items-center gap-3 p-2">
          {/* Cover */}
          <button
            onClick={onExpand || (() => setPlayerMode('expanded'))}
            className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0 touch-scale-sm transition-transform"
            aria-label="Развернуть плеер"
            title="Развернуть плеер"
          >
            {activeTrack.cover_url ? (
              <img
                src={activeTrack.cover_url}
                alt={activeTrack.title || 'Track'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="w-5 h-5 text-muted-foreground" />
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
          </button>

          {/* Info */}
          <button
            onClick={onExpand || (() => setPlayerMode('expanded'))}
            className="flex-1 min-w-0 text-left touch-scale-sm transition-transform"
            aria-label={`Сейчас играет: ${activeTrack.title || 'Без названия'}, ${activeTrack.artist_name || activeTrack.style?.slice(0, 30) || 'AI Generated'}`}
            title="Развернуть плеер"
          >
            <p className="text-sm font-medium truncate">
              {activeTrack.title || 'Без названия'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {activeTrack.artist_name || activeTrack.style?.slice(0, 30) || 'AI Generated'}
            </p>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRecognitionOpen(true)}
              className="h-8 w-8 rounded-full text-muted-foreground touch-scale-sm"
              title="Распознать музыку"
              aria-label="Распознать музыку"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleTogglePlay}
              className="h-10 w-10 rounded-full touch-scale-sm"
              aria-label={isPlaying ? 'Приостановить' : 'Воспроизвести'}
              title={isPlaying ? 'Приостановить' : 'Воспроизвести'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextTrack}
              className="h-9 w-9 rounded-full touch-scale-sm"
              aria-label="Следующий трек"
              title="Следующий трек"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={minimizePlayer}
              className="h-8 w-8 rounded-full text-muted-foreground touch-scale-sm"
              aria-label="Свернуть плеер"
              title="Свернуть плеер"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      <MusicRecognitionDialog 
        open={recognitionOpen} 
        onOpenChange={setRecognitionOpen} 
      />
    </AnimatePresence>
  );
}
