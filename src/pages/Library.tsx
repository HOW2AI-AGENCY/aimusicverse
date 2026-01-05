import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Music2, Search, Loader2, Grid3x3, List, SlidersHorizontal, Play, Shuffle, Library as LibraryIcon, Sparkles, Tag, X } from "lucide-react";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { motion } from "@/lib/motion";
import { useTracks, type Track } from "@/hooks/useTracks";
import { Button } from "@/components/ui/button";
import { useGenerationRealtime } from "@/hooks/useGenerationRealtime";
import { useTrackVersions } from "@/hooks/useTrackVersions";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "use-debounce";
import { TrackCardSkeleton } from "@/components/ui/skeleton-loader";
import { GeneratingTrackSkeleton } from "@/components/library/GeneratingTrackSkeleton";
import { useSyncStaleTasks, useActiveGenerations } from "@/hooks/generation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrackCounts } from "@/hooks/useTrackCounts";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";
import { CompactFilterBar } from "@/components/library/CompactFilterBar";
import { VirtualizedTrackList } from "@/components/library/VirtualizedTrackList";
import { EmptyLibraryState } from "@/components/library/EmptyLibraryState";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useTracksMidiStatus } from "@/hooks/useTrackMidiStatus";
import { AppHeader } from "@/components/layout/AppHeader";
import { NotificationBadge } from "@/components/NotificationBadge";
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { TrackDetailSheet } from "@/components/TrackDetailSheet";
import { AddVocalsDialog } from "@/components/AddVocalsDialog";
import { AddInstrumentalDialog } from "@/components/AddInstrumentalDialog";
import { ExtendTrackDialog } from "@/components/ExtendTrackDialog";
import { AudioCoverDialog } from "@/components/AudioCoverDialog";
import { DesktopLibrarySidebar } from "@/components/library/DesktopLibrarySidebar";
import { DesktopLibraryLayout } from "@/components/library/DesktopLibraryLayout";

const log = logger.child({ module: 'Library' });

