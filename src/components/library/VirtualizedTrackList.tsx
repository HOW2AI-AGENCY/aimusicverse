import { useCallback, forwardRef, memo, useEffect, useRef, useMemo } from "react";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import type { Track } from "@/types/track";
import { TrackCard } from "@/components/TrackCard";
import { Loader2 } from "lucide-react";
import { GridSkeleton, TrackCardSkeleton, TrackCardSkeletonCompact } from "@/components/ui/skeleton-components";
import { TrackListProvider } from "@/contexts/TrackListContext";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'VirtualizedTrackList' });

// Safety timeout duration to reset loadingRef if it gets stuck
const LOADING_SAFETY_TIMEOUT_MS = 5000;

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

// List container for virtuoso list view
const ListContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, style, ...props }, ref) => (
    <div ref={ref} style={style} {...props} className="flex flex-col gap-3 px-4 sm:px-6">
      {children}
    </div>
  )
);
ListContainer.displayName = "ListContainer";

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
}) {
  return (
    <TrackCard
      track={track}
      layout={viewMode}
      isPlaying={isPlaying}
      onPlay={onPlay}
      onDelete={onDelete}
      onDownload={onDownload}
      onToggleLike={onToggleLike}
      versionCount={counts.versionCount}
      stemCount={counts.stemCount}
      hasMidi={midiStatus?.hasMidi}
      hasPdf={midiStatus?.hasPdf}
      hasGp5={midiStatus?.hasGp5}
      isFirstSwipeableItem={index === 0 && viewMode === "list"}
    />
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
  onLoadMore,
  hasMore,
  isLoadingMore,
  onTrackSelect,
  selectedTrackId,
}: VirtualizedTrackListProps) {
  const loadingRef = useRef(false);
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, []);
  
  // Stable props for Virtuoso to avoid internal re-init loops
  const increaseViewportBy = useMemo(() => ({ top: 300, bottom: 800 }), []);

  // Memoize item key computation for better React reconciliation
  const computeItemKey = useCallback((index: number, item?: Track) => item?.id || `track-${index}`, []);

  const renderTrackItem = useCallback(
    (index: number, track: Track) => {
      const counts = getCountsForTrack(track.id);
      const midiStatus = getMidiStatus?.(track.id);
      return (
        <MemoizedTrackItem
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
        />
      );
    },
    [viewMode, activeTrackId, getCountsForTrack, getMidiStatus, onPlay, onDelete, onDownload, onToggleLike]
  );

  // Improved load more with debounce protection
  const handleEndReached = useCallback(() => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current || isLoadingMore) {
      log.debug('Skipping load - already loading', { loadingRef: loadingRef.current, isLoadingMore });
      return;
    }
    
    // Only load if there's more data
    if (hasMore && tracks.length > 0) {
      loadingRef.current = true;
      log.info('Loading more tracks (endReached)', { 
        currentCount: tracks.length, 
        hasMore, 
        isLoadingMore 
      });
      
      // Clear any existing safety timeout
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      
      // Use setTimeout to break potential synchronous loops
      setTimeout(() => {
        onLoadMore();
        // Safety: Reset loading flag after timeout if nothing happens
        safetyTimeoutRef.current = setTimeout(() => {
          if (loadingRef.current) {
            log.warn('LoadingRef stuck, resetting after timeout');
            loadingRef.current = false;
          }
        }, LOADING_SAFETY_TIMEOUT_MS);
      }, 0);
    } else {
      log.debug('Not loading more', { hasMore, trackCount: tracks.length, loadingRef: loadingRef.current, isLoadingMore });
    }
  }, [hasMore, isLoadingMore, onLoadMore, tracks.length]);

  
  // Reset loading flag when loading state changes
  useEffect(() => {
    if (!isLoadingMore) {
      // Small delay to prevent immediate re-trigger
      const timer = setTimeout(() => {
        loadingRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMore]);
  
  // Footer component to show loading indicator
  const Footer = useCallback(() => {
    if (!hasMore) return null;
    
    return (
      <div className="flex justify-center py-6">
        {isLoadingMore ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          // Invisible trigger for intersection observer backup
          <div className="h-1" />
        )}
      </div>
    );
  }, [hasMore, isLoadingMore]);

  const gridComponents = useMemo(
    () => ({ List: GridContainer, Item: GridItemWrapper, Footer }),
    [Footer]
  );

  const listComponents = useMemo(
    () => ({ List: ListContainer, Footer }),
    [Footer]
  );

  // Grid view with VirtuosoGrid
  if (viewMode === "grid") {
    return (
      <TrackListProvider tracks={tracks}>
        <VirtuosoGrid
          useWindowScroll
          data={tracks}
          overscan={100}
          computeItemKey={computeItemKey}
          components={gridComponents}
          endReached={handleEndReached}
          itemContent={renderTrackItem}
          increaseViewportBy={increaseViewportBy}
        />
      </TrackListProvider>
    );
  }

  // List view with Virtuoso
  return (
    <TrackListProvider tracks={tracks}>
      <Virtuoso
        useWindowScroll
        data={tracks}
        overscan={150}
        computeItemKey={computeItemKey}
        components={listComponents}
        endReached={handleEndReached}
        itemContent={renderTrackItem}
        increaseViewportBy={increaseViewportBy}
      />
    </TrackListProvider>
  );
});