import { useCallback, forwardRef, memo, useEffect, useRef, useMemo, Component, ErrorInfo, ReactNode, useState } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import type { Track } from "@/types/track";
import { UnifiedTrackCard } from "@/components/track/track-card-new";
import { Loader2, RefreshCw } from "lucide-react";
import { GridSkeleton, TrackCardSkeletonCompact } from "@/components/ui/skeleton-components";
import { TrackListProvider } from "@/contexts/TrackListContext";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "@/lib/motion";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

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
  /** Pull-to-refresh callback */
  onRefresh?: () => Promise<void> | void;
  /** Enable pull-to-refresh feature */
  enablePullToRefresh?: boolean;
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
      <UnifiedTrackCard
        variant={viewMode === 'grid' ? 'grid' : 'list'}
        track={track}
        isPlaying={isPlaying}
        onPlay={onPlay}
        onDelete={onDelete}
        onDownload={onDownload}
        onToggleLike={onToggleLike}
        onTagClick={onTagClick}
        versionCount={counts.versionCount}
        stemCount={counts.stemCount}
        midiStatus={{
          hasMidi: midiStatus?.hasMidi ?? false,
          hasPdf: midiStatus?.hasPdf ?? false,
          hasGp5: midiStatus?.hasGp5 ?? false,
        }}
        isFirstSwipeableItem={index === 0 && viewMode === "list"}
      />
    </TrackItemErrorBoundary>
  );
});

// Pull-to-refresh indicator
const PullToRefreshIndicator = memo(function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}) {
  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;
  
  return (
    <AnimatePresence>
      {(pullDistance > 0 || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe-top"
          style={{
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          }}
        >
          <div className="flex flex-col items-center gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm rounded-b-xl shadow-lg border-x border-b border-border">
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : isReady ? 180 : 0,
              }}
              transition={{
                duration: isRefreshing ? 1 : 0.3,
                repeat: isRefreshing ? Infinity : 0,
                ease: "linear",
              }}
            >
              <RefreshCw
                className={cn(
                  "w-5 h-5 transition-colors",
                  isReady || isRefreshing ? "text-primary" : "text-muted-foreground"
                )}
              />
            </motion.div>
            <span className="text-xs text-muted-foreground font-medium">
              {isRefreshing
                ? "Обновление..."
                : isReady
                ? "Отпустите для обновления"
                : "Потяните для обновления"}
            </span>
            {!isRefreshing && (
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  onRefresh,
  enablePullToRefresh = true,
}: VirtualizedTrackListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const canPull = useRef(false);
  
  // Pull-to-refresh constants
  const PULL_THRESHOLD = 80; // Distance to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance
  
  // Stable props for Virtuoso to avoid internal re-init loops
  const increaseViewportBy = useMemo(() => ({ top: 200, bottom: 400 }), []);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || !onRefresh || isRefreshing) return;
    
    // Check if user is at the top of the scroll container
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    canPull.current = scrollTop === 0;
    
    if (canPull.current) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [enablePullToRefresh, onRefresh, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canPull.current || !isPulling || isRefreshing) return;
    
    touchCurrentY.current = e.touches[0].clientY;
    const distance = touchCurrentY.current - touchStartY.current;
    
    // Only allow pull down (positive distance)
    if (distance > 0) {
      // Prevent default scroll behavior when pulling
      e.preventDefault();
      
      // Apply resistance as user pulls further
      const resistance = Math.min(distance * 0.4, MAX_PULL);
      setPullDistance(resistance);
      
      // Haptic feedback at threshold
      if (resistance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
        triggerHapticFeedback('medium');
      }
    }
  }, [isPulling, isRefreshing, pullDistance, PULL_THRESHOLD, MAX_PULL]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;
    
    setIsPulling(false);
    canPull.current = false;
    
    // Trigger refresh if pulled past threshold
    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      triggerHapticFeedback('heavy');
      
      try {
        await onRefresh();
        triggerHapticFeedback('success');
      } catch (error) {
        log.error('Error refreshing tracks', error);
        triggerHapticFeedback('error');
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Reset pull distance with animation
    setPullDistance(0);
  }, [isPulling, isRefreshing, pullDistance, PULL_THRESHOLD, onRefresh]);

  // Reset pulling state when scrolling starts
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0 && canPull.current) {
        canPull.current = false;
        setIsPulling(false);
        setPullDistance(0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <>
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          threshold={PULL_THRESHOLD}
        />
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="min-h-screen"
        >
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
        </div>
      </>
    );
  }

  // List view - simple map + IntersectionObserver (no virtuoso, stable)
  return (
    <>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        threshold={PULL_THRESHOLD}
      />
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
      </div>
    </>
  );
});