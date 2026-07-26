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

import { useState, useEffect, useCallback, lazy, Suspense, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate, useSearchParams } from "react-router";
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
import { useMediaQuery } from "@/hooks/use-media-query";
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

// Mobile touch-target size for icon buttons (44px iOS HIG minimum).
// Desktop shrinks to 36px at lg+.
const touchIcon = "min-h-[44px] min-w-[44px] h-11 w-11 lg:h-9 lg:w-9 lg:min-h-[36px] lg:min-w-[36px]";

// A freshly-inserted track may carry a couple of loosely-typed generation fields
// that aren't columns on the tracks Row (used only as skeleton fallbacks).
type GenerationExtras = { description?: string | null; model_used?: string | null };

export default function Library() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  // Desktop mode must match NavigationShell's ≥1024px breakpoint. Between 768–1023 the
  // app already renders a mobile bottom nav — showing the desktop split-form sidebar too
  // would collide with it and steal vertical space.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qRef = useRef(searchParams.get("q"));
  const trackColumnRef = useRef<HTMLDivElement | null>(null);
  const { playTrack, pauseTrack, isPlaying } = usePlayerStore();

  // Desktop sidebar state — default expanded on ≥1280px (xl), collapsed to icon rail on lg (1024–1279px).
  const [generateSidebarCollapsed, setGenerateSidebarCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1280 : false,
  );

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

  // Sprint P2.3: distinguish initial load (full skeletons) from refresh (compact indicator)
  const isInitialLoad = isLoading && (!tracks || tracks.length === 0);

  // Read ?q= from URL on mount — triggers search from homepage
  useEffect(() => {
    const q = qRef.current;
    if (q) {
      setSearchQuery(q);
    }
  }, []);
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

  // Split off in-flight tracks (no audio yet, still pending/processing) — they render as skeletons
  const { inFlightTracks, readyTracks } = (() => {
    const inFlight: typeof filteredTracks = [];
    const ready: typeof filteredTracks = [];
    for (const t of filteredTracks) {
      const status = t.status ?? undefined;
      const noAudio = !t.audio_url && !t.streaming_url;
      if ((status === "pending" || status === "processing") && noAudio) {
        inFlight.push(t);
      } else {
        ready.push(t);
      }
    }
    return { inFlightTracks: inFlight, readyTracks: ready };
  })();

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

  // Auto-switch grid → list when the tracks column becomes too narrow for a proper grid.
  // Uses ResizeObserver on the actual column, so it works regardless of sidebar / detail-panel state.
  useEffect(() => {
    const el = trackColumnRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0 && w < 420 && viewMode !== "list") {
        setViewMode("list");
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode, setViewMode]);

  // Handle track selection (for desktop detail panel)
  const handleTrackSelect = useCallback(
    (trackId: string) => {
      if (isDesktop) {
        setSelectedTrackId(trackId);
      }
    },
    [isDesktop],
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
        className="h-screen flex overflow-hidden"
        style={{
          paddingTop:
            "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
        }}
      >
        {/* Generate Sidebar — desktop panel only (mobile FAB handled inside component) */}
        {isDesktop && (
          <DesktopLibrarySidebar
            isCollapsed={generateSidebarCollapsed}
            onToggleCollapse={() => setGenerateSidebarCollapsed(!generateSidebarCollapsed)}
          />
        )}

        {/* Main Content - with master-detail layout on desktop */}
        <div
          className={cn("flex-1 min-w-0 flex overflow-hidden", !isMobile && selectedTrackId && "xl:gap-6 2xl:gap-8")}
        >
          {/* Track List Section — only this column scrolls */}
          <div
            ref={trackColumnRef}
            className={cn(
              "flex-1 min-w-0 flex flex-col overflow-hidden @container",
              isDesktop && selectedTrackId && "lg:max-w-[60%] xl:max-w-[55%] 2xl:max-w-[50%]",
            )}
          >
            {/* SR-only H1 for page-has-heading-one / heading uniqueness */}
            <h1 className="sr-only">Моя библиотека — MusicVerse</h1>

            {/* Unified Header — non-sticky within flex column; scroll happens inside content region below */}
            <AppHeader
              className="!static !mx-0 flex-shrink-0"
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
                      className={`${touchIcon} rounded-md lg:rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm hover:shadow-md transition-shadow`}
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
                      className={`${touchIcon} rounded-md lg:rounded-lg hover:bg-muted/80 transition-colors`}
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
                        `${touchIcon} rounded lg:rounded-md transition-all`,
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
                        `${touchIcon} rounded lg:rounded-md transition-all`,
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

            {/* Scrollable region — filters + track list share single scroll container */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <LibraryFilterChips activeFilter={typeFilter} onFilterChange={setTypeFilter} counts={filterCounts} />

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

                {/* Track List Content */}
                {isInitialLoad ? (
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
                            ? "grid grid-cols-2 @[420px]:grid-cols-3 @[600px]:grid-cols-4 @[780px]:grid-cols-5 @[960px]:grid-cols-6 @[1180px]:grid-cols-7 gap-3 @[600px]:gap-4"
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
                    {/* Refresh indicator — compact when data exists and is reloading */}
                    {isLoading && !isInitialLoad && (
                      <div className="flex justify-center py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {/* In-flight tracks — render live skeletons that reveal fields as they arrive */}
                    {inFlightTracks.length > 0 && (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-2 @[420px]:grid-cols-3 @[600px]:grid-cols-4 @[780px]:grid-cols-5 @[960px]:grid-cols-6 @[1180px]:grid-cols-7 gap-3 @[600px]:gap-4 mb-3 sm:mb-4 @container"
                            : "flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4"
                        }
                      >
                        {inFlightTracks.map((t) => (
                          <GeneratingTrackSkeleton
                            key={t.id}
                            layout={viewMode}
                            status={t.status || "processing"}
                            prompt={t.prompt || (t as GenerationExtras).description || t.style || undefined}
                            createdAt={t.created_at ?? undefined}
                            title={t.title || null}
                            style={t.style || null}
                            coverUrl={t.cover_url || null}
                            model={t.suno_model || (t as GenerationExtras).model_used || null}
                            streamingReady={t.status === "streaming_ready" || !!t.streaming_url}
                          />
                        ))}
                      </div>
                    )}

                    <VirtualizedTrackList
                      tracks={readyTracks}
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
          </div>

          {/* Desktop: Track Detail Panel */}
          {isDesktop && selectedTrack && (
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
      </LibraryDialogs>
    </ErrorBoundaryWrapper>
  );
}
