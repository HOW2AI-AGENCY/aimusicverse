import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicTrackCard } from './PublicTrackCard';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';

interface FeaturedSectionProps {
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function FeaturedSection({ onRemix, className }: FeaturedSectionProps) {
  const { tracks, isLoading } = usePublicContent({
    sort: 'featured',
    limit: 10,
  });

  if (isLoading) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
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
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Featured</h2>
          <p className="text-sm text-muted-foreground">
            Curated tracks from talented artists
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Featured Grid - Hero Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Hero Card (First Track - Larger) */}
        {tracks[0] && (
          <div className="md:col-span-2 lg:row-span-2">
            <PublicTrackCard
              track={tracks[0]}
              onRemix={onRemix}
              className="h-full"
            />
          </div>
        )}

        {/* Regular Cards */}
        {tracks.slice(1, 7).map((track) => (
          <PublicTrackCard
            key={track.id}
            track={track}
            onRemix={onRemix}
          />
        ))}
      </div>

      {/* Mobile: Horizontal Scroll */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-4 pb-4">
          {tracks.map((track) => (
            <div key={track.id} className="w-[280px] flex-shrink-0">
              <PublicTrackCard
                track={track}
                onRemix={onRemix}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
