/**
 * Index Page — Decluttered Home (4-cluster layout)
 *
 * Replaces the previous 10+ stacked sections with four semantic blocks:
 *   1. HERO       — onboarding for new users / continue draft for returning
 *   2. CREATE     — single primary CTA + creative presets row
 *   3. DISCOVER   — tabbed track feed (Popular / New)
 *   4. YOU        — gamification strip (signed-in only)
 *
 * Single layout function for desktop (12-col grid) and mobile (stack).
 */

import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "@/lib/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useProfile } from "@/hooks/useProfile.tsx";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { useHomePageData } from "@/hooks/useHomePageData";
import { useHomePageHandlers } from "@/hooks/useHomePageHandlers";
import { useHomePageEffects } from "@/hooks/useHomePageEffects";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useOpenGenerateFromDeeplink } from "@/hooks/useOpenGenerateFromDeeplink";
import { listenOpenGenerateSheet } from "@/lib/events";
// HomeStickyCTA removed — primary Create action is in the nav (sidebar on desktop, bottom nav on mobile).
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { cn } from "@/lib/utils";

import { HomeQuickCreate } from "@/components/home/HomeQuickCreate";
import { BotContextBanner } from "@/components/home/BotContextBanner";
import { FirstTimeHeroCard } from "@/components/home/FirstTimeHeroCard";
import { ContinueDraftCard } from "@/components/home/ContinueDraftCard";
import { CreativePresetsSection } from "@/components/home/CreativePresetsSection";
import { DiscoverTabs } from "@/components/home/DiscoverTabs";
import { HomeDesktopSidebar } from "@/components/home/HomeDesktopSidebar";
import { HomeMobileSynthHero } from "@/components/home/HomeMobileSynthHero";

const FeaturedSection = lazy(() =>
  import("@/components/home/FeaturedSection").then((m) => ({ default: m.FeaturedSection })),
);
const GenreTabsSection = lazy(() =>
  import("@/components/home/GenreTabsSection").then((m) => ({ default: m.GenreTabsSection })),
);
const AiSuggestions = lazy(() => import("@/components/home/AiSuggestions").then((m) => ({ default: m.AiSuggestions })));
import { Section, sectionTokens } from "@/components/layout/Section";

const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then((m) => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() =>
  import("@/components/music-recognition/MusicRecognitionDialog").then((m) => ({ default: m.MusicRecognitionDialog })),
);
const AudioActionDialog = lazy(() =>
  import("@/components/generate-form/AudioActionDialog").then((m) => ({ default: m.AudioActionDialog })),
);

import { ContextHints } from "@/components/hints";

