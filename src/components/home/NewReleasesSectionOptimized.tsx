import { Clock } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { cn } from '@/lib/utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContentOptimized';

interface NewReleasesSectionOptimizedProps {
  tracks: PublicTrackWithCreator[];
  isLoading: boolean;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function NewReleasesSectionOptimized({ tracks, isLoading, onRemix, className }: NewReleasesSectionOptimizedProps) {
  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h2 className="text-lg sm:text-2xl font-bold">Новинки</h2>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>Пока нет новых релизов. Станьте первым!</p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">Новинки</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Свежие треки от сообщества
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tracks.map((track) => (
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
