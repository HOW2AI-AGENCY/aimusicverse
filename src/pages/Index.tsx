/**
 * Index Page - Redesigned Mobile-First Home
 * Feature: 001-mobile-ui-redesign
 *
 * Sections are declared once and rendered by id in desktop main/aside columns
 * and the mobile single column. Animation/spacing is unified via <HomeSection/>.
 */

import { useState, useMemo, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useProfile } from "@/hooks/useProfile.tsx";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { useHomePageData } from "@/hooks/useHomePageData";
import { useHomePageHandlers } from "@/hooks/useHomePageHandlers";
import { useHomePageEffects } from "@/hooks/useHomePageEffects";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySection } from "@/components/lazy/LazySection";
import { useReducedMotion } from "@/lib/motion";
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSkeleton } from "@/components/ui/ContentSkeleton";
import { Clock } from "@/lib/icons";
import { homeSectionColors } from "@/lib/design-colors";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";

// Core home components
import { HomeQuickCreate } from "@/components/home/HomeQuickCreate";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { QuickStartCards } from "@/components/home/QuickStartCards";
import { BotContextBanner } from "@/components/home/BotContextBanner";
import { TracksGridSection } from "@/components/home/TracksGridSection";
import { FirstTimeHeroCard } from "@/components/home/FirstTimeHeroCard";
import { NewUserProgress } from "@/components/home/NewUserProgress";
import { ContinueDraftCard } from "@/components/home/ContinueDraftCard";
import { CreativePresetsSection } from "@/components/home/CreativePresetsSection";
import { StatsHighlightBanner } from "@/components/home/StatsHighlightBanner";
import { DailyTipCard } from "@/components/home/DailyTipCard";
import { HomeSection } from "@/components/home/HomeSection";
import { HomeSectionGroup } from "@/components/home/HomeSectionGroup";

// Lazy loaded components
const GamificationBar = lazy(() =>
  import("@/components/gamification/GamificationBar").then((m) => ({ default: m.GamificationBar })),
);
const RecentTracksSection = lazy(() =>
  import("@/components/home/RecentTracksSection").then((m) => ({ default: m.RecentTracksSection })),
);

// Dialogs - only loaded when opened
const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then((m) => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() =>
  import("@/components/music-recognition/MusicRecognitionDialog").then((m) => ({ default: m.MusicRecognitionDialog })),
);
const AudioActionDialog = lazy(() =>
  import("@/components/generate-form/AudioActionDialog").then((m) => ({ default: m.AudioActionDialog })),
);

import { ContextHints } from "@/components/hints";

