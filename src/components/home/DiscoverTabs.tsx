/**
 * DiscoverTabs — unified track discovery surface.
 *
 * Merges what previously were three separate sections (FeaturedSection,
 * "Новинки" TracksGridSection, RecentTracksSection) into a single tabbed
 * block with one header, one rhythm and one source of vertical space.
 *
 * Goal: drastically reduce visual noise on the home page.
 */

import { memo, useState, forwardRef, useMemo, useCallback, useRef } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedTrackCard } from "@/components/track/track-card-new";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Sparkles, Clock, RefreshCw } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-media-query";
import { motion, type Variants, useInView as useFramerInView } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { GridSkeleton } from "@/components/ui/skeleton-components";
import type { TrackData } from "@/components/track/track-card-new/types";

const gridVariants: Variants = {
  hidden: { opacity: 0.9, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

// Windowing kicks in once the list has grown past the first page, so the
// plain animated grid is used for the initial viewport and virtualizer takes
// over after "Load more" adds more rows.
const VIRTUALIZE_THRESHOLD = 16;

interface DiscoverTabsProps {
  popularTracks: TrackData[];
  recentTracks: TrackData[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
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
  const gridRef = useRef<HTMLDivElement>(null);
  const isInView = useFramerInView(gridRef, { once: true, margin: "100px" });

  if (!tracks.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Пока ничего нет</p>;
  }
  return (
    <motion.div
      ref={gridRef}
      className="grid gap-2.5 sm:gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(160px, 1fr))` }}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : isInView ? "visible" : "hidden"}
      variants={prefersReducedMotion ? undefined : gridVariants}
    >
      {tracks.map((track) => (
        <div
          key={track.id}
          className={
            prefersReducedMotion ? undefined : "hover:translate-y-[-3px] active:scale-[0.97] transition-transform"
          }
        >
          <UnifiedTrackCard
            track={track}
            variant="grid"
            onPlay={() => onTrackClick?.(track)}
            showActions={false}
            data-onremix={onRemix ? "true" : undefined}
          />
        </div>
      ))}
    </motion.div>
  );
});

// Windowed variant for long, paginated lists (>= VIRTUALIZE_THRESHOLD). Per-item
// hover/tap motion is kept, but the batch stagger-entrance animation is dropped
// in favor of a plain fade-in — staggerChildren doesn't make sense once items
// are recycled in and out of the DOM by the virtualizer.
const VirtualizedGrid = memo(function VirtualizedGrid({
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

  const GridContainer = useMemo(
    () =>
      forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, style, ...props }, ref) => (
        <div
          ref={ref}
          style={{ ...style, display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(160px, 1fr))` }}
          className="gap-2.5 sm:gap-3"
          {...props}
        >
          {children}
        </div>
      )),
    [columns],
  );

  const gridComponents = useMemo(() => ({ List: GridContainer }), [GridContainer]);

  const computeItemKey = useCallback((index: number) => tracks[index]?.id ?? `track-${index}`, [tracks]);

  const renderItem = useCallback(
    (index: number) => {
      const track = tracks[index];
      if (!track) return null;
      return (
        <div className="hover:translate-y-[-3px] active:scale-[0.97] transition-transform">
          <UnifiedTrackCard
            track={track}
            variant="grid"
            onPlay={() => onTrackClick?.(track)}
            showActions={false}
            data-onremix={onRemix ? "true" : undefined}
          />
        </div>
      );
    },
    [tracks, onTrackClick, onRemix],
  );

  return (
    <VirtuosoGrid
      useWindowScroll
      totalCount={tracks.length}
      computeItemKey={computeItemKey}
      components={gridComponents}
      itemContent={renderItem}
      overscan={400}
    />
  );
});

const LoadMore = ({ visible, loading, onClick }: { visible?: boolean; loading?: boolean; onClick?: () => void }) => {
  if (!visible || !onClick) return null;
  return (
    <div className="flex justify-center pt-3">
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

// Picks the plain animated grid for short lists and only switches to windowed
// rendering once a list has grown past several "load more" pages.
function TracksGrid(props: {
  tracks: TrackData[];
  columns: number;
  onTrackClick?: (track: TrackData) => void;
  onRemix?: (id: string) => void;
}) {
  if (!props.tracks.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Пока ничего нет</p>;
  }
  return props.tracks.length >= VIRTUALIZE_THRESHOLD ? <VirtualizedGrid {...props} /> : <Grid {...props} />;
}

export const DiscoverTabs = memo(function DiscoverTabs({
  popularTracks,
  recentTracks,
  isLoading,
  isError,
  error,
  onRetry,
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
  const isTablet = useIsTablet();
  const [tab, setTab] = useState<"popular" | "new">("popular");
  const columns = isMobile ? 2 : isTablet ? 3 : 4;

  // Error state UI
  if (isError && popularTracks.length === 0 && recentTracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm mb-4">Не удалось загрузить треки</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Повторить
          </Button>
        )}
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "popular" | "new")} className="w-full space-y-3">
      <TabsList className="inline-flex h-9">
        <TabsTrigger value="popular" className="text-xs sm:text-sm gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Популярное
          {popularTracks.length > 0 && (
            <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">{popularTracks.length}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="new" className="text-xs sm:text-sm gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Новинки
          {recentTracks.length > 0 && (
            <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">{recentTracks.length}</span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="popular" className="mt-0">
        {isLoading && popularTracks.length === 0 ? (
          <GridSkeleton columns={columns} count={columns * 2} />
        ) : (
          <>
            <TracksGrid tracks={popularTracks} columns={columns} onTrackClick={onTrackClick} onRemix={onRemix} />
            <LoadMore visible={hasMorePopular} loading={isLoadingMorePopular} onClick={onLoadMorePopular} />
          </>
        )}
      </TabsContent>

      <TabsContent value="new" className="mt-0">
        {isLoading && recentTracks.length === 0 ? (
          <GridSkeleton columns={columns} count={columns * 2} />
        ) : (
          <>
            <TracksGrid tracks={recentTracks} columns={columns} onTrackClick={onTrackClick} onRemix={onRemix} />
            <LoadMore visible={hasMoreRecent} loading={isLoadingMoreRecent} onClick={onLoadMoreRecent} />
          </>
        )}
      </TabsContent>
    </Tabs>
  );
});

// Suppress unused-import warning for Clock (kept for future "Recent" tab)
void Clock;
