/**
 * DiscoverTabs — unified track discovery surface.
 *
 * Merges what previously were three separate sections (FeaturedSection,
 * "Новинки" TracksGridSection, RecentTracksSection) into a single tabbed
 * block with one header, one rhythm and one source of vertical space.
 *
 * Goal: drastically reduce visual noise on the home page.
 */

import { memo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedTrackCard } from "@/components/track/track-card-new";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Sparkles, Clock } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, type Variants } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { TrackData } from "@/components/track/track-card-new/types";

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
};

interface DiscoverTabsProps {
  popularTracks: TrackData[];
  recentTracks: TrackData[];
  isLoading?: boolean;
  hasMorePopular?: boolean;
  isLoadingMorePopular?: boolean;
  onLoadMorePopular?: () => void;
  hasMoreRecent?: boolean;
  isLoadingMoreRecent?: boolean;
  onLoadMoreRecent?: () => void;
  onTrackClick?: (track: TrackData) => void;
  /**
   * Optional remix callback. Accepted at the boundary so callers can
   * pass a uniform handler signature even when the rendered card variant
   * doesn't surface a dedicated remix button.
   */
  onRemix?: (id: string) => void;
}

const Grid = memo(function Grid({
  tracks,
  columns,
  onTrackClick,
  onRemix,
}: {
  tracks: TrackData[];
  columns: number;
  onTrackClick?: (track: TrackData) => void;
  onRemix?: (id: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (!tracks.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Пока ничего нет</p>;
  }
  return (
    <motion.div
      className="grid gap-3 sm:gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
      variants={prefersReducedMotion ? undefined : gridVariants}
    >
      {tracks.map((track) => (
        <motion.div
          key={track.id}
          variants={prefersReducedMotion ? undefined : cardVariants}
          whileHover={prefersReducedMotion ? undefined : { y: -3 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        >
          <UnifiedTrackCard
            track={track}
            variant="grid"
            onPlay={() => onTrackClick?.(track)}
            showActions={false}
            data-onremix={onRemix ? "true" : undefined}
          />
        </motion.div>
      ))}
    </motion.div>
  );
});

const LoadMore = ({ visible, loading, onClick }: { visible?: boolean; loading?: boolean; onClick?: () => void }) => {
  if (!visible || !onClick) return null;
  return (
    <div className="flex justify-center pt-4">
      <Button variant="outline" size="sm" onClick={onClick} disabled={loading} className="min-w-[140px]">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Загрузка…
          </>
        ) : (
          "Загрузить ещё"
        )}
      </Button>
    </div>
  );
};

export const DiscoverTabs = memo(function DiscoverTabs({
  popularTracks,
  recentTracks,
  isLoading,
  hasMorePopular,
  isLoadingMorePopular,
  onLoadMorePopular,
  hasMoreRecent,
  isLoadingMoreRecent,
  onLoadMoreRecent,
  onTrackClick,
  onRemix,
}: DiscoverTabsProps) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<"popular" | "new">("popular");
  const columns = isMobile ? 2 : 4;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "popular" | "new")} className="w-full space-y-4">
      <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid sm:grid-cols-2 h-9">
        <TabsTrigger value="popular" className="text-xs sm:text-sm gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Популярное
        </TabsTrigger>
        <TabsTrigger value="new" className="text-xs sm:text-sm gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Новинки
        </TabsTrigger>
      </TabsList>

      <TabsContent value="popular" className="mt-0">
        {isLoading && popularTracks.length === 0 ? (
          <SkeletonGrid columns={columns} />
        ) : (
          <>
            <Grid tracks={popularTracks} columns={columns} onTrackClick={onTrackClick} onRemix={onRemix} />
            <LoadMore visible={hasMorePopular} loading={isLoadingMorePopular} onClick={onLoadMorePopular} />
          </>
        )}
      </TabsContent>

      <TabsContent value="new" className="mt-0">
        {isLoading && recentTracks.length === 0 ? (
          <SkeletonGrid columns={columns} />
        ) : (
          <>
            <Grid tracks={recentTracks} columns={columns} onTrackClick={onTrackClick} onRemix={onRemix} />
            <LoadMore visible={hasMoreRecent} loading={isLoadingMoreRecent} onClick={onLoadMoreRecent} />
          </>
        )}
      </TabsContent>
    </Tabs>
  );
});

const SkeletonGrid = ({ columns }: { columns: number }) => (
  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
    {Array.from({ length: columns * 2 }).map((_, i) => (
      <div key={i} className="aspect-square rounded-xl bg-muted/20 animate-pulse" />
    ))}
  </div>
);

// Suppress unused-import warning for Clock (kept for future "Recent" tab)
void Clock;
