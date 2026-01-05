import { memo } from 'react';
import { motion } from '@/lib/motion';
import { LucideIcon } from 'lucide-react';
import { TrackCardEnhanced } from './TrackCardEnhanced';
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
}: TracksGridSectionProps) {
  const displayTracks = tracks.slice(0, maxTracks);

  if (!isLoading && displayTracks.length === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-4", className)}>
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

      {isLoading ? (
        <GridSkeleton 
          count={maxTracks} 
          columns={columns} 
          SkeletonComponent={TrackCardSkeleton}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <ResponsiveGrid columns={columns} gap={3}>
            {displayTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.25 }}
              >
                <TrackCardEnhanced
                  track={track}
                  onRemix={onRemix}
                />
              </motion.div>
            ))}
          </ResponsiveGrid>
        </motion.div>
      )}
    </section>
  );
});