const FallbackSection = ({ title }: { title: string }) => {
  const { t } = useTranslation();
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-muted-foreground">
        {t("common.loading")}: {title}
      </p>
      <button onClick={() => window.location.reload()} className="mt-3 text-sm text-primary hover:underline">
        {t("common.refresh")}
      </button>
    </div>
  );
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const isMobile = useIsMobile();
  const activeTrack = usePlayerStore((s) => s.activeTrack);

  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);

  // Stable across renders (setState functions are guaranteed stable) so the
  // memoized handlers in useHomePageHandlers/useHomePageEffects don't get
  // recreated on every Index render, which would defeat memo() on their
  // consumers (FirstTimeHeroCard, HomeQuickCreate, AiSuggestions, DiscoverTabs).
  const openGenerateSheet = useCallback(() => setGenerateSheetOpen(true), []);
  const openAudioDialog = useCallback(() => setAudioDialogOpen(true), []);
  const openRecognitionDialog = useCallback(() => setRecognitionDialogOpen(true), []);

  // Sprint 055 P0-1: Telegram `startapp=generate` deeplink → open GenerateSheet.
  // DeepLinkHandler navigates here with `?openGenerate=1`; the hook below opens
  // the sheet and strips the param so reload doesn't reopen it.
  useOpenGenerateFromDeeplink(openGenerateSheet);

  // Sprint 055-B7: Listen for custom event to open generate sheet (from HomeStickyCTA)
  useEffect(() => {
    const cleanup = listenOpenGenerateSheet(() => {
      setGenerateSheetOpen(true);
    });
    return cleanup;
  }, []);

  const { isNewUser } = useUserJourneyState();

  const homePageData = useHomePageData();
  const recentTracks = homePageData.recentTracks;
  const popularTracks = homePageData.popularTracks;
  const tracksByGenre = homePageData.tracksByGenre;
  const isLoading = homePageData.isLoading;
  const isError = homePageData.isError;
  const error = homePageData.error;
  const refresh = homePageData.refresh;
  const hasMoreRecent = homePageData.hasMoreRecent;
  const isLoadingMoreRecent = homePageData.isLoadingMoreRecent;
  const fetchMoreRecent = homePageData.fetchMoreRecent;
  const hasMorePopular = homePageData.hasMorePopular;
  const isLoadingMorePopular = homePageData.isLoadingMorePopular;
  const fetchMorePopular = homePageData.fetchMorePopular;

  const { goToProfile, handleCreate, handleTrackClick, handleQuickGenrePreset } = useHomePageHandlers({
    onOpenGenerateSheet: openGenerateSheet,
    onOpenAudioDialog: openAudioDialog,
  });

  useHomePageEffects({
    onOpenGenerateSheet: openGenerateSheet,
    onOpenRecognitionDialog: openRecognitionDialog,
  });

  const displayUser = profile || telegramUser;

  // === 4 semantic clusters — every one wrapped in <Section/> ===
  // === 4 semantic clusters — every one wrapped in <Section/> ===
  const heroBlock = useMemo(
    () => (
      <Section sectionId="hero" density="compact" tone="plain">
        {isNewUser ? (
          <FirstTimeHeroCard onCreateClick={handleCreate} />
        ) : (
          <ContinueDraftCard onContinue={handleCreate} />
        )}
      </Section>
    ),
    [isNewUser, handleCreate],
  );

  const createBlock = useMemo(
    () => (
      <Section
        sectionId="create"
        eyebrow={t("home.section.create")}
        title={t("home.section.title")}
        subtitle={t("home.section.subtitle")}
        density="compact"
      >
        <HomeQuickCreate onCreateClick={handleCreate} />
        <CreativePresetsSection onTrackPresetSelect={handleQuickGenrePreset} />
      </Section>
    ),
    [t, handleCreate, handleQuickGenrePreset],
  );

  const discoverBlock = useMemo(
    () => (
      <Section
        sectionId="discover"
        eyebrow={t("home.section.discoverEyebrow")}
        title={t("home.section.discoverTitle")}
        subtitle={t("home.section.discoverSubtitle")}
        density="comfortable"
      >
        <ErrorBoundary fallback={() => <FallbackSection title={t("home.section.fallbackDiscover")} />}>
          <DiscoverTabs
            popularTracks={popularTracks}
            recentTracks={recentTracks}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refresh}
            hasMorePopular={hasMorePopular}
            isLoadingMorePopular={isLoadingMorePopular}
            onLoadMorePopular={fetchMorePopular}
            hasMoreRecent={hasMoreRecent}
            isLoadingMoreRecent={isLoadingMoreRecent}
            onLoadMoreRecent={fetchMoreRecent}
            onTrackClick={handleTrackClick}
          />
        </ErrorBoundary>
      </Section>
    ),
    [
      popularTracks,
      recentTracks,
      isLoading,
      isError,
      error,
      refresh,
      hasMorePopular,
      isLoadingMorePopular,
      fetchMorePopular,
      hasMoreRecent,
      isLoadingMoreRecent,
      fetchMoreRecent,
      handleTrackClick,
      t,
    ],
  );

  const trendingBlock = useMemo(
    () => (
      <Section sectionId="trending" density="compact" tone="plain">
        <ErrorBoundary fallback={() => <FallbackSection title={t("home.section.fallbackTrending")} />}>
          <FeaturedSection
            tracks={popularTracks}
            isLoading={isLoading}
            onTrackClick={handleTrackClick}
            hasMore={hasMorePopular}
            isLoadingMore={isLoadingMorePopular}
            onLoadMore={fetchMorePopular}
          />
        </ErrorBoundary>
      </Section>
    ),
    [popularTracks, isLoading, handleTrackClick, hasMorePopular, isLoadingMorePopular, fetchMorePopular, t],
  );

  const genresBlock = useMemo(
    () => (
      <Section
        sectionId="genres"
        eyebrow={t("home.section.genresEyebrow")}
        title={t("home.section.genresTitle")}
        density="compact"
      >
        <ErrorBoundary fallback={() => <FallbackSection title={t("home.section.fallbackGenres")} />}>
          <GenreTabsSection tracks={popularTracks} tracksByGenre={tracksByGenre} isLoading={isLoading} />
        </ErrorBoundary>
      </Section>
    ),
    [popularTracks, tracksByGenre, isLoading, t],
  );

  const aiSuggestBlock = useMemo(
    () => (
      <Section sectionId="ai-suggest" density="compact" tone="plain">
        <AiSuggestions onCreateClick={handleCreate} />
      </Section>
    ),
    [handleCreate],
  );

  // ponytail: inline style for var() dynamic padding not expressible in Tailwind classes
  const bottomPaddingStyle = useMemo(() => {
    if (isMobile) {
      const rem = activeTrack ? "6rem" : "3rem";
      return `calc(env(safe-area-inset-bottom, 0px) + ${rem})`;
    }
    return activeTrack ? "2rem" : "1rem";
  }, [isMobile, activeTrack]);

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingTop:
          "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
      }}
    >
      <div
        className={cn("w-full mx-auto relative z-10", sectionTokens.shellMaxWidth, sectionTokens.containerPadding)}
        style={{ paddingBottom: bottomPaddingStyle }}
      >
        <SEOHead {...SEO_PRESETS.home} canonical="https://aimusicverse.lovable.app/" />
        <span className="sr-only">{t("home.seo.srOnly")}</span>

        <ErrorBoundary>
          <HomeHeader
            userName={displayUser?.first_name || displayUser?.username?.split("@")[0]}
            userPhotoUrl={displayUser?.photo_url}
            onProfileClick={goToProfile}
          />
        </ErrorBoundary>

        <div className="my-3 w-full">
          <HomeSearchBar onSearch={(q) => navigate(`/library?q=${encodeURIComponent(q)}`)} />
        </div>

        <ErrorBoundary>
          <BotContextBanner />
        </ErrorBoundary>

        <PullToRefreshWrapper onRefresh={refresh} disabled={!isMobile} className="relative">
          {/*
            Adaptive shell — 4 breakpoint tiers:
              < md   (mobile):     single column, natural stack
              md–lg  (tablet):     single column, wider max-width, rail hidden
              lg–xl  (desktop):    8/4 split, right rail becomes sticky
              xl+    (wide):       9/3 dense split, tighter gaps
              2xl+   (ultra):      10/2 compact, generous internal breathing room
            items-start prevents the aside from stretching vertically.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
            <div className={cn("lg:col-span-8 xl:col-span-9 min-w-0", sectionTokens.blockGap)}>
              {isMobile ? (
                <Section sectionId="synth-hero" density="compact" tone="plain">
                  <HomeMobileSynthHero onCreateClick={handleCreate} />
                </Section>
              ) : (
                <>
                  {heroBlock}
                  {createBlock}
                </>
              )}
              {trendingBlock}
              {genresBlock}
              {discoverBlock}
              {aiSuggestBlock}
            </div>


            <aside
              className={cn(
                "hidden lg:block lg:col-span-4 xl:col-span-3 min-w-0",
                "lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain",
                "scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent",
              )}
              aria-label={t("home.section.sidebar")}
            >
              <HomeDesktopSidebar isAuthenticated={!!user} />
            </aside>
          </div>
        </PullToRefreshWrapper>

        {generateSheetOpen && (
          <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-primary" />}>
            <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
          </Suspense>
        )}
        {recognitionDialogOpen && (
          <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-primary" />}>
            <MusicRecognitionDialog open={recognitionDialogOpen} onOpenChange={setRecognitionDialogOpen} />
          </Suspense>
        )}
        {audioDialogOpen && (
          <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-primary" />}>
            <AudioActionDialog
              open={audioDialogOpen}
              onOpenChange={setAudioDialogOpen}
              onAudioSelected={() => setAudioDialogOpen(false)}
            />
          </Suspense>
        )}
      </div>

      {/* HomeStickyCTA removed — Create is available in the sidebar (desktop) and bottom nav (mobile). */}
    </div>
  );
};

export default Index;
