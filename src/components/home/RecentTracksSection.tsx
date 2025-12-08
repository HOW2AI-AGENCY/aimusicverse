import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Play, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTracksInfinite } from '@/hooks/useTracksInfinite';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { cn } from '@/lib/utils';

interface RecentTracksSectionProps {
  className?: string;
  maxTracks?: number;
}

export function RecentTracksSection({ className, maxTracks = 4 }: RecentTracksSectionProps) {
  const navigate = useNavigate();
  const { tracks, isLoading } = useTracksInfinite({ sortBy: 'recent', pageSize: maxTracks });
  const { activeTrack, playTrack } = usePlayerStore();

  const recentTracks = useMemo(() => 
    (tracks || []).slice(0, maxTracks).filter(t => t.status === 'completed' && t.audio_url),
    [tracks, maxTracks]
  );

  if (isLoading) {
    return (
      <section className={cn("space-y-3", className)}>
        <div className="h-6 w-32 bg-muted/30 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (recentTracks.length === 0) {
    return null;
  }

  const handlePlay = (track: typeof recentTracks[0]) => {
    if (!track.audio_url) return;
    
    usePlayerStore.setState({
      queue: recentTracks,
      currentIndex: recentTracks.findIndex(t => t.id === track.id),
      activeTrack: track,
      isPlaying: true,
      playerMode: 'compact',
    });
  };

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Недавние</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/library')}
          className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Все
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {recentTracks.map((track, index) => {
          const isPlaying = activeTrack?.id === track.id;
          
          return (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handlePlay(track)}
              className={cn(
                "group flex items-center gap-3 p-2 rounded-xl text-left transition-all",
                "bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30",
                isPlaying && "border-primary/50 bg-primary/5"
              )}
            >
              {/* Cover */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0">
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title || 'Track'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
                  isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <Play className={cn(
                    "w-5 h-5 text-white",
                    isPlaying && "fill-white"
                  )} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {track.title || 'Без названия'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.style?.slice(0, 30) || track.prompt?.slice(0, 30) || 'AI Generated'}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
