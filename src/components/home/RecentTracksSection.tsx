import { useMemo } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Play, Pause, Music2, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTracks } from '@/hooks/useTracks';
import { usePlayerStore } from '@/hooks/audio';
import { cn } from '@/lib/utils';

interface RecentTracksSectionProps {
  className?: string;
  maxTracks?: number;
}

export function RecentTracksSection({ className, maxTracks = 4 }: RecentTracksSectionProps) {
  const navigate = useNavigate();
  const { tracks, isLoading } = useTracks({ sortBy: 'recent', pageSize: maxTracks });
  const { activeTrack, isPlaying } = usePlayerStore();

  const recentTracks = useMemo(() => 
    (tracks || []).slice(0, maxTracks).filter(t => t.status === 'completed' && t.audio_url),
    [tracks, maxTracks]
  );

  if (isLoading) {
    return (
      <section className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted/30 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className="h-[72px] bg-muted/30 rounded-xl animate-pulse" 
              style={{ animationDelay: `${i * 100}ms` }}
            />
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
    
    const isCurrentTrack = activeTrack?.id === track.id;
    
    if (isCurrentTrack) {
      usePlayerStore.setState({ isPlaying: !isPlaying });
    } else {
      usePlayerStore.setState({
        queue: recentTracks,
        currentIndex: recentTracks.findIndex(t => t.id === track.id),
        activeTrack: track,
        isPlaying: true,
        playerMode: 'compact',
      });
    }
  };

  return (
    <section className={cn("space-y-4", className)}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center border border-blue-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <Clock className="w-4 h-4 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-base font-bold text-gradient">Недавние</h2>
            <p className="text-xs text-muted-foreground">Ваши последние треки</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/library')}
          className="h-8 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl"
        >
          Все
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Enhanced Grid */}
      <div className="grid grid-cols-2 gap-3">
        {recentTracks.map((track, index) => {
          const isCurrentTrack = activeTrack?.id === track.id;
          const isTrackPlaying = isCurrentTrack && isPlaying;
          
          return (
            <motion.button
              key={track.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handlePlay(track)}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-300",
                "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
                "border border-border/50 hover:border-primary/40",
                "hover:shadow-lg hover:shadow-primary/5",
                isCurrentTrack && "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
              )}
            >
              {/* Cover with animated play state */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0 shadow-md">
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title || 'Track'}
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-300",
                      "group-hover:scale-110"
                    )}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <Music2 className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                
                {/* Play overlay with animation */}
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all duration-300",
                  "bg-gradient-to-t from-black/60 via-black/30 to-transparent",
                  isCurrentTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isTrackPlaying ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Disc3 className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '3s' }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                    >
                      <Play className="w-4 h-4 text-primary fill-primary ml-0.5" />
                    </motion.div>
                  )}
                </div>
                
                {/* Playing indicator bar */}
                {isTrackPlaying && (
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className={cn(
                  "text-sm font-semibold truncate transition-colors",
                  isCurrentTrack && "text-primary"
                )}>
                  {track.title || 'Без названия'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.style?.slice(0, 25) || track.computed_genre || 'AI Generated'}
                </p>
                {track.computed_mood && (
                  <Badge variant="glass" className="text-[9px] px-1.5 py-0">
                    {track.computed_mood}
                  </Badge>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
