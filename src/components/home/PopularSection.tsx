import { TrendingUp } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { cn } from '@/lib/utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { GridSkeleton, TrackCardSkeleton } from '@/components/ui/skeleton-components';

interface PopularSectionProps {
  tracks: PublicTrackWithCreator[];
  isLoading: boolean;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function PopularSection({ tracks, isLoading, onRemix, className }: PopularSectionProps) {
  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        {/* Section header skeleton */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-muted animate-pulse rounded" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        {/* Grid skeleton - responsive columns */}
        <GridSkeleton count={10} columns={4} SkeletonComponent={TrackCardSkeleton} />
      </section>
    );
  }

  if (!tracks || tracks.length === 0) {
    return null;
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">Популярное</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Самые прослушиваемые треки
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tracks.slice(0, 10).map((track) => (
          <PublicTrackCard
            key={track.id}
            track={track}
            onRemix={onRemix}
          />
        ))}
      </div>
    </section>
  );
}
