/**
 * QuickPlaySection - Секция для быстрого начала прослушивания
 * Показывает 3 рекомендованных трека с крупными кнопками play
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Play, Pause, Heart, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTelegram } from '@/contexts/TelegramContext';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import type { Track } from '@/types/track';

interface QuickPlaySectionProps {
  tracks: PublicTrackWithCreator[];
  isLoading?: boolean;
  className?: string;
}

const TrackQuickCard = memo(function TrackQuickCard({
  track,
  index,
}: {
  track: PublicTrackWithCreator;
  index: number;
}) {
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { hapticFeedback } = useTelegram();

  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const trackForPlayer: Track = {
    ...track,
    is_liked: track.user_liked ?? false,
    likes_count: track.like_count ?? 0,
  } as Track;

  const handlePlay = useCallback(() => {
    hapticFeedback('medium');
    if (isCurrentTrack && isPlaying) {
      pauseTrack();
    } else {
      playTrack(trackForPlayer);
    }
  }, [hapticFeedback, isCurrentTrack, isPlaying, pauseTrack, playTrack, trackForPlayer]);

  const coverUrl = track.local_cover_url || track.cover_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      className="flex-1 min-w-0"
    >
      <button
        onClick={handlePlay}
        className={cn(
          "relative w-full aspect-square rounded-2xl overflow-hidden group",
          "bg-card border border-border/50 transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]",
          isCurrentlyPlaying && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {/* Cover */}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={track.title || 'Track'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Headphones className="w-8 h-8 text-primary/40" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play Button - larger on mobile */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
              "bg-primary/90 backdrop-blur-sm shadow-xl",
              "group-hover:scale-110 transition-transform"
            )}
            animate={isCurrentlyPlaying ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground ml-0.5" />
            )}
          </motion.div>
        </div>

        {/* Track Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
          <p className="text-white font-semibold text-xs sm:text-sm truncate mb-0.5">
            {track.title || 'Без названия'}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2 text-white/70 text-[10px] sm:text-xs">
            {(track.like_count || 0) > 0 && (
              <span className="flex items-center gap-0.5 sm:gap-1">
                <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {track.like_count}
              </span>
            )}
            {track.creator_name && (
              <span className="truncate">{track.creator_name}</span>
            )}
          </div>
        </div>

        {/* Playing indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-3 left-3">
            <motion.div
              className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-primary text-primary-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <div className="flex items-center gap-0.5 h-3">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-primary-foreground rounded-full"
                    animate={{ height: ['30%', '100%', '50%', '80%', '30%'] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </button>
    </motion.div>
  );
});

export const QuickPlaySection = memo(function QuickPlaySection({
  tracks,
  isLoading,
  className,
}: QuickPlaySectionProps) {
  const displayTracks = tracks.slice(0, 3);

  if (isLoading || displayTracks.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-4 sm:py-5", className)}>
      {/* Section header with hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎧</span>
          <h2 className="text-base sm:text-lg font-semibold">
            Начни слушать
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground pl-7">
          Нажми на обложку — музыка заиграет мгновенно
        </p>
      </motion.div>

      {/* Track cards grid */}
      <div className="flex gap-3 sm:gap-4">
        {displayTracks.map((track, index) => (
          <TrackQuickCard key={track.id} track={track} index={index} />
        ))}
      </div>
    </section>
  );
});
