/**
 * FeaturedSection - Featured tracks with horizontal scroll
 * Feature: 001-mobile-ui-redesign
 *
 * Displays a maximum of 6 featured tracks in a horizontally scrollable list.
 * Uses the UnifiedTrackCard with minimalist styling.
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { UnifiedTrackCard } from '@/components/shared/UnifiedTrackCard';
import type { TrackData } from '@/components/track/track-card-new/types';

interface FeaturedSectionProps {
  tracks: TrackData[];
  isLoading?: boolean;
  onTrackClick?: (trackId: string) => void;
  onRemix?: (trackId: string) => void;
  className?: string;
  maxTracks?: number;
}

const SKELETON_COUNT = 6;

export const FeaturedSection = memo(function FeaturedSection({
  tracks,
  isLoading = false,
  onTrackClick,
  onRemix,
  className,
  maxTracks = 6,
}: FeaturedSectionProps) {
  const { hapticFeedback } = useTelegram();

  // Limit to maxTracks for minimalist design
  const displayTracks = tracks.slice(0, maxTracks);

  const handleTrackClick = useCallback((trackId: string) => {
    hapticFeedback('light');
    onTrackClick?.(trackId);
  }, [hapticFeedback, onTrackClick]);

  const handleRemix = useCallback((trackId: string) => {
    hapticFeedback('medium');
    onRemix?.(trackId);
  }, [hapticFeedback, onRemix]);

  if (isLoading) {
    return (
      <motion.section
        className={cn("space-y-3", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-28 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-3.5 w-40 bg-muted/30 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Horizontal scroll skeleton */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{ width: 140 }}
            >
              <div className="aspect-square rounded-xl bg-muted/30 animate-pulse" />
              <div className="mt-2 space-y-1.5">
                <div className="h-3.5 w-4/5 bg-muted/20 rounded-md animate-pulse" />
                <div className="h-2.5 w-1/2 bg-muted/20 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    );
  }

  // Don't render if no tracks
  if (displayTracks.length === 0) {
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
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Популярное
            </h3>
            <p className="text-xs text-muted-foreground">
              Треки, которые слушают сейчас
            </p>
          </div>
        </div>

        {/* Show more button */}
        {displayTracks.length >= maxTracks && (
          <button
            className={cn(
              "px-3 py-1.5 rounded-lg",
              "bg-card/50 backdrop-blur-sm",
              "border border-border/50",
              "text-xs font-medium text-foreground/80",
              "hover:bg-card hover:border-primary/30",
              "active:scale-95",
              "transition-all duration-200",
              "min-h-[36px]"
            )}
          >
            Все
          </button>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {displayTracks.map((track, index) => (
          <motion.div
            key={track.id}
            className="flex-shrink-0"
            style={{ width: 140 }}
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
              variant="minimal"
              onPlay={() => handleTrackClick(track.id)}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
});
