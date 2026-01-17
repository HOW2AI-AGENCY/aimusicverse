/**
 * RecentPlaysSection - Recent plays showing last 5 tracks
 * Feature: 001-mobile-ui-redesign
 *
 * Displays the last 5 played tracks in a compact list view.
 * Uses minimal space and provides quick access to recently played content.
 */

import { memo, useCallback, useMemo } from 'react';
import { motion } from '@/lib/motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { UnifiedTrackCard } from '@/components/shared/UnifiedTrackCard';
import type { TrackData } from '@/components/track/track-card-new/types';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';

interface RecentPlaysSectionProps {
  tracks: TrackData[];
  isLoading?: boolean;
  onTrackClick?: (trackId: string) => void;
  className?: string;
  maxTracks?: number;
}

const MAX_TRACKS_DEFAULT = 5;
const SKELETON_COUNT = 5;

export const RecentPlaysSection = memo(function RecentPlaysSection({
  tracks,
  isLoading = false,
  onTrackClick,
  className,
  maxTracks = MAX_TRACKS_DEFAULT,
}: RecentPlaysSectionProps) {
  const { hapticFeedback } = useTelegram();
  const currentTrackId = usePlayerStore((state) => state.activeTrack?.id);

  // Get recent plays from player history, limit to maxTracks
  const recentTracks = useMemo(() => {
    return tracks.slice(0, maxTracks);
  }, [tracks, maxTracks]);

  const handleTrackClick = useCallback((trackId: string) => {
    hapticFeedback('light');
    onTrackClick?.(trackId);
  }, [hapticFeedback, onTrackClick]);

  // Don't render if no tracks and not loading
  if (!isLoading && recentTracks.length === 0) {
    return null;
  }

  return (
    <motion.section
      className={cn("space-y-3", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            Недавние
          </h3>
          <p className="text-xs text-muted-foreground">
            Последние {maxTracks} прослушиваний
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        // Skeleton
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 p-2.5 min-h-[56px]",
                "rounded-lg bg-card/30 border border-border/30",
                "animate-pulse"
              )}
            >
              <div className="w-12 h-12 rounded-lg bg-muted/30 flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3.5 w-4/5 bg-muted/20 rounded-md" />
                <div className="h-2.5 w-1/2 bg-muted/20 rounded-md" />
              </div>
              <div className="w-11 h-11 rounded-full bg-muted/20 flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        // Track list
        <div className="flex flex-col gap-1.5">
          {recentTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <UnifiedTrackCard
                track={track}
                variant="list"
                onPlay={() => handleTrackClick(track.id)}
                isPlaying={track.id === currentTrackId}
                className={cn(
                  "min-h-[56px]",
                  track.id === currentTrackId && "bg-primary/5 border-primary/20"
                )}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty state (only when not loading) */}
      {!isLoading && recentTracks.length === 0 && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-muted-foreground">
            Начните слушать треки, и они появятся здесь
          </p>
        </div>
      )}
    </motion.section>
  );
});
