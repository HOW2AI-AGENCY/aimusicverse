import { useCallback, forwardRef, memo, useEffect, useRef } from "react";
import { Virtuoso, VirtuosoGrid, ListRange } from "react-virtuoso";
import type { Track } from "@/types/track";
import { TrackCard } from "@/components/TrackCard";
import { Loader2 } from "lucide-react";
import { GridSkeleton, TrackCardSkeleton, TrackCardSkeletonCompact } from "@/components/ui/skeleton-components";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'VirtualizedTrackList' });

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
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, []);
  
  // Memoize item key computation for better React reconciliation
  const computeItemKey = useCallback(
    (index: number) => tracks[index]?.id || `track-${index}`,
    [tracks]
  );

  const renderTrackItem = useCallback(
    (index: number) => {
      const track = tracks[index];
      if (!track) return null;
      
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
    [tracks, viewMode, activeTrackId, getCountsForTrack, getMidiStatus, onPlay, onDelete, onDownload, onToggleLike]
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
        // Safety: Reset loading flag after 5 seconds if nothing happens
        safetyTimeoutRef.current = setTimeout(() => {
          if (loadingRef.current) {
            log.warn('LoadingRef stuck, resetting after timeout');
            loadingRef.current = false;
          }
        }, 5000);
      }, 0);
    } else {
      log.debug('Not loading more', { hasMore, trackCount: tracks.length, loadingRef: loadingRef.current, isLoadingMore });
    }
  }, [hasMore, isLoadingMore, onLoadMore, tracks.length]);

  // Range-based loading as backup trigger (when 5 items from end)
  const handleRangeChanged = useCallback((range: ListRange) => {
    const { endIndex } = range;
    const threshold = Math.max(0, tracks.length - 5);
    
    // Prevent loading if no tracks or already loading
    if (tracks.length === 0 || loadingRef.current || isLoadingMore) {
      return;
    }
    
    if (endIndex >= threshold && hasMore) {
      loadingRef.current = true;
      log.info('Range trigger: loading more', { endIndex, threshold, total: tracks.length });
      
      // Clear any existing safety timeout
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      
      setTimeout(() => {
        onLoadMore();
        // Safety: Reset loading flag after 5 seconds if nothing happens
        safetyTimeoutRef.current = setTimeout(() => {
          if (loadingRef.current) {
            log.warn('LoadingRef stuck (range), resetting after timeout');
            loadingRef.current = false;
          }
        }, 5000);
      }, 0);
    }
  }, [tracks.length, hasMore, isLoadingMore, onLoadMore]);
  
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

  // Grid view with VirtuosoGrid
  if (viewMode === "grid") {
    return (
      <VirtuosoGrid
        useWindowScroll
        totalCount={tracks.length}
        overscan={100}
        computeItemKey={computeItemKey}
        components={{
          List: GridContainer,
          Item: GridItemWrapper,
          Footer,
        }}
        endReached={handleEndReached}
        rangeChanged={handleRangeChanged}
        itemContent={renderTrackItem}
        increaseViewportBy={{ top: 300, bottom: 800 }}
      />
    );
  }

  // List view with Virtuoso
  return (
    <Virtuoso
      useWindowScroll
      totalCount={tracks.length}
      overscan={150}
      computeItemKey={computeItemKey}
      components={{
        List: ListContainer,
        Footer,
      }}
      endReached={handleEndReached}
      rangeChanged={handleRangeChanged}
      itemContent={renderTrackItem}
      increaseViewportBy={{ top: 300, bottom: 800 }}
    />
  );
});