type FilterOption = 'all' | 'vocals' | 'instrumental' | 'stems';
export default function Library() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { activeTrack, playTrack, queue } = usePlayerStore();
  // State for deep link track detail sheet
  const [selectedTrackForDetail, setSelectedTrackForDetail] = useState<Track | null>(null);
  const deepLinkProcessedRef = useRef(false);
  
  // Desktop sidebar state
  const [generateSidebarCollapsed, setGenerateSidebarCollapsed] = useState(false);
  
  // State for deep link action dialogs
  const [deepLinkDialogTrack, setDeepLinkDialogTrack] = useState<Track | null>(null);
  const [deepLinkDialogType, setDeepLinkDialogType] = useState<'add_vocals' | 'add_instrumental' | 'extend' | 'cover' | null>(null);
  
  // Mobile defaults to list view, desktop to grid
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? "list" : "grid";
    }
    return "list";
  });
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "liked">("recent");
  const [typeFilter, setTypeFilter] = useState<FilterOption>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useGenerationRealtime();
  
  // Auto-sync stale tasks on mount, visibility change, and periodically
  useSyncStaleTasks();

  // Fetch active generation tasks - use centralized hook
  const { data: activeGenerations = [] } = useActiveGenerations();

  const { 
    tracks, 
    totalCount,
    isLoading,
    error: tracksError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchTracks,
    deleteTrack, 
    toggleLike, 
    logPlay, 
  } = useTracks({
    searchQuery: debouncedSearchQuery,
    sortBy,
    pageSize: 50, // Increased for better initial load
    paginate: true,
    tagFilter: tagFilter || undefined,
  });
  
  // Debug logging for track loading
  // Note: Intentionally using tracks?.length instead of tracks in deps array
  // to avoid re-logging on every array reference change (which happens frequently
  // during pagination). We only want to log when the actual count changes.
  // Including 'tracks' would cause excessive logging with no benefit.
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      log.info('Tracks loaded in Library', { 
        loadedCount: tracks.length, 
        totalCount, 
        hasNextPage,
        isFetchingNextPage,
        filter: typeFilter,
        searchQuery: debouncedSearchQuery
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks?.length, totalCount, hasNextPage, isFetchingNextPage, typeFilter, debouncedSearchQuery]);
  
  // downloadTrack - use separate mutation or API
  const downloadTrack = useCallback(async (track: Track) => {
    if (!track.audio_url) return;
    window.open(track.audio_url, '_blank');
  }, []);

  // Track previous generation count to detect completion
  const prevGenerationsCount = useRef(activeGenerations.length);
  
  // Refetch tracks when a generation completes (count decreases)
  useEffect(() => {
    if (prevGenerationsCount.current > 0 && activeGenerations.length < prevGenerationsCount.current) {
      log.info('Generation completed, refetching tracks');
      refetchTracks();
    }
    prevGenerationsCount.current = activeGenerations.length;
  }, [activeGenerations.length, refetchTracks]);

  // Note: Infinite scroll is now handled by VirtualizedTrackList's endReached callback

  const fullscreenTrackId = activeTrack?.id;
  const { data: versions } = useTrackVersions(fullscreenTrackId || "");

  // Batch fetch track counts (versions & stems) for all visible tracks
  const trackIds = useMemo(() => (tracks || []).map(t => t.id), [tracks]);
  const { getCountsForTrack } = useTrackCounts(trackIds);
  
  // Batch fetch MIDI/PDF status for all visible tracks
  const { midiStatusMap } = useTracksMidiStatus(trackIds);

  // Filter tracks based on type filter - MUST be before any conditional returns
  const filteredTracks = useMemo(() => {
    const allTracks = tracks || [];
    switch (typeFilter) {
      case 'vocals':
        return allTracks.filter(t => t.has_vocals === true);
      case 'instrumental':
        return allTracks.filter(t => t.is_instrumental === true || t.has_vocals === false);
      case 'stems':
        return allTracks.filter(t => t.has_stems === true);
      default:
        return allTracks;
    }
  }, [tracks, typeFilter]);

  // Count tracks for filter badges
  // NOTE: These counts reflect only loaded tracks, not all available tracks
  // This is intentional to avoid additional database queries
  // The "All" count will match tracks.length which may be less than totalCount
  const filterCounts = useMemo(() => ({
    all: (tracks || []).length,
    vocals: (tracks || []).filter(t => t.has_vocals === true).length,
    instrumental: (tracks || []).filter(t => t.is_instrumental === true || t.has_vocals === false).length,
    stems: (tracks || []).filter(t => t.has_stems === true).length,
  }), [tracks]);

  const tracksToDisplay = filteredTracks;
  const hasActiveGenerations = activeGenerations.length > 0;

  const handlePlay = useCallback((track: Track, index?: number) => {
    if (!track.audio_url) return;
    
    const completedTracks = tracksToDisplay.filter(t => t.audio_url && t.status === 'completed');
    const trackIndex = index !== undefined ? index : completedTracks.findIndex(t => t.id === track.id);
    
    if (queue.length === 0 || activeTrack?.id !== track.id) {
      usePlayerStore.setState({
        queue: completedTracks,
        currentIndex: trackIndex >= 0 ? trackIndex : 0,
        activeTrack: track,
        isPlaying: true,
        playerMode: 'compact',
      });
    } else {
      playTrack(track);
    }
    
    logPlay(track.id);
  }, [tracksToDisplay, queue.length, activeTrack?.id, playTrack, logPlay]);

  // Handle deep link: ?track=UUID&action=xxx - open track detail or specific dialog
  // Must be after handlePlay is defined
  useEffect(() => {
    const trackIdFromUrl = searchParams.get('track');
    const actionFromUrl = searchParams.get('action') as 'add_vocals' | 'add_instrumental' | 'extend' | 'cover' | null;
    
    if (trackIdFromUrl && tracks && tracks.length > 0 && !deepLinkProcessedRef.current) {
      const track = tracks.find(t => t.id === trackIdFromUrl);
      
      if (track) {
        deepLinkProcessedRef.current = true;
        log.info('Deep link: opening track', { trackId: trackIdFromUrl, action: actionFromUrl });
        
        // Check if we have a specific action to perform
        if (actionFromUrl && ['add_vocals', 'add_instrumental', 'extend', 'cover'].includes(actionFromUrl)) {
          // Open the specific dialog for the action
          setDeepLinkDialogTrack(track);
          setDeepLinkDialogType(actionFromUrl);
        } else {
          // Open track detail sheet (default behavior)
          setSelectedTrackForDetail(track);
          
          // Auto-play the track
          if (track.audio_url) {
            handlePlay(track);
          }
        }
        
        // Clear the query parameter to prevent re-triggering
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('track');
        newParams.delete('view');
        newParams.delete('action');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, tracks, handlePlay, setSearchParams]);

  const handlePlayAll = useCallback(() => {
    const completedTracks = tracksToDisplay.filter(t => t.audio_url && t.status === 'completed');
    if (completedTracks.length === 0) return;
    
    usePlayerStore.setState({
      queue: completedTracks,
      currentIndex: 0,
      activeTrack: completedTracks[0],
      isPlaying: true,
      playerMode: 'compact',
    });
  }, [tracksToDisplay]);

  const handleShuffleAll = useCallback(() => {
    const completedTracks = tracksToDisplay.filter(t => t.audio_url && t.status === 'completed');
    if (completedTracks.length === 0) return;
    
    const shuffled = [...completedTracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    usePlayerStore.setState({
      queue: shuffled,
      currentIndex: 0,
      activeTrack: shuffled[0],
      isPlaying: true,
      shuffle: true,
      playerMode: 'compact',
    });
  }, [tracksToDisplay]);

  const handleDownload = useCallback((trackId: string, audioUrl: string | null, coverUrl: string | null) => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `track-${trackId}.mp3`;
    link.click();
  }, []);

  // Handle tag click - filter by tag
  const handleTagClick = useCallback((tag: string) => {
    log.info('Tag filter applied', { tag });
    setTagFilter(tag);
  }, []);

  // Clear tag filter
  const clearTagFilter = useCallback(() => {
    setTagFilter(null);
  }, []);

  // Conditional returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <ErrorBoundaryWrapper>
      <SEOHead {...SEO_PRESETS.library} />
      <div className="min-h-screen pb-20 flex">
        {/* Desktop Generate Sidebar */}
        {!isMobile && (
          <DesktopLibrarySidebar
            isCollapsed={generateSidebarCollapsed}
            onToggleCollapse={() => setGenerateSidebarCollapsed(!generateSidebarCollapsed)}
          />
        )}
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
        {/* Unified Header with centered logo */}
        <AppHeader
          title="Библиотека"
          subtitle={hasActiveGenerations 
            ? `${activeGenerations.length} в работе • ${tracks?.length || 0}/${totalCount}` 
            : `${tracks?.length || 0}/${totalCount} треков`
          }
          icon={<LibraryIcon className="w-3.5 h-3.5 text-library" />}
          rightAction={
            <div className="flex items-center gap-1">
              <NotificationBadge />
              {tracksToDisplay.length > 0 && (
                <Button
                  variant="default"
                  size="icon"
                  onClick={handlePlayAll}
                  className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/80 shadow-sm"
                  aria-label="Воспроизвести все"
                >
                  <Play className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isMobile && tracksToDisplay.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShuffleAll}
                  className="h-8 w-8 rounded-md"
                  aria-label="Перемешать"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isMobile && (
                <div className="flex items-center bg-muted/50 rounded-md p-0.5 border border-border/30">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={cn("h-6 w-6 rounded", viewMode === "grid" && "shadow-sm")}
                    aria-label="Сетка"
                  >
                    <Grid3x3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={cn("h-6 w-6 rounded", viewMode === "list" && "shadow-sm")}
                    aria-label="Список"
                  >
                    <List className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          }
        />

        {/* Compact Search and Filters - Mobile Optimized */}
        <div className="sticky top-[calc(var(--tg-content-safe-area-inset-top,0px)+8rem)] z-20 bg-background/95 backdrop-blur-sm border-b border-border/30 -mx-4 px-4 py-2">
          {isMobile ? (
            <CompactFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={typeFilter}
              onFilterChange={setTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              counts={filterCounts}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 group-focus-within:text-primary" />
                  <Input
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-md border-border/50 bg-card/50 focus:bg-card"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: "recent" | "popular" | "liked") => setSortBy(v)}>
                  <SelectTrigger className="w-32 h-8 text-[11px] rounded-md border-border/50 bg-card/50">
                    <SlidersHorizontal className="w-3 h-3 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="recent" className="text-xs">Недавние</SelectItem>
                    <SelectItem value="popular" className="text-xs">Популярные</SelectItem>
                    <SelectItem value="liked" className="text-xs">Любимые</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <LibraryFilterChips 
                activeFilter={typeFilter} 
                onFilterChange={setTypeFilter}
                counts={filterCounts}
              />
            </div>
          )}
        </div>

        {/* Content with Pull to Refresh for mobile */}
        <PullToRefreshWrapper
          onRefresh={async () => {
            await refetchTracks();
          }}
          disabled={!isMobile}
          className="py-2 sm:py-3"
        >
          {/* Filter Chips - Only show on desktop since mobile uses CompactFilterBar */}
          {!isMobile && <div className="mb-2" />}

          {/* Active Tag Filter Indicator */}
          {tagFilter && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-2.5 mb-3 mx-4 bg-primary/10 border border-primary/20 rounded-xl"
            >
              <Tag className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-primary font-medium truncate">
                Фильтр: {tagFilter}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearTagFilter}
                className="ml-auto h-7 w-7 p-0 rounded-full hover:bg-primary/20"
                aria-label="Убрать фильтр"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Active Generations Section */}
          {hasActiveGenerations && (
            <div className="mb-4">
              <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Генерируется ({activeGenerations.length})
              </h2>
              <div className={viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                : "flex flex-col gap-1.5"
              }>
                {activeGenerations.map((task) => (
                  <GeneratingTrackSkeleton
                    key={task.id}
                    status={task.status}
                    prompt={task.prompt}
                    createdAt={task.created_at}
                    layout={viewMode}
                  />
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className={viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              : "flex flex-col gap-1.5"
            }>
              {Array.from({ length: 8 }).map((_, i) => (
                <TrackCardSkeleton key={i} layout={viewMode} />
              ))}
            </div>
          ) : tracksToDisplay.length === 0 && !hasActiveGenerations ? (
            <EmptyLibraryState searchQuery={searchQuery} navigate={navigate} />
          ) : (
            <>
              <VirtualizedTrackList
                tracks={tracksToDisplay}
                viewMode={viewMode}
                activeTrackId={activeTrack?.id}
                getCountsForTrack={getCountsForTrack}
                getMidiStatus={(trackId) => midiStatusMap[trackId]}
                onPlay={handlePlay}
                onDelete={(id) => deleteTrack(id)}
                onDownload={(id, audioUrl, coverUrl) => handleDownload(id, audioUrl, coverUrl)}
                onToggleLike={(id, isLiked) => toggleLike({ trackId: id, isLiked })}
                onTagClick={handleTagClick}
                onLoadMore={fetchNextPage}
                hasMore={hasNextPage || false}
                isLoadingMore={isFetchingNextPage}
              />
              
              {!hasNextPage && tracks.length > 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Все треки загружены
                </p>
              )}
            </>
          )}
        </PullToRefreshWrapper>
        </div>
      </div>
      
      {/* Track Detail Sheet for deep link */}
      {selectedTrackForDetail && (
        <TrackDetailSheet
          open={!!selectedTrackForDetail}
          onOpenChange={(open) => !open && setSelectedTrackForDetail(null)}
          track={selectedTrackForDetail}
        />
      )}
      
      {/* Deep link action dialogs */}
      {deepLinkDialogTrack && deepLinkDialogType === 'add_vocals' && (
        <AddVocalsDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDeepLinkDialogTrack(null);
              setDeepLinkDialogType(null);
            }
          }}
          track={deepLinkDialogTrack}
        />
      )}
      
      {deepLinkDialogTrack && deepLinkDialogType === 'add_instrumental' && (
        <AddInstrumentalDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDeepLinkDialogTrack(null);
              setDeepLinkDialogType(null);
            }
          }}
          track={deepLinkDialogTrack}
        />
      )}
      
      {deepLinkDialogTrack && deepLinkDialogType === 'extend' && (
        <ExtendTrackDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDeepLinkDialogTrack(null);
              setDeepLinkDialogType(null);
            }
          }}
          track={deepLinkDialogTrack}
        />
      )}
      
      {deepLinkDialogTrack && deepLinkDialogType === 'cover' && (
        <AudioCoverDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDeepLinkDialogTrack(null);
              setDeepLinkDialogType(null);
            }
          }}
          prefillData={{
            title: deepLinkDialogTrack.title,
            style: deepLinkDialogTrack.style,
            lyrics: deepLinkDialogTrack.lyrics,
            isInstrumental: deepLinkDialogTrack.is_instrumental ?? false,
          }}
        />
      )}
    </ErrorBoundaryWrapper>
  );
}
