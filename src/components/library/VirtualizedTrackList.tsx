import { useCallback, forwardRef, memo, useEffect, useRef, useMemo, Component, ErrorInfo, ReactNode } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import type { Track } from "@/types/track";
import { TrackCard } from "@/components/TrackCard";
import { Loader2 } from "lucide-react";
import { GridSkeleton, TrackCardSkeletonCompact } from "@/components/ui/skeleton-components";
import { TrackListProvider } from "@/contexts/TrackListContext";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";

const log = logger.child({ module: 'VirtualizedTrackList' });

// Error boundary for individual track items during HMR
class TrackItemErrorBoundary extends Component<
  { children: ReactNode; trackId?: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; trackId?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log.error('TrackItem render error (likely HMR)', error, { 
      trackId: this.props.trackId,
      errorInfo 
    });
  }

  componentDidUpdate(prevProps: { children: ReactNode; trackId?: string }) {
    // Reset error state when trackId changes (new track loaded)
    if (this.state.hasError && prevProps.trackId !== this.props.trackId) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <TrackCardSkeletonCompact />;
    }
    return this.props.children;
  }
}

interface TrackMidiStatus {
  hasMidi: boolean;
  hasPdf: boolean;
  hasGp5: boolean;
  hasMusicXml: boolean;
  transcriptionCount: number;
}

interface VirtualizedTrackListProps {
  tracks: Track[];
  viewMode: "grid" | "list";
  activeTrackId?: string;
  getCountsForTrack: (trackId: string) => { versionCount: number; stemCount: number };
  getMidiStatus?: (trackId: string) => TrackMidiStatus | undefined;
  onPlay: (track: Track, index: number) => void;
  onDelete: (trackId: string) => void;
  onDownload: (trackId: string, audioUrl: string | null, coverUrl: string | null) => void;
  onToggleLike: (trackId: string, isLiked: boolean) => void;
  onTagClick?: (tag: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onTrackSelect?: (track: Track) => void;
  selectedTrackId?: string;
}

// Optimized grid container - using CSS grid for better performance
const GridContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={style}
      {...props}
      className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 sm:px-6"
    >
      {children}
    </div>
  )
);
GridContainer.displayName = "GridContainer";

// Item wrapper for grid - minimal wrapper
const GridItemWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  )
);
GridItemWrapper.displayName = "GridItemWrapper";

// Memoized track item to prevent unnecessary re-renders
const MemoizedTrackItem = memo(function MemoizedTrackItem({
  track,
  index,
  viewMode,
  isPlaying,
  counts,
  midiStatus,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  onTagClick,
}: {
  track: Track;
  index: number;
  viewMode: "grid" | "list";
  isPlaying: boolean;
  counts: { versionCount: number; stemCount: number };
  midiStatus?: TrackMidiStatus;
  onPlay: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onToggleLike: () => void;
  onTagClick?: (tag: string) => void;
}) {
  return (
    <TrackItemErrorBoundary trackId={track.id}>
      <TrackCard
        track={track}
        layout={viewMode}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onDelete={onDelete}
        onDownload={onDownload}
        onToggleLike={onToggleLike}
        onTagClick={onTagClick}
        versionCount={counts.versionCount}
        stemCount={counts.stemCount}
        hasMidi={midiStatus?.hasMidi}
        hasPdf={midiStatus?.hasPdf}
        hasGp5={midiStatus?.hasGp5}
        isFirstSwipeableItem={index === 0 && viewMode === "list"}
      />
    </TrackItemErrorBoundary>
  );
});

