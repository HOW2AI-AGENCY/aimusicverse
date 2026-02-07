/**
 * FeaturedSection - Featured tracks with horizontal scroll
 * Feature: 001-mobile-ui-redesign, 032-professional-ui
 *
 * Displays featured tracks in a horizontally scrollable list with optional "Load More" button.
 * Uses the UnifiedTrackCard with minimalist styling and design system tokens.
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { UnifiedTrackCard } from '@/components/shared/UnifiedTrackCard';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/Heading';
import type { TrackData } from '@/components/track/track-card-new/types';
import { homeSectionColors } from '@/lib/design-colors';

interface FeaturedSectionProps {
  tracks: TrackData[];
  isLoading?: boolean;
  onTrackClick?: (trackId: string) => void;
  onRemix?: (trackId: string) => void;
  className?: string;
  maxTracks?: number;
  /** Enable "Load More" functionality */
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const SKELETON_COUNT = 4;

// Lightweight skeleton component - optimized for scroll performance
const TrackSkeleton = memo(function TrackSkeleton() {
  return (
    <div 
      className="flex-shrink-0 w-[140px]"
      style={{ contain: 'layout paint' }}
    >
      <div className="aspect-square rounded-xl bg-muted/20" />
      <div className="mt-2 space-y-1">
        <div className="h-3 w-4/5 bg-muted/15 rounded" />
        <div className="h-2.5 w-1/2 bg-muted/10 rounded" />
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
  maxTracks,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: FeaturedSectionProps) {
  const { hapticFeedback } = useTelegram();

  // Limit to maxTracks if specified
  const displayTracks = maxTracks ? tracks.slice(0, maxTracks) : tracks;

  const handleTrackClick = useCallback((trackId: string) => {
    hapticFeedback('light');
    onTrackClick?.(trackId);
  }, [hapticFeedback, onTrackClick]);

  const handleLoadMore = useCallback(() => {
    hapticFeedback('light');
    onLoadMore?.();
  }, [hapticFeedback, onLoadMore]);

  // Show lightweight skeleton only when truly loading with no data
  // No animations on skeleton to prevent scroll jank
  if (isLoading && displayTracks.length === 0) {
    return (
      <section 
        className={cn("space-y-3", className)}
        style={{ contain: 'layout' }}
      >
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-muted/20" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-muted/20 rounded" />
            <div className="h-3 w-36 bg-muted/15 rounded" />
          </div>
        </div>
        <div 
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header - using SectionHeader for consistency */}
      <SectionHeader
        title="Популярное"
        subtitle="Треки, которые слушают прямо сейчас"
        icon={TrendingUp}
        iconColor={homeSectionColors.trending.text}
        badge={
          <motion.span 
            className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold border", homeSectionColors.trending.badge)}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            LIVE
          </motion.span>
        }
      />

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
              variant="grid"
              onPlay={() => handleTrackClick(track.id)}
              showActions={false}
              className="h-full"
            />
          </div>
        ))}

        {/* Load More button in horizontal scroll */}
        {hasMore && onLoadMore && (
          <div className="flex-shrink-0 w-[140px] flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="h-10 px-4 border-dashed"
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ещё"
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.section>
  );
});
