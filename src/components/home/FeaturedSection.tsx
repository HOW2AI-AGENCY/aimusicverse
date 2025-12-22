import { Sparkles } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { cn } from '@/lib/utils';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';
import { SectionHeaderSkeleton, TrackCardSkeleton } from '@/components/ui/skeleton-components';

interface FeaturedSectionProps {
  tracks: PublicTrackWithCreator[];
  isLoading: boolean;
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function FeaturedSection({ tracks, isLoading, onRemix, className }: FeaturedSectionProps) {
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
        
        {/* Desktop: Grid skeleton */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Featured large card (2x2) */}
          <div className="md:col-span-2 lg:row-span-2">
            <TrackCardSkeleton className="h-full" />
          </div>
          {/* Smaller cards */}
          {[...Array(6)].map((_, i) => (
            <TrackCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Mobile: Horizontal scroll skeleton */}
        <div className="md:hidden flex gap-3 overflow-x-auto pb-3">
          {[...Array(4)].map((_, i) => (
            <TrackCardSkeleton key={i} className="min-w-[140px] flex-shrink-0" />
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
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">Избранное</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Лучшие треки от сообщества
          </p>
        </div>
      </div>

      {/* Featured Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks[0] && (
          <div className="md:col-span-2 lg:row-span-2">
            <PublicTrackCard
              track={tracks[0]}
              onRemix={onRemix}
              className="h-full"
            />
          </div>
        )}
        {tracks.slice(1, 7).map((track) => (
          <PublicTrackCard
            key={track.id}
            track={track}
            onRemix={onRemix}
          />
        ))}
      </div>

      {/* Mobile: Horizontal Scroll - Consistent card widths */}
      <div className="md:hidden overflow-x-auto scrollbar-hide -mx-3 px-3">
        <div className="flex gap-3 pb-3">
          {tracks.map((track) => (
            <div key={track.id} className="w-[140px] flex-shrink-0">
              <PublicTrackCard
                track={track}
                onRemix={onRemix}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
