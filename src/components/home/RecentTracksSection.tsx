import { useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Music2, Disc3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTracks } from '@/hooks/useTracks';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/common/SectionHeader';

interface RecentTracksSectionProps {
  className?: string;
  maxTracks?: number;
}

export const RecentTracksSection = memo(function RecentTracksSection({ className, maxTracks = 4 }: RecentTracksSectionProps) {
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
      <SectionHeader
        icon={Clock}
        iconColor="text-blue-400"
        iconGradient="from-blue-500/20 to-cyan-500/10"
        title="Недавние"
        subtitle="Ваши последние треки"
        showMoreLink="/library"
        showMoreLabel="Все"
      />

      {/* Optimized Grid - no heavy animations */}
      <div className="grid grid-cols-2 gap-3">
        {recentTracks.map((track) => {
          const isCurrentTrack = activeTrack?.id === track.id;
          const isTrackPlaying = isCurrentTrack && isPlaying;
          
          return (
            <button
              key={track.id}
              onClick={() => handlePlay(track)}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                "bg-card/60 backdrop-blur-sm",
                "border border-border/40 hover:border-primary/40",
                isCurrentTrack && "border-primary/50 bg-primary/5"
              )}
            >
              {/* Cover */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title || 'Track'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Music2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
                  isCurrentTrack ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isTrackPlaying ? (
                    <Disc3 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '2s' }} />
                  ) : (
                    <Play className="w-4 h-4 text-white fill-white" />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isCurrentTrack && "text-primary"
                )}>
                  {track.title || 'Без названия'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {track.style?.slice(0, 20) || track.computed_genre || 'AI'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
});
