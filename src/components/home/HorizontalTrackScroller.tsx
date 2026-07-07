/**
 * HorizontalTrackScroller — reusable horizontal-scroll list of track cards
 * with auto-prefetch sentinel and priority loading for the first 4 covers.
 *
 * Extracted from FeaturedSection so the same behaviour can be reused across
 * home sections and to keep the section files thin.
 */
import { memo, useRef, useEffect } from "react";
import { Loader2 } from "@/lib/icons";
import { UnifiedTrackCard } from "@/components/track/track-card-new";
import { Button } from "@/components/ui/button";
import { useAutoLoadMore } from "@/hooks/useAutoLoadMore";
import type { TrackData } from "@/components/track/track-card-new/types";

interface Props {
  tracks: TrackData[];
  onTrackClick: (track: TrackData) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** How many first cards get eager/high-priority image loading. */
  priorityCount?: number;
}

export const HorizontalTrackScroller = memo(function HorizontalTrackScroller({
  tracks,
  onTrackClick,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  priorityCount = 4,
}: Props) {
  const sentinelRef = useAutoLoadMore<HTMLDivElement>({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: onLoadMore ?? (() => {}),
    rootMargin: "400px",
    disabled: !onLoadMore,
  });

  // Also observe horizontal-scroll end via native scroll (IntersectionObserver
  // covers vertical; horizontal-only intersection can miss when parent is a
  // horizontal scroller — a lightweight scroll listener catches it).
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !onLoadMore || !hasMore || isLoadingMore) return;
    const onScroll = () => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 400) {
        onLoadMore();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div
      ref={scrollerRef}
      className="flex gap-5 lg:gap-6 overflow-x-auto pb-4 scroll-smooth touch-pan-x scrollbar-hide"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {tracks.map((track, idx) => (
        <div key={track.id} className="flex-shrink-0 w-[165px] sm:w-[180px] lg:w-[200px] xl:w-[220px] group">
          <UnifiedTrackCard
            track={track}
            variant="grid"
            onPlay={() => onTrackClick(track)}
            showActions={false}
            priority={idx < priorityCount}
            className="h-full transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary/10 group-hover:-translate-y-1"
          />
        </div>
      ))}

      {hasMore && onLoadMore && (
        <div
          ref={sentinelRef}
          className="flex-shrink-0 w-[140px] flex items-center justify-center"
          aria-hidden="true"
        >
          {isLoadingMore ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Button variant="outline" size="sm" onClick={onLoadMore} className="h-10 px-4 border-dashed">
              Ещё
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
