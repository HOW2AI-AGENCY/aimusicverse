import { useCallback, forwardRef } from "react";
import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { type Track } from "@/hooks/useTracksOptimized";
import { TrackCard } from "@/components/TrackCard";
import { motion } from "framer-motion";

interface VirtualizedTrackListProps {
  tracks: Track[];
  viewMode: "grid" | "list";
  activeTrackId?: string;
  getCountsForTrack: (trackId: string) => { versionCount: number; stemCount: number };
  onPlay: (track: Track, index: number) => void;
  onDelete: (trackId: string) => void;
  onDownload: (trackId: string, audioUrl: string | null, coverUrl: string | null) => void;
  onToggleLike: (trackId: string, isLiked: boolean) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

// Grid container component for virtuoso grid
const GridContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 sm:px-6"
    />
  )
);
GridContainer.displayName = "GridContainer";

// List container for virtuoso list view
const ListContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className="flex flex-col gap-3 px-4 sm:px-6" />
  )
);
ListContainer.displayName = "ListContainer";

// Item wrapper for grid
const GridItemWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className="w-full">{children}</div>
  )
);
GridItemWrapper.displayName = "GridItemWrapper";

export function VirtualizedTrackList({
  tracks,
  viewMode,
  activeTrackId,
  getCountsForTrack,
  onPlay,
  onDelete,
  onDownload,
  onToggleLike,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: VirtualizedTrackListProps) {
  const renderTrackItem = useCallback(
    (index: number, track: Track) => {
      const counts = getCountsForTrack(track.id);
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <TrackCard
            track={track}
            layout={viewMode}
            isPlaying={activeTrackId === track.id}
            onPlay={() => onPlay(track, index)}
            onDelete={() => onDelete(track.id)}
            onDownload={() => onDownload(track.id, track.audio_url, track.cover_url)}
            onToggleLike={() => onToggleLike(track.id, track.is_liked || false)}
            versionCount={counts.versionCount}
            stemCount={counts.stemCount}
            isFirstSwipeableItem={index === 0 && viewMode === "list"}
          />
        </motion.div>
      );
    },
    [viewMode, activeTrackId, getCountsForTrack, onPlay, onDelete, onDownload, onToggleLike]
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (viewMode === "grid") {
    return (
      <VirtuosoGrid
        useWindowScroll
        totalCount={tracks.length}
        overscan={200}
        components={{
          List: GridContainer,
          Item: GridItemWrapper,
        }}
        endReached={handleEndReached}
        itemContent={(index) => renderTrackItem(index, tracks[index])}
      />
    );
  }

  return (
    <Virtuoso
      useWindowScroll
      totalCount={tracks.length}
      overscan={400}
      components={{
        List: ListContainer,
      }}
      endReached={handleEndReached}
      itemContent={(index) => renderTrackItem(index, tracks[index])}
    />
  );
}
