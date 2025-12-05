import { TrendingUp } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { cn } from '@/lib/utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';

interface PopularSectionOptimizedProps {
  tracks: PublicTrackWithCreator[];
  isLoading: boolean;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function PopularSectionOptimized({ tracks, isLoading, onRemix, className }: PopularSectionOptimizedProps) {
  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
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
