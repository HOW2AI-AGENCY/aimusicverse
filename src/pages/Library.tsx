import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music2, Search, Loader2, Grid3x3, List, SlidersHorizontal, Play, Shuffle, Library as LibraryIcon } from "lucide-react";
import { motion } from "@/lib/motion";
import { useTracksInfinite } from "@/hooks/useTracksInfinite";
import { type Track } from "@/hooks/useTracksOptimized";
import { Button } from "@/components/ui/button";
import { useGenerationRealtime } from "@/hooks/useGenerationRealtime";
import { useTrackVersions } from "@/hooks/useTrackVersions";
import { usePlayerStore } from "@/hooks/audio";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "use-debounce";
import { TrackCardSkeleton } from "@/components/ui/skeleton-loader";
import { GeneratingTrackSkeleton } from "@/components/library/GeneratingTrackSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSyncStaleTasks } from "@/hooks/generation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrackCounts } from "@/hooks/useTrackCounts";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";
import { VirtualizedTrackList } from "@/components/library/VirtualizedTrackList";
import { EmptyLibraryState } from "@/components/library/EmptyLibraryState";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const log = logger.child({ module: 'Library' });

type FilterOption = 'all' | 'vocals' | 'instrumental' | 'stems';

interface GenerationTask {
  id: string;
  prompt: string;
  status: string;
  generation_mode: string;
  model_used: string;
  created_at: string;
}

const fetchActiveGenerations = async (userId: string) => {
  const { data, error } = await supabase
    .from('generation_tasks')
    .select('id, prompt, status, generation_mode, model_used, created_at')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing', 'streaming_ready'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);
  return data as GenerationTask[];
};

export default function Library() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const { activeTrack, playTrack, queue } = usePlayerStore();
  // Mobile defaults to list view, desktop to grid
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    // Check if we're on mobile by checking window width (SSR-safe)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? "list" : "grid";
    }
    return "list";
  });
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "liked">("recent");
  const [typeFilter, setTypeFilter] = useState<FilterOption>('all');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  useGenerationRealtime();
  
  // Auto-sync stale tasks on mount, visibility change, and periodically
  useSyncStaleTasks();

  // Fetch active generation tasks
  const { data: activeGenerations = [] } = useQuery({
    queryKey: ['active_generations', user?.id],
    queryFn: () => fetchActiveGenerations(user!.id),
    enabled: !!user,
    refetchInterval: 5000,
  });

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
    downloadTrack 
  } = useTracksInfinite({
    searchQuery: debouncedSearchQuery,
    sortBy,
    pageSize: 20,
  });

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

  // Infinite scroll - load more when bottom is reached
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (!node) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          log.debug('Loading next page');
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );
    
    observerRef.current.observe(node);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const fullscreenTrackId = activeTrack?.id;
  const { data: versions } = useTrackVersions(fullscreenTrackId || "");

  // Batch fetch track counts (versions & stems) for all visible tracks
  const trackIds = useMemo(() => (tracks || []).map(t => t.id), [tracks]);
  const { getCountsForTrack } = useTrackCounts(trackIds);

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
    downloadTrack({ trackId, audioUrl, coverUrl: coverUrl || undefined });

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `track-${trackId}.mp3`;
    link.click();
  }, [downloadTrack]);

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
      <div className="min-h-screen pb-20">
        {/* Page Header - Premium gradient design */}
        <header className="sticky top-0 z-30 bg-gradient-to-b from-background via-background/98 to-background/90 backdrop-blur-xl border-b border-border/30">
          <div className="container mx-auto px-3 sm:px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-2.5 rounded-xl bg-gradient-to-br from-library/20 to-library/5 border border-library/30 shadow-lg"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <LibraryIcon className="w-5 h-5 text-library" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                      Библиотека
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      {hasActiveGenerations && (
                        <motion.span 
                          className="inline-flex items-center gap-1.5 text-generate text-xs font-medium"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-generate opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-generate"></span>
                          </span>
                          {activeGenerations.length} в работе
                        </motion.span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        <span className="tabular-nums font-semibold text-foreground">{tracks?.length || 0}</span>
                        <span className="text-muted-foreground/60"> / {totalCount}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {tracksToDisplay.length > 0 && (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={handlePlayAll}
                        className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
                        aria-label="Воспроизвести все"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </motion.div>
                    {!isMobile && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleShuffleAll}
                          className="h-10 w-10 rounded-xl hover:bg-primary/10"
                          aria-label="Перемешать"
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
                {!isMobile && (
                  <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/30">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "h-8 w-8 rounded-lg transition-all",
                        viewMode === "grid" && "shadow-md"
                      )}
                      aria-label="Сетка"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "h-8 w-8 rounded-lg transition-all",
                        viewMode === "list" && "shadow-md"
                      )}
                      aria-label="Список"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Filters - Enhanced */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Поиск треков..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-sm rounded-xl border-border/50 bg-card/50 focus:bg-card focus:border-primary/50 transition-all"
                />
                {searchQuery && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
                  >
                    {tracksToDisplay.length} найдено
                  </motion.span>
                )}
              </div>
              <Select value={sortBy} onValueChange={(v: "recent" | "popular" | "liked") => setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-44 h-11 text-sm rounded-xl border-border/50 bg-card/50 hover:bg-card transition-all">
                  <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="recent">Недавние</SelectItem>
                  <SelectItem value="popular">Популярные</SelectItem>
                  <SelectItem value="liked">Любимые</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Filter Chips - Mobile optimized */}
          <div className="mb-3">
            <LibraryFilterChips 
              activeFilter={typeFilter} 
              onFilterChange={setTypeFilter}
              counts={filterCounts}
            />
          </div>

          {/* Active Generations Section */}
          {hasActiveGenerations && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Генерируется ({activeGenerations.length})
              </h2>
              <div className={viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "flex flex-col gap-2"
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
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              : "flex flex-col gap-2"
            }>
              {Array.from({ length: 8 }).map((_, i) => (
                <TrackCardSkeleton key={i} layout={viewMode} />
              ))}
            </div>
          ) : tracksToDisplay.length === 0 && !hasActiveGenerations ? (
            <EmptyLibraryState searchQuery={searchQuery} />
          ) : (
            <>
              <VirtualizedTrackList
                tracks={tracksToDisplay}
                viewMode={viewMode}
                activeTrackId={activeTrack?.id}
                getCountsForTrack={getCountsForTrack}
                onPlay={handlePlay}
                onDelete={(id) => deleteTrack(id)}
                onDownload={(id, audioUrl, coverUrl) => handleDownload(id, audioUrl, coverUrl)}
                onToggleLike={(id, isLiked) => toggleLike({ trackId: id, isLiked })}
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
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
}