export const VirtualizedTrackList = memo(function VirtualizedTrackList({
  tracks,
  viewMode,
  activeTrackId,
  getCountsForTrack,
  getMidiStatus,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  onTagClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: VirtualizedTrackListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  
  // Stable props for Virtuoso to avoid internal re-init loops
  const increaseViewportBy = useMemo(() => ({ top: 200, bottom: 400 }), []);

  // Memoize item key computation for better React reconciliation
  const computeItemKey = useCallback((index: number, item?: Track) => item?.id || `track-${index}`, []);

  const renderTrackItem = useCallback(
    (index: number, track: Track) => {
      try {
        if (!track || !track.id) {
          log.warn('Invalid track data at index', { index, track });
          return <TrackCardSkeletonCompact />;
        }
        
        const counts = getCountsForTrack(track.id);
        const midiStatus = getMidiStatus?.(track.id);
        return (
          <MemoizedTrackItem
            key={`track-item-${track.id}`}
            track={track}
            index={index}
            viewMode={viewMode}
            isPlaying={activeTrackId === track.id}
            counts={counts}
            midiStatus={midiStatus}
            onPlay={() => onPlay(track, index)}
            onDelete={() => onDelete(track.id)}
            onDownload={() => onDownload(track.id, track.audio_url, track.cover_url)}
            onToggleLike={() => onToggleLike(track.id, track.is_liked || false)}
            onTagClick={onTagClick}
          />
        );
      } catch (error) {
        log.error('Error rendering track item during HMR or runtime', error, { trackId: track?.id, index });
        // Return skeleton as graceful fallback during HMR errors
        return <TrackCardSkeletonCompact key={`skeleton-${track?.id || index}`} />;
      }
    },
    [viewMode, activeTrackId, getCountsForTrack, getMidiStatus, onPlay, onDelete, onDownload, onToggleLike, onTagClick]
  );

  // IntersectionObserver for list view pagination (stable, no virtuoso issues)
  useEffect(() => {
    if (viewMode !== "list") return;
    
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore && !loadingRef.current) {
          loadingRef.current = true;
          log.info('Loading more tracks (intersection)', { currentCount: tracks.length });
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );
    
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, hasMore, isLoadingMore, onLoadMore, tracks.length]);

  // Reset loading ref when loading finishes
  useEffect(() => {
    if (!isLoadingMore) {
      loadingRef.current = false;
    }
  }, [isLoadingMore]);

  // Grid view endReached handler
  const handleGridEndReached = useCallback(() => {
    if (loadingRef.current || isLoadingMore || !hasMore) return;
    loadingRef.current = true;
    log.info('Loading more tracks (grid endReached)', { currentCount: tracks.length });
    setTimeout(() => onLoadMore(), 0);
  }, [hasMore, isLoadingMore, onLoadMore, tracks.length]);

  // Footer for grid
  const GridFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <div className="flex justify-center py-6">
        {isLoadingMore ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="h-1" />
        )}
      </div>
    );
  }, [hasMore, isLoadingMore]);

  const gridComponents = useMemo(
    () => ({ List: GridContainer, Item: GridItemWrapper, Footer: GridFooter }),
    [GridFooter]
  );

  // Grid view with VirtuosoGrid (stable)
  if (viewMode === "grid") {
    return (
      <TrackListProvider tracks={tracks}>
        <VirtuosoGrid
          useWindowScroll
          data={tracks}
          overscan={150}
          computeItemKey={computeItemKey}
          components={gridComponents}
          endReached={handleGridEndReached}
          itemContent={renderTrackItem}
          increaseViewportBy={increaseViewportBy}
        />
      </TrackListProvider>
    );
  }

  // List view - simple map + IntersectionObserver (no virtuoso, stable)
  return (
    <TrackListProvider tracks={tracks}>
      <div className="flex flex-col gap-3 px-4 sm:px-6">
        {tracks.map((track, index) => (
          <div key={track.id}>
            {renderTrackItem(index, track)}
          </div>
        ))}
        
        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />
        
        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Manual load button as fallback */}
        {hasMore && !isLoadingMore && tracks.length > 0 && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              className="text-muted-foreground"
            >
              Загрузить ещё
            </Button>
          </div>
        )}
      </div>
    </TrackListProvider>
  );
});