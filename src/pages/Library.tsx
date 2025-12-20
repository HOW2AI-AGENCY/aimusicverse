import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music2, Search, Loader2, Grid3x3, List, SlidersHorizontal, Play, Shuffle, Library as LibraryIcon } from "lucide-react";
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
import { EarlyListeningAnnouncement } from "@/components/library/EarlyListeningAnnouncement";
import { useTracksMidiStatus } from "@/hooks/useTrackMidiStatus";

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
  } = useTracks({
    searchQuery: debouncedSearchQuery,
    sortBy,
    pageSize: 20,
    paginate: true,
  });
  
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
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `track-${trackId}.mp3`;
    link.click();
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
      <div className="min-h-screen pb-20">
        {/* Page Header - Premium gradient design */}
        <header className="sticky top-0 z-30 bg-gradient-to-b from-background via-background/98 to-background/90 backdrop-blur-xl border-b border-border/30">
          <div className="container mx-auto px-3 sm:px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <motion.div 
                    className="p-1.5 rounded-md bg-gradient-to-br from-library/20 to-library/5 border border-library/30"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <LibraryIcon className="w-3.5 h-3.5 text-library" />
                  </motion.div>
                  <div>
                    <h1 className="text-base sm:text-lg font-bold">Библиотека</h1>
                    <div className="flex items-center gap-2">
                      {hasActiveGenerations && (
                        <motion.span 
                          className="inline-flex items-center gap-1 text-generate text-[9px] font-medium"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-generate opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-generate"></span>
                          </span>
                          {activeGenerations.length} в работе
                        </motion.span>
                      )}
                      <span className="text-[9px] text-muted-foreground">
                        <span className="tabular-nums font-semibold text-foreground">{tracks?.length || 0}</span>/{totalCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {tracksToDisplay.length > 0 && (
                  <>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handlePlayAll}
                      className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/80 shadow-sm"
                      aria-label="Воспроизвести все"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                    {!isMobile && (
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
                  </>
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
            </div>

            {/* Search and Filters - Compact */}
            <div className="mt-2 flex flex-col sm:flex-row gap-1.5">
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
                <SelectTrigger className="w-full sm:w-32 h-8 text-[11px] rounded-md border-border/50 bg-card/50">
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
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          {/* Early Listening Announcement */}
          <EarlyListeningAnnouncement />
          
          {/* Filter Chips - Mobile optimized */}
          <div className="mb-2">
            <LibraryFilterChips 
              activeFilter={typeFilter} 
              onFilterChange={setTypeFilter}
              counts={filterCounts}
            />
          </div>

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
            <EmptyLibraryState searchQuery={searchQuery} />
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
