import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music2, Search, Loader2, Grid3x3, List, SlidersHorizontal } from "lucide-react";
import { useTracksInfinite } from "@/hooks/useTracksInfinite";
import { type Track } from "@/hooks/useTracksOptimized";
import { TrackCard } from "@/components/TrackCard";
import { Button } from "@/components/ui/button";
import { GenerationProgress } from "@/components/GenerationProgress";
import { useGenerationRealtime } from "@/hooks/useGenerationRealtime";
import { useTrackVersions } from "@/hooks/useTrackVersions";
import { usePlayerStore } from "@/hooks/usePlayerState";
import { AnimatePresence, motion } from "framer-motion";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "use-debounce";
import { TrackCardSkeleton } from "@/components/ui/skeleton-loader";

export default function Library() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { activeTrack, playTrack } = usePlayerStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "liked">("recent");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useGenerationRealtime();

  const { 
    tracks, 
    totalCount,
    isLoading, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    deleteTrack, 
    toggleLike, 
    logPlay, 
    downloadTrack 
  } = useTracksInfinite({
    searchQuery: debouncedSearchQuery,
    sortBy,
    pageSize: 20,
  });

  const fullscreenTrackId = activeTrack?.id;
  const { data: versions } = useTrackVersions(fullscreenTrackId || "");

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log('📥 Loading more tracks...');
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const tracksToDisplay = tracks || [];

  const handlePlay = (track: Track) => {
    if (!track.audio_url) return;
    playTrack(track);
    logPlay(track.id);
  };

  const handleDownload = (trackId: string, audioUrl: string | null, coverUrl: string | null) => {
    if (!audioUrl) return;
    downloadTrack({ trackId, audioUrl, coverUrl: coverUrl || undefined });

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `track-${trackId}.mp3`;
    link.click();
  };

  return (
    <ErrorBoundaryWrapper>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
        <GenerationProgress />

        {/* Page Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Библиотека</h1>
                <p className="text-sm text-muted-foreground">
                  {tracks?.length || 0} из {totalCount} треков
                </p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-10 w-10 min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-transform"
                  aria-label="Сетка"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-10 w-10 min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-transform"
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
                  <SelectItem value="recent">Сортировать: Недавние</SelectItem>
                  <SelectItem value="popular">Сортировать: Популярные</SelectItem>
                  <SelectItem value="liked">Сортировать: Понравившиеся</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          {isLoading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "flex flex-col gap-3"
              }
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <TrackCardSkeleton key={i} layout={viewMode} />
              ))}
            </div>
          ) : tracksToDisplay.length === 0 ? (
            <Card className="glass-card border-primary/20 p-8 sm:p-12 text-center">
              <Music2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {searchQuery ? "Ничего не найдено" : "Пока нет треков"}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchQuery ? "Попробуйте изменить поисковой запрос" : "Создайте свой первый трек в генераторе"}
              </p>
            </Card>
          ) : (
            <>
              {/* TODO: Optimize responsive grid layout for better performance on large libraries */}
              {/* TODO: Implement virtual scrolling for libraries with 100+ tracks */}
              {/* TODO: Add dynamic column count based on viewport width and card size */}
              {/* TODO: Consider implementing masonry layout for varied content heights */}
              <motion.div
                layout
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "flex flex-col gap-3"
                }
              >
                <AnimatePresence mode="popLayout">
                  {tracksToDisplay.map((track) => (
                    <motion.div
                      key={track.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TrackCard
                        track={track}
                        layout={viewMode}
                        isPlaying={activeTrack?.id === track.id}
                        onPlay={() => handlePlay(track)}
                        onDelete={() => deleteTrack(track.id)}
                        onDownload={() => handleDownload(track.id, track.audio_url, track.cover_url)}
                        onToggleLike={() =>
                          toggleLike({
                            trackId: track.id,
                            isLiked: track.is_liked || false,
                          })
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Infinite Scroll Trigger & Loading Indicator */}
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                {isFetchingNextPage && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                      {Array.from({ length: viewMode === 'grid' ? 4 : 2 }).map((_, i) => (
                        <TrackCardSkeleton key={i} layout={viewMode} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Загрузка...</span>
                    </div>
                  </div>
                )}
                
                {!isFetchingNextPage && hasNextPage && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchNextPage()}
                    className="min-h-[44px] touch-manipulation"
                  >
                    Загрузить еще
                  </Button>
                )}
                
                {!hasNextPage && tracks.length > 0 && (
                  <p className="text-sm text-muted-foreground py-8">
                    Все треки загружены
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
}
