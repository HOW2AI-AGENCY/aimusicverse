import { TrendingUp, Flame } from 'lucide-react';
import { PublicTrackCard } from './PublicTrackCard';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PopularSectionProps {
  onRemix?: (trackId: string) => void;
  className?: string;
}

export function PopularSection({ onRemix, className }: PopularSectionProps) {
  const { tracks: trendingTracks, isLoading: trendingLoading } = usePublicContent({
    sort: 'trending',
    limit: 12,
  });

  const { tracks: popularTracks, isLoading: popularLoading } = usePublicContent({
    sort: 'popular',
    limit: 12,
  });

  const isLoading = trendingLoading || popularLoading;

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

  return (
    <section className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Popular</h2>
          <p className="text-sm text-muted-foreground">
            Most played and liked tracks
          </p>
        </div>
      </div>

      {/* Tabs for Trending vs All-Time Popular */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="popular">
            All-Time Popular
          </TabsTrigger>
        </TabsList>

        {/* Trending Tab */}
        <TabsContent value="trending" className="mt-4">
          {trendingTracks && trendingTracks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trendingTracks.map((track, index) => (
                <div key={track.id} className="relative">
                  {/* Ranking Badge */}
                  {index < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                  )}
                  <PublicTrackCard
                    track={track}
                    artistName={(track.metadata as any)?.artist_name}
                    artistAvatar={(track.metadata as any)?.artist_avatar}
                    onRemix={onRemix}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trending tracks yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Popular Tab */}
        <TabsContent value="popular" className="mt-4">
          {popularTracks && popularTracks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {popularTracks.map((track, index) => (
                <div key={track.id} className="relative">
                  {/* Ranking Badge */}
                  {index < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                  )}
                  <PublicTrackCard
                    track={track}
                    artistName={(track.metadata as any)?.artist_name}
                    artistAvatar={(track.metadata as any)?.artist_avatar}
                    onRemix={onRemix}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No popular tracks yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
