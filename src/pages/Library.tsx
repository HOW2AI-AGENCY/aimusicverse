import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music2, Search, Loader2, Grid3x3, List, SlidersHorizontal, Play, Shuffle } from "lucide-react";
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
import { TrackCard } from "@/components/TrackCard";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";
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
        {/* Page Header - Mobile optimized */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/30">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gradient-telegram truncate">Библиотека</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {hasActiveGenerations && (
                    <span className="inline-flex items-center gap-1 text-generate mr-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-generate animate-pulse" />
                      {activeGenerations.length} •
                    </span>
                  )}
                  <span className="tabular-nums">{tracks?.length || 0}</span> из <span className="tabular-nums">{totalCount}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {tracksToDisplay.length > 0 && (
                  <>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handlePlayAll}
                      className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-xl"
                      aria-label="Воспроизвести все"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    {!isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleShuffleAll}
                        className="h-9 w-9 min-h-[44px] min-w-[44px] rounded-xl"
                        aria-label="Перемешать"
                      >
                        <Shuffle className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
                {!isMobile && (
                  <div className="flex items-center bg-muted/50 rounded-xl p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 rounded-lg"
                      aria-label="Сетка"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 rounded-lg"
                    aria-label="Список"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                )}
              </div>
            </div>

            {/* Search and Filters - Mobile optimized */}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <Select value={sortBy} onValueChange={(v: "recent" | "popular" | "liked") => setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-40 h-10 text-sm rounded-xl border-border/50 bg-muted/30">
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
              <div className={viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                : "flex flex-col gap-2"
              }>
                {tracksToDisplay.map((track, index) => {
                  const counts = getCountsForTrack(track.id);
                  return (
                    <TrackCard
                      key={track.id}
                      track={track}
                      layout={viewMode}
                      isPlaying={activeTrack?.id === track.id}
                      onPlay={() => handlePlay(track, index)}
                      onDelete={() => deleteTrack(track.id)}
                      onDownload={() => handleDownload(track.id, track.audio_url, track.cover_url)}
                      onToggleLike={() => toggleLike({ trackId: track.id, isLiked: track.is_liked || false })}
                      versionCount={counts.versionCount}
                      stemCount={counts.stemCount}
                      isFirstSwipeableItem={index === 0 && viewMode === "list"}
                    />
                  );
                })}
              </div>

              {/* Load More Trigger */}
              <div ref={loadMoreRef} className="h-4" />
              
              {/* Pagination Loading - используем skeleton карточки для единообразия */}
              {isFetchingNextPage && (
                <div className={cn(
                  "mt-4",
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "flex flex-col gap-2"
                )}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TrackCardSkeleton key={`pagination-skeleton-${i}`} layout={viewMode} />
                  ))}
                </div>
              )}
              
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
