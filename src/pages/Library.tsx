/**
 * Library Page - User's track library
 *
 * Features:
 * - Track list with search, filter, and sort
 * - Infinite scroll with virtualization
 * - Active generation tracking
 * - Deep link support for track details and actions
 * - Desktop: Master-detail layout with track detail panel
 * - Contextual onboarding tips (Phase 4)
 */

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  Grid3x3,
  List,
  SlidersHorizontal,
  Play,
  Shuffle,
  Library as LibraryIcon,
  Tag,
  X,
} from "@/lib/icons";
import { Heading, Text } from "@/components/ui/typography";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeneratingTrackSkeleton } from "@/components/library/GeneratingTrackSkeleton";
import { TrackCardSkeleton, TrackRowSkeleton } from "@/components/ui/skeleton-components";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileListSkeleton, MobileGridSkeleton } from "@/components/mobile/MobileSkeletons";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";
import { CompactFilterBar } from "@/components/library/CompactFilterBar";
import { VirtualizedTrackList } from "@/components/library/VirtualizedTrackList";
import { EmptyLibraryState } from "@/components/library/EmptyLibraryState";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import { gridGap, containerPadding, contentSpacing, sectionGap } from "@/lib/design-spacing";
import { NotificationBadge } from "@/components/NotificationBadge";
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { DesktopLibrarySidebar } from "@/components/library/DesktopLibrarySidebar";
import { TrackDetailPanel } from "@/components/library/TrackDetailPanel";

// Extracted hooks and components
import { useLibraryData, type SortOption } from "@/hooks/useLibraryData";
import { useLibraryHandlers } from "@/hooks/useLibraryHandlers";
import { useLibraryDeepLinks } from "@/hooks/useLibraryDeepLinks";
import { LibraryDialogs } from "@/components/library/LibraryDialogs";

import { ContextHints } from "@/components/hints";

