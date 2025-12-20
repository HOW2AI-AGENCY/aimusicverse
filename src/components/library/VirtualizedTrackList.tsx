import { useCallback, forwardRef, memo, useMemo } from "react";
import { Virtuoso, VirtuosoGrid, VirtuosoHandle } from "react-virtuoso";
import type { Track } from "@/types/track";
import { TrackCard } from "@/components/TrackCard";

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
}: VirtualizedTrackListProps) {
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

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Grid view with VirtuosoGrid
  if (viewMode === "grid") {
    return (
      <VirtuosoGrid
        useWindowScroll
        totalCount={tracks.length}
        overscan={300} // Increased for smoother scrolling
        computeItemKey={computeItemKey}
        components={{
          List: GridContainer,
          Item: GridItemWrapper,
        }}
        endReached={handleEndReached}
        itemContent={renderTrackItem}
      />
    );
  }

  // List view with Virtuoso
  return (
    <Virtuoso
      useWindowScroll
      totalCount={tracks.length}
      overscan={600} // Higher overscan for list view (larger items)
      computeItemKey={computeItemKey}
      components={{
        List: ListContainer,
      }}
      endReached={handleEndReached}
      itemContent={renderTrackItem}
    />
  );
});