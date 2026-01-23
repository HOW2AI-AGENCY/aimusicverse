/**
 * Library Page - User's track library
 * 
 * Features:
 * - Track list with search, filter, and sort
 * - Infinite scroll with virtualization
 * - Active generation tracking
 * - Deep link support for track details and actions
 * - Desktop: Master-detail layout with track detail panel
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Grid3x3, List, SlidersHorizontal, Play, Shuffle, Library as LibraryIcon, Tag, X } from "lucide-react";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GeneratingTrackSkeleton } from "@/components/library/GeneratingTrackSkeleton";
import { TrackCardSkeleton, TrackRowSkeleton } from "@/components/ui/skeletons/TrackListSkeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileListSkeleton, MobileGridSkeleton } from "@/components/mobile/MobileSkeletons";
import { LibraryFilterChips } from "@/components/library/LibraryFilterChips";
import { CompactFilterBar } from "@/components/library/CompactFilterBar";
import { VirtualizedTrackList } from "@/components/library/VirtualizedTrackList";
import { EmptyLibraryState } from "@/components/library/EmptyLibraryState";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/AppHeader";
import { NotificationBadge } from "@/components/NotificationBadge";
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { DesktopLibrarySidebar } from "@/components/library/DesktopLibrarySidebar";
import { TrackDetailPanel } from "@/components/library/TrackDetailPanel";

// Extracted hooks and components
import { useLibraryData, type SortOption } from "@/hooks/useLibraryData";
import { useLibraryHandlers } from "@/hooks/useLibraryHandlers";
import { useLibraryDeepLinks } from "@/hooks/useLibraryDeepLinks";
import { LibraryDialogs } from "@/components/library/LibraryDialogs";

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
  const {
    handlePlay,
    handlePlayAll,
    handleShuffleAll,
    handleDownload,
    handleTagClick,
    activeTrackId,
  } = useLibraryHandlers({
    filteredTracks,
    logPlay,
  });

  // Deep link handling
  const {
    selectedTrackForDetail,
    deepLinkDialogTrack,
    deepLinkDialogType,
    closeTrackDetail,
    closeDeepLinkDialog,
  } = useLibraryDeepLinks({
    tracks,
    onPlayTrack: handlePlay,
  });

  // Get selected track data for detail panel
  const selectedTrack = selectedTrackId 
    ? filteredTracks.find(t => t.id === selectedTrackId) 
    : null;

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Space: Play/Pause
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (isPlaying) {
          pauseTrack();
        } else if (selectedTrack) {
          handlePlay(selectedTrack as any);
        }
      }

      // Arrow Up/Down: Navigate tracks
      if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = selectedTrackId 
          ? filteredTracks.findIndex(t => t.id === selectedTrackId)
          : -1;
        
        let newIndex: number;
        if (e.code === 'ArrowDown') {
          newIndex = currentIndex < filteredTracks.length - 1 ? currentIndex + 1 : 0;
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : filteredTracks.length - 1;
        }
        
        if (filteredTracks[newIndex]) {
          setSelectedTrackId(filteredTracks[newIndex].id);
        }
      }

      // Enter: Open in detail panel or play
      if (e.code === 'Enter' && selectedTrack) {
        e.preventDefault();
        handlePlay(selectedTrack as any);
      }

      // Escape: Close detail panel
      if (e.code === 'Escape' && selectedTrackId) {
        setSelectedTrackId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isPlaying, pauseTrack, selectedTrack, selectedTrackId, filteredTracks, handlePlay]);

  // Handle track selection (for desktop detail panel)
  const handleTrackSelect = useCallback((trackId: string) => {
    if (!isMobile) {
      setSelectedTrackId(trackId);
    }
  }, [isMobile]);

  // Navigate to studio
  const handleNavigateToStudio = useCallback((trackId: string) => {
    navigate(`/studio-v2?trackId=${trackId}`);
  }, [navigate]);

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
          paddingTop: 'max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))',
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
        <div className={cn(
          "flex-1 min-w-0 flex",
          !isMobile && selectedTrackId && "gap-0"
        )}>
          {/* Track List Section */}
          <div className={cn(
            "flex-1 min-w-0 flex flex-col",
            !isMobile && selectedTrackId && "max-w-[60%] border-r border-border/30"
          )}>
            {/* Unified Header */}
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
                  {filteredTracks.length > 0 && (
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
                  {filteredTracks.length > 0 && !isMobile && (
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
                  {/* View mode toggle */}
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
                </div>
              }
            />

            {/* Compact Search and Filters */}
            <div className="z-20 bg-background border-b border-border/30 -mx-4 px-4 py-2">
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

            {/* Content with Pull to Refresh */}
            <PullToRefreshWrapper
              onRefresh={async () => { await refetchTracks(); }}
              disabled={!isMobile}
              className="py-2 sm:py-3 flex-1"
            >
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

              {/* Track List Content */}
              {isLoading ? (
                isMobile ? (
                  viewMode === "grid" ? <MobileGridSkeleton count={4} /> : <MobileListSkeleton count={5} />
                ) : (
                  <div className={viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                    : "flex flex-col gap-1.5"
                  }>
                    {Array.from({ length: 6 }).map((_, i) => (
                      viewMode === 'grid'
                        ? <TrackCardSkeleton key={i} />
                        : <TrackRowSkeleton key={i} />
                    ))}
                  </div>
                )
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
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Все треки загружены
                    </p>
                  )}
                </>
              )}
            </PullToRefreshWrapper>
          </div>

          {/* Desktop: Track Detail Panel */}
          {!isMobile && selectedTrackId && (
            <div className="w-[40%] min-w-[320px] max-w-[480px] bg-card/50 border-l border-border/30 flex-shrink-0">
              <TrackDetailPanel
                track={selectedTrack as any}
                onPlay={handlePlay as any}
                onClose={() => setSelectedTrackId(null)}
              />
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
    </ErrorBoundaryWrapper>
  );
}
