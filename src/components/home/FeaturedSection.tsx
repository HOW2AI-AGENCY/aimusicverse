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

const SKELETON_COUNT = 4;

// Lightweight skeleton component
const TrackSkeleton = memo(function TrackSkeleton() {
  return (
    <div className="flex-shrink-0 w-[140px]">
      <div className="aspect-square rounded-xl bg-muted/20 animate-pulse" />
      <div className="mt-2 space-y-1">
        <div className="h-3 w-4/5 bg-muted/15 rounded animate-pulse" />
        <div className="h-2.5 w-1/2 bg-muted/10 rounded animate-pulse" />
      </div>
    </div>
  );
});

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

  // Show lightweight skeleton only when truly loading with no data
  if (isLoading && displayTracks.length === 0) {
    return (
      <section className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-muted/20 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-muted/20 rounded animate-pulse" />
            <div className="h-3 w-36 bg-muted/15 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth touch-pan-x">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
      </section>
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

      {/* Horizontal scroll container - fixed scroll issues */}
      <div 
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth touch-pan-x scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {displayTracks.map((track) => (
          <div
            key={track.id}
            className="flex-shrink-0 w-[140px]"
          >
            <UnifiedTrackCard
              track={track}
              variant="minimal"
              onPlay={() => handleTrackClick(track.id)}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
});