const Index = () => {
  const { user } = useAuth();
  const { user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const activeTrack = usePlayerStore((s) => s.activeTrack);

  // Dialog states
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);

  const { isNewUser } = useUserJourneyState();

  const {
    recentTracks,
    popularTracks,
    isLoading,
    hasMoreRecent,
    isLoadingMoreRecent,
    fetchMoreRecent,
    hasMorePopular,
    isLoadingMorePopular,
    fetchMorePopular,
    refresh,
  } = useHomePageData();

  const { goToProfile, handleCreate, handleRemix, handleTrackClick, handleQuickStartPreset, handleQuickGenrePreset } =
    useHomePageHandlers({
      onOpenGenerateSheet: () => setGenerateSheetOpen(true),
      onOpenAudioDialog: () => setAudioDialogOpen(true),
    });

  useHomePageEffects({
    onOpenGenerateSheet: () => setGenerateSheetOpen(true),
    onOpenRecognitionDialog: () => setRecognitionDialogOpen(true),
  });

  const displayUser = profile || telegramUser;

  const fadeInUp = useMemo(() => {
    if (prefersReducedMotion || isLoading) return undefined;
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.15 },
    };
  }, [prefersReducedMotion, isLoading]);

  const lazySectionAnimation = useMemo(() => {
    if (prefersReducedMotion || isLoading) return undefined;
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2 },
      viewport: { once: true, margin: "-30px" },
    };
  }, [prefersReducedMotion, isLoading]);

  // ====== Section renderers (single source of truth, no duplication) ======
  // Spacing is now controlled by parent group wrappers via `space-y-*`,
  // individual `mb-*` margins removed for a unified rhythm.
  const sections = {
    gamification: user ? (
      <HomeSection key="gamification" sectionId="gamification" as="div" animation={fadeInUp} fallback={null}>
        <GamificationBar />
      </HomeSection>
    ) : null,

    newUserHero: isNewUser ? (
      <HomeSection
        key="newUserHero"
        sectionId="hero"
        animation={fadeInUp}
        fallback={
          <div data-safe-skeleton="">
            <HeroSkeleton />
          </div>
        }
      >
        <FirstTimeHeroCard onCreateClick={handleCreate} />
      </HomeSection>
    ) : null,

    newUserProgress: isNewUser ? (
      <HomeSection key="newUserProgress" sectionId="new-user-progress" animation={lazySectionAnimation} fallback={null}>
        <NewUserProgress />
      </HomeSection>
    ) : null,

    continueDraft: !isNewUser ? <ContinueDraftCard key="continueDraft" onContinue={handleCreate} /> : null,

    quickCreate: !isNewUser ? (
      <HomeSection key="quickCreate" sectionId="quick-create" animation={fadeInUp}>
        <HomeQuickCreate onCreateClick={handleCreate} />
      </HomeSection>
    ) : null,

    stats: (
      <HomeSection key="stats" sectionId="stats" animation={fadeInUp}>
        <div data-testid="stats-highlight">
          <StatsHighlightBanner />
        </div>
      </HomeSection>
    ),

    creativePresets: (
      <HomeSection key="creativePresets" sectionId="quick-start" animation={fadeInUp}>
        <CreativePresetsSection onTrackPresetSelect={handleQuickGenrePreset} />
      </HomeSection>
    ),

    featured: (
      <HomeSection key="featured" sectionId="featured" animation={fadeInUp}>
        <FeaturedSection
          tracks={popularTracks}
          isLoading={isLoading}
          onTrackClick={handleTrackClick}
          onRemix={handleRemix}
          hasMore={hasMorePopular}
          isLoadingMore={isLoadingMorePopular}
          onLoadMore={fetchMorePopular}
        />
      </HomeSection>
    ),

    dailyTip: !isNewUser ? (
      <HomeSection key="dailyTip" sectionId="daily-tip" animation={fadeInUp}>
        <DailyTipCard />
      </HomeSection>
    ) : null,

    recent: user ? (
      <HomeSection
        key="recent"
        sectionId="popular"
        animation={fadeInUp}
        fallback={
          <div data-safe-skeleton="">
            <Skeleton className="h-32 rounded-xl" />
          </div>
        }
      >
        <RecentTracksSection maxTracks={5} />
      </HomeSection>
    ) : null,

    quickStart: !isNewUser ? (
      <HomeSection key="quickStart" sectionId="quick-start-cards" animation={fadeInUp}>
        <QuickStartCards onPresetSelect={handleQuickStartPreset} />
      </HomeSection>
    ) : null,

    newTracksGrid: (
      <LazySection key="newTracksGrid" minHeight="120px" skipSuspense>
        <HomeSection as="div" sectionId="new" animation={lazySectionAnimation}>
          <TracksGridSection
            title="✨ Новинки"
            subtitle="Свежие треки от авторов сообщества"
            icon={Clock}
            iconColor={homeSectionColors.newItems.icon}
            iconGradient={homeSectionColors.newItems.gradient}
            tracks={recentTracks}
            isLoading={isLoading}
            maxTracks={100}
            columns={isMobile ? 2 : 3}
            onRemix={handleRemix}
            hasMore={hasMoreRecent}
            isLoadingMore={isLoadingMoreRecent}
            onLoadMore={fetchMoreRecent}
          />
        </HomeSection>
      </LazySection>
    ),
  };

  // Desktop: 8/4 split — main column / sticky right rail.
  // Sections are clustered into semantic groups with consistent rhythm.
  const renderDesktopLayout = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      <div className="xl:col-span-8 min-w-0 overflow-hidden space-y-10">
        <HomeSectionGroup>
          {sections.newUserHero}
          {sections.newUserProgress}
          {sections.continueDraft}
          {sections.quickCreate}
        </HomeSectionGroup>

        <HomeSectionGroup eyebrow="Создать" tone="primary">
          {sections.creativePresets}
        </HomeSectionGroup>

        <HomeSectionGroup eyebrow="Сейчас популярно" tone="accent">
          {sections.featured}
        </HomeSectionGroup>

        <HomeSectionGroup eyebrow="Свежее">
          {sections.newTracksGrid}
        </HomeSectionGroup>
      </div>

      <aside className="xl:col-span-4 min-w-0 overflow-hidden xl:sticky xl:top-6 space-y-8">
        <HomeSectionGroup>
          {sections.stats}
          {sections.gamification}
        </HomeSectionGroup>

        <HomeSectionGroup eyebrow="Для вас" tone="muted">
          {sections.dailyTip}
          {sections.recent}
          {sections.quickStart}
        </HomeSectionGroup>
      </aside>
    </div>
  );

  // Mobile: single column with same semantic clusters.
  const renderMobileLayout = () => (
    <div className="space-y-10">
      <HomeSectionGroup>
        {sections.gamification}
        {sections.newUserHero}
        {sections.newUserProgress}
        {sections.continueDraft}
        {sections.quickCreate}
      </HomeSectionGroup>

      <HomeSectionGroup eyebrow="Создать" tone="primary">
        {sections.stats}
        {sections.creativePresets}
      </HomeSectionGroup>

      <HomeSectionGroup eyebrow="Сейчас популярно" tone="accent">
        {sections.featured}
      </HomeSectionGroup>

      <HomeSectionGroup eyebrow="Для вас">
        {sections.dailyTip}
        {sections.recent}
        {sections.quickStart}
      </HomeSectionGroup>

      <HomeSectionGroup eyebrow="Свежее">
        {sections.newTracksGrid}
      </HomeSectionGroup>
    </div>
  );



  // Bottom spacing: BottomNav (~80px) + CompactPlayer (~72px when active) + safe-area.
  const wrapperPaddingBottom = isMobile
    ? activeTrack
      ? "calc(env(safe-area-inset-bottom, 0px) + 12rem)"
      : "calc(env(safe-area-inset-bottom, 0px) + 6rem)"
    : activeTrack
      ? "6rem"
      : "1rem";

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingTop:
          "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
      }}
    >
      <PullToRefreshWrapper onRefresh={refresh} disabled={!isMobile} className="relative">
        {!prefersReducedMotion && !isLoading && (
          <div className="fixed inset-0 pointer-events-none opacity-15">
            <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          </div>
        )}

        <div
          className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:py-6 relative z-10"
          style={{ paddingBottom: wrapperPaddingBottom }}
        >
          <SEOHead {...SEO_PRESETS.home} canonical="https://aimusicverse.lovable.app/" />

          <h1 className="sr-only">MusicVerse — Платформа для генерации музыки с AI</h1>

          <HomeHeader
            userName={displayUser?.first_name || displayUser?.username?.split("@")[0]}
            userPhotoUrl={displayUser?.photo_url}
            onProfileClick={goToProfile}
          />


          <BotContextBanner />

          {isMobile ? renderMobileLayout() : renderDesktopLayout()}
        </div>

        {generateSheetOpen && (
          <Suspense fallback={null}>
            <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
          </Suspense>
        )}
        {recognitionDialogOpen && (
          <Suspense fallback={null}>
            <MusicRecognitionDialog open={recognitionDialogOpen} onOpenChange={setRecognitionDialogOpen} />
          </Suspense>
        )}
        {audioDialogOpen && (
          <Suspense fallback={null}>
            <AudioActionDialog
              open={audioDialogOpen}
              onOpenChange={setAudioDialogOpen}
              onAudioSelected={() => setAudioDialogOpen(false)}
            />
          </Suspense>
        )}

        <ContextHints context="generation" delay={4000} />
      </PullToRefreshWrapper>
    </div>
  );
};

export default Index;
