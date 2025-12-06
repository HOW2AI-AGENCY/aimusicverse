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
import { usePlayerStore } from "@/hooks/usePlayerState";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "use-debounce";
import { TrackCardSkeleton } from "@/components/ui/skeleton-loader";
import { GeneratingTrackSkeleton } from "@/components/library/GeneratingTrackSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSyncStaleTasks } from "@/hooks/useSyncStaleTasks";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrackCounts } from "@/hooks/useTrackCounts";
import { TrackCard } from "@/components/TrackCard";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "liked">("recent");
  const [typeFilter, setTypeFilter] = useState<FilterOption>('all');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Update view mode when mobile state changes
  useEffect(() => {
    if (!isMobile && viewMode === "list") {
      setViewMode("grid");
    }
  }, [isMobile, viewMode]);

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
      console.log('🔄 Generation completed, refetching tracks...');
      refetchTracks();
    }
    prevGenerationsCount.current = activeGenerations.length;
  }, [activeGenerations.length, refetchTracks]);

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
      <div className="min-h-screen pb-24">
        {/* Page Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Библиотека</h1>
                <p className="text-sm text-muted-foreground">
                  {hasActiveGenerations && (
                    <span className="text-primary mr-2">
                      {activeGenerations.length} в процессе •
                    </span>
                  )}
                  {tracks?.length || 0} из {totalCount} треков
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {tracksToDisplay.length > 0 && (
                  <>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handlePlayAll}
                      className="h-10 w-10 min-h-[44px] min-w-[44px]"
                      aria-label="Воспроизвести все"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShuffleAll}
                      className="h-10 w-10 min-h-[44px] min-w-[44px]"
                      aria-label="Перемешать"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-10 w-10 min-h-[44px] min-w-[44px]"
                  aria-label="Сетка"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-10 w-10 min-h-[44px] min-w-[44px]"
                  aria-label="Список"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Поиск по названию, стилю..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-base"
                />
              </div>
              <Select value={sortBy} onValueChange={(v: "recent" | "popular" | "liked") => setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-48 h-12 text-base">
                  <SlidersHorizontal className="w-5 h-5 mr-2.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Недавние</SelectItem>
                  <SelectItem value="popular">Популярные</SelectItem>
                  <SelectItem value="liked">Понравившиеся</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Filter Chips */}
          <div className="mb-4">
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
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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
            <Card className="p-8 sm:p-12 text-center border-border/50">
              <Music2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {searchQuery ? "Ничего не найдено" : "Пока нет треков"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Попробуйте изменить поисковой запрос" : "Создайте свой первый трек"}
              </p>
            </Card>
          ) : (
            <>
              <div className={viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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

              {isFetchingNextPage && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Загрузка...</span>
                  </div>
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