export default function Library() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { playTrack, pauseTrack, isPlaying } = usePlayerStore();

  // Desktop sidebar state
  const [generateSidebarCollapsed, setGenerateSidebarCollapsed] = useState(false);

  // Desktop: Selected track for detail panel
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Consolidated data hook
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    tagFilter,
    viewMode,
    setViewMode,
    tracks,
    filteredTracks,
    totalCount,
    filterCounts,
    activeGenerations,
    hasActiveGenerations,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetchTracks,
    deleteTrack,
    toggleLike,
    logPlay,
    clearTagFilter,
    getCountsForTrack,
    midiStatusMap,
  } = useLibraryData();

  // Consolidated handlers
  const { handlePlay, handlePlayAll, handleShuffleAll, handleDownload, handleTagClick, activeTrackId } =
    useLibraryHandlers({
      filteredTracks,
      logPlay,
    });

  // Deep link handling
  const { selectedTrackForDetail, deepLinkDialogTrack, deepLinkDialogType, closeTrackDetail, closeDeepLinkDialog } =
    useLibraryDeepLinks({
      tracks,
      onPlayTrack: handlePlay,
    });

  // Get selected track data for detail panel
  const selectedTrack = selectedTrackId ? (filteredTracks.find((t) => t.id === selectedTrackId) ?? null) : null;

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space: Play/Pause
      if (e.code === "Space" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (isPlaying) {
          pauseTrack();
        } else if (selectedTrack) {
          handlePlay(selectedTrack);
        }
      }

      // Arrow Up/Down: Navigate tracks
      if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        e.preventDefault();
        const currentIndex = selectedTrackId ? filteredTracks.findIndex((t) => t.id === selectedTrackId) : -1;

        let newIndex: number;
        if (e.code === "ArrowDown") {
          newIndex = currentIndex < filteredTracks.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : filteredTracks.length - 1;
        }

        if (filteredTracks[newIndex]) {
          setSelectedTrackId(filteredTracks[newIndex].id);
        }
      }

      // Enter: Open in detail panel or play
      if (e.code === "Enter" && selectedTrack) {
        e.preventDefault();
        handlePlay(selectedTrack);
      }

      // Escape: Close detail panel
      if (e.code === "Escape" && selectedTrackId) {
        setSelectedTrackId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isPlaying, pauseTrack, selectedTrack, selectedTrackId, filteredTracks, handlePlay]);

  // Handle track selection (for desktop detail panel)
  const handleTrackSelect = useCallback(
    (trackId: string) => {
      if (!isMobile) {
        setSelectedTrackId(trackId);
      }
    },
    [isMobile],
  );

  // Navigate to studio
  const handleNavigateToStudio = useCallback(
    (trackId: string) => {
      navigate(`/studio-v2?trackId=${trackId}`);
    },
    [navigate],
  );

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <ErrorBoundaryWrapper>
      <SEOHead {...SEO_PRESETS.library} />
      <div
        className="min-h-screen pb-20 flex"
        style={{
          paddingTop:
            "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
        }}
      >
        {/* Desktop Generate Sidebar */}
        {!isMobile && (
          <DesktopLibrarySidebar
            isCollapsed={generateSidebarCollapsed}
            onToggleCollapse={() => setGenerateSidebarCollapsed(!generateSidebarCollapsed)}
          />
        )}

        {/* Main Content - with master-detail layout on desktop */}
        <div className={cn("flex-1 min-w-0 flex", !isMobile && selectedTrackId && "xl:gap-6 2xl:gap-8")}>
          {/* Track List Section */}
          <div
            className={cn(
              "flex-1 min-w-0 flex flex-col",
              !isMobile && selectedTrackId && "lg:max-w-[60%] xl:max-w-[55%] 2xl:max-w-[50%]",
            )}
          >
            {/* SR-only H1 for page-has-heading-one / heading uniqueness */}
            <h1 className="sr-only">Моя библиотека — MusicVerse</h1>

            {/* Unified Header */}
            <AppHeader
              title="Библиотека"
              subtitle={
                hasActiveGenerations
                  ? `${activeGenerations.length} в работе • ${tracks?.length || 0}/${totalCount}`
                  : `${tracks?.length || 0}/${totalCount} треков`
              }
              icon={<LibraryIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-library" />}
              rightAction={
                <div className="flex items-center gap-1 lg:gap-2">
                  <NotificationBadge />
                  {filteredTracks.length > 0 && (
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handlePlayAll}
                      className="min-h-[44px] min-w-[44px] h-11 w-11 lg:h-9 lg:w-9 lg:min-h-[36px] lg:min-w-[36px] rounded-md lg:rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm hover:shadow-md transition-shadow"
                      aria-label="Воспроизвести все"
                    >
                      <Play className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </Button>
                  )}
                  {filteredTracks.length > 0 && !isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShuffleAll}
                      className="min-h-[44px] min-w-[44px] h-11 w-11 lg:h-9 lg:w-9 lg:min-h-[36px] lg:min-w-[36px] rounded-md lg:rounded-lg hover:bg-muted/80 transition-colors"
                      aria-label="Перемешать"
                    >
                      <Shuffle className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </Button>
                  )}
                  {/* View mode toggle */}
                  <div className="flex items-center bg-muted/50 rounded-md lg:rounded-lg p-0.5 lg:p-1 border border-border/30">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "min-h-[44px] min-w-[44px] h-11 w-11 lg:h-9 lg:w-9 lg:min-h-[36px] lg:min-w-[36px] rounded lg:rounded-md transition-all",
                        viewMode === "grid" && "shadow-sm",
                      )}
                      aria-label="Сетка"
                    >
                      <Grid3x3 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "min-h-[44px] min-w-[44px] h-11 w-11 lg:h-9 lg:w-9 lg:min-h-[36px] lg:min-w-[36px] rounded lg:rounded-md transition-all",
                        viewMode === "list" && "shadow-sm",
                      )}
                      aria-label="Список"
                    >
                      <List className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                    </Button>
                  </div>
                </div>
              }
            />

            {/* Compact Search and Filters */}
            <div className="z-20 bg-background border-b border-border/30 -mx-4 px-5 sm:px-6 py-4 sm:py-5">
              {isMobile ? (
                <CompactFilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  activeFilter={typeFilter}
                  onFilterChange={setTypeFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  counts={filterCounts}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 group-focus-within:text-primary" />
                      <Input
                        type="search"
                        aria-label="Поиск треков"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs rounded-md border-border/50 bg-card/50 focus:bg-card"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                      <SelectTrigger className="w-32 h-8 text-[11px] rounded-md border-border/50 bg-card/50">
                        <SlidersHorizontal className="w-3 h-3 mr-1 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value="recent" className="text-xs">
                          Недавние
                        </SelectItem>
                        <SelectItem value="popular" className="text-xs">
                          Популярные
                        </SelectItem>
                        <SelectItem value="liked" className="text-xs">
                          Любимые
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <LibraryFilterChips activeFilter={typeFilter} onFilterChange={setTypeFilter} counts={filterCounts} />
                </div>
              )}
            </div>

            {/* Content with Pull to Refresh */}
            <PullToRefreshWrapper
              onRefresh={async () => {
                await refetchTracks();
              }}
              disabled={!isMobile}
              className="py-6 sm:py-8 flex-1"
            >
              {!isMobile && <div className="mb-4" />}

              {/* Active Tag Filter Indicator */}
              {tagFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-5 py-3 mb-6 mx-5 sm:mx-6 bg-primary/10 border border-primary/20 rounded-xl"
                >
                  <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                  <Text variant="bodySm" className="text-primary font-medium truncate" as="span">
                    Фильтр: {tagFilter}
                  </Text>
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
                <div className="mb-8 @container">
                  <Heading
                    level="h3"
                    className="text-xs font-medium text-muted-foreground mb-4 flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Генерируется ({activeGenerations.length})
                  </Heading>
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-2 @sm:grid-cols-3 @md:grid-cols-4 @lg:grid-cols-5 @xl:grid-cols-6 gap-4 @sm:gap-5 @lg:gap-6"
                        : "flex flex-col gap-3 sm:gap-4"
                    }
                  >
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

              {/* Track List Content */}
              {isLoading ? (
                <div data-safe-skeleton="" className="@container">
                  {isMobile ? (
                    viewMode === "grid" ? (
                      <MobileGridSkeleton count={4} />
                    ) : (
                      <MobileListSkeleton count={5} />
                    )
                  ) : (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 @sm:grid-cols-3 @md:grid-cols-4 @lg:grid-cols-5 @xl:grid-cols-6 gap-4 @sm:gap-5 @lg:gap-6"
                          : "flex flex-col gap-3 sm:gap-4"
                      }
                    >
                      {Array.from({ length: 6 }).map((_, i) =>
                        viewMode === "grid" ? <TrackCardSkeleton key={i} /> : <TrackRowSkeleton key={i} />,
                      )}
                    </div>
                  )}
                </div>
              ) : filteredTracks.length === 0 && !hasActiveGenerations ? (
                <EmptyLibraryState searchQuery={searchQuery} navigate={navigate} />
              ) : (
                <>
                  <VirtualizedTrackList
                    tracks={filteredTracks}
                    viewMode={viewMode}
                    activeTrackId={activeTrackId}
                    getCountsForTrack={getCountsForTrack}
                    getMidiStatus={(trackId) => midiStatusMap[trackId]}
                    onPlay={(track) => {
                      handlePlay(track);
                      if (!isMobile) setSelectedTrackId(track.id);
                    }}
                    onDelete={(id) => deleteTrack(id)}
                    onDownload={(id, audioUrl, coverUrl) => handleDownload(id, audioUrl, coverUrl)}
                    onToggleLike={(id, isLiked) => toggleLike({ trackId: id, isLiked })}
                    onTagClick={handleTagClick}
                    onLoadMore={fetchNextPage}
                    hasMore={hasNextPage}
                    isLoadingMore={isFetchingNextPage}
                  />

                  {!hasNextPage && (tracks?.length ?? 0) > 0 && (
                    <Text variant="bodySm" muted className="py-8 text-center">
                      Все треки загружены
                    </Text>
                  )}
                </>
              )}
            </PullToRefreshWrapper>
          </div>

          {/* Desktop: Track Detail Panel */}
          {!isMobile && selectedTrack && (
            <div className="lg:w-[40%] xl:w-[45%] 2xl:w-[50%] min-w-[320px] max-w-[480px] xl:max-w-[560px] 2xl:max-w-[640px] bg-card/50 flex-shrink-0">
              <TrackDetailPanel track={selectedTrack} onPlay={handlePlay} onClose={() => setSelectedTrackId(null)} />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <LibraryDialogs
        selectedTrackForDetail={selectedTrackForDetail}
        onCloseTrackDetail={closeTrackDetail}
        deepLinkDialogTrack={deepLinkDialogTrack}
        deepLinkDialogType={deepLinkDialogType}
        onCloseDeepLinkDialog={closeDeepLinkDialog}
      />

      {/* Contextual hints — single canonical overlay */}
      <ContextHints context="library" delay={3000} />
    </ErrorBoundaryWrapper>
  );
}
