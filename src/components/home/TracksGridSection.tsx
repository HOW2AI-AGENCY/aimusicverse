import { memo } from 'react';
import { LucideIcon } from 'lucide-react';
import { UnifiedTrackCard } from '@/components/track/track-card-new';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ResponsiveGrid } from '@/components/common/ResponsiveGrid';
import { GridSkeleton, TrackCardSkeleton } from '@/components/ui/skeleton-components';

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
}: TracksGridSectionProps) {
  const displayTracks = tracks.slice(0, maxTracks);

  if (!isLoading && displayTracks.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
      {!hideHeader && (
        <SectionHeader
          icon={icon}
          iconColor={iconColor}
          iconGradient={iconGradient}
          title={title}
          subtitle={subtitle}
          showMoreLink={showMoreLink}
          showMoreLabel={showMoreLabel}
          showShowMore={displayTracks.length >= maxTracks}
        />
      )}

      {isLoading ? (
        <GridSkeleton 
          count={Math.min(maxTracks, 4)} 
          columns={columns} 
          SkeletonComponent={TrackCardSkeleton}
        />
      ) : (
        <ResponsiveGrid columns={columns} gap={3}>
          {displayTracks.map((track) => (
            <UnifiedTrackCard
              key={track.id}
              variant="enhanced"
              track={track}
              onRemix={onRemix}
            />
          ))}
        </ResponsiveGrid>
      )}
    </section>
  );
});