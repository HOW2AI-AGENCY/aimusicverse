/**
 * TracksGridSection - Grid display of tracks with optional load more
 * 
 * Features:
 * - Responsive grid layout
 * - Optional "Load More" button for infinite scroll
 * - Skeleton loading states
 * - Mobile-optimized with 2 columns
 * 
 * TODO: Add intersection observer for auto-loading
 * TODO: Consider virtual scrolling for large lists
 */

import { memo } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { UnifiedTrackCard } from '@/components/track/track-card-new';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ResponsiveGrid } from '@/components/common/ResponsiveGrid';
import { GridSkeleton, TrackCardSkeleton } from '@/components/ui/skeleton-components';
import { Button } from '@/components/ui/button';

interface TracksGridSectionProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconGradient?: string;
  tracks: PublicTrackWithCreator[];
  isLoading?: boolean;
  maxTracks?: number;
  columns?: 2 | 3 | 4;
  showMoreLink?: string;
  showMoreLabel?: string;
  onRemix?: (trackId: string) => void;
  className?: string;
  hideHeader?: boolean;
  /** Enable load more functionality */
  hasMore?: boolean;
  /** Loading state for load more */
  isLoadingMore?: boolean;
  /** Callback when load more is clicked */
  onLoadMore?: () => void;
}

export const TracksGridSection = memo(function TracksGridSection({
  title,
  subtitle,
  icon,
  iconColor = 'text-primary',
  iconGradient = 'from-primary/20 to-primary/5',
  tracks,
  isLoading,
  maxTracks = 8,
  columns = 4,
  showMoreLink,
  showMoreLabel = 'Все треки',
  onRemix,
  className,
  hideHeader = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: TracksGridSectionProps) {
  const displayTracks = maxTracks ? tracks.slice(0, maxTracks) : tracks;

  if (!isLoading && displayTracks.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-3 sm:space-y-4", className)}>
      {!hideHeader && (
        <SectionHeader
          icon={icon}
          iconColor={iconColor}
          iconGradient={iconGradient}
          title={title}
          subtitle={subtitle}
          showMoreLink={showMoreLink}
          showMoreLabel={showMoreLabel}
          showShowMore={displayTracks.length >= maxTracks && !onLoadMore}
        />
      )}

      {isLoading ? (
        <GridSkeleton 
          count={Math.min(maxTracks, 4)} 
          columns={columns} 
          SkeletonComponent={TrackCardSkeleton}
        />
      ) : (
        <>
          <ResponsiveGrid columns={columns} gap={2}>
            {displayTracks.map((track) => (
              <UnifiedTrackCard
                key={track.id}
                variant="enhanced"
                track={track}
                onRemix={onRemix}
              />
            ))}
          </ResponsiveGrid>
          
          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-3 sm:pt-4">
              <Button
                variant="outline"
                size="default"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="min-w-[160px] sm:min-w-[200px] text-sm"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs sm:text-sm">Загрузка...</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm">Загрузить ещё</span>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
});