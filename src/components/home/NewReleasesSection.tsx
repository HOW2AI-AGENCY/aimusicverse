import { Clock } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NewReleasesSectionProps {
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function NewReleasesSection({ onRemix, className }: NewReleasesSectionProps) {
  const { tracks, isLoading, fetchNextPage, hasNextPage } = usePublicContent({
    sort: 'recent',
    limit: 20,
  });

  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
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
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">New Releases</h2>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p>No new releases yet. Be the first to create something!</p>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">New Releases</h2>
            <p className="text-sm text-muted-foreground">
              Latest tracks from the community
            </p>
          </div>
        </div>
      </div>

      {/* Track Grid - Chronological Order */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tracks.map((track) => (
          <PublicTrackCard
            key={track.id}
            track={track}
            artistName={(track.metadata as any)?.artist_name}
            artistAvatar={(track.metadata as any)?.artist_avatar}
            onRemix={onRemix}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            className="min-w-[200px]"
          >
            Load More
          </Button>
        </div>
      )}
    </section>
  );
}
