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

import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useProfile } from "@/hooks/useProfile.tsx";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { useHomePageData } from "@/hooks/useHomePageData";
import { useHomePageHandlers } from "@/hooks/useHomePageHandlers";
import { useHomePageEffects } from "@/hooks/useHomePageEffects";
import { HomeHeader } from "@/components/home/HomeHeader";
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
import { YouStrip } from "@/components/home/YouStrip";

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
  const isMobile = useIsMobile();
  const activeTrack = usePlayerStore((s) => s.activeTrack);

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

  const { goToProfile, handleCreate, handleTrackClick, handleQuickGenrePreset } = useHomePageHandlers({
    onOpenGenerateSheet: () => setGenerateSheetOpen(true),
    onOpenAudioDialog: () => setAudioDialogOpen(true),
  });

  useHomePageEffects({
    onOpenGenerateSheet: () => setGenerateSheetOpen(true),
    onOpenRecognitionDialog: () => setRecognitionDialogOpen(true),
  });

  const displayUser = profile || telegramUser;

  // === 4 semantic clusters ===
  const heroBlock = (
    <div className="space-y-4">
      {isNewUser ? (
        <FirstTimeHeroCard onCreateClick={handleCreate} />
      ) : (
        <ContinueDraftCard onContinue={handleCreate} />
      )}
    </div>
  );

  const createBlock = (
    <div className="space-y-5">
      <HomeQuickCreate onCreateClick={handleCreate} />
      <CreativePresetsSection onTrackPresetSelect={handleQuickGenrePreset} />
    </div>
  );

  const discoverBlock = (
    <DiscoverTabs
      popularTracks={popularTracks}
      recentTracks={recentTracks}
      isLoading={isLoading}
      hasMorePopular={hasMorePopular}
      isLoadingMorePopular={isLoadingMorePopular}
      onLoadMorePopular={fetchMorePopular}
      hasMoreRecent={hasMoreRecent}
      isLoadingMoreRecent={isLoadingMoreRecent}
      onLoadMoreRecent={fetchMoreRecent}
      onTrackClick={handleTrackClick}
    />
  );

  const youBlock = user ? <YouStrip /> : null;

  const bottomPadding = isMobile
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
        <div
          className={cn(
            "w-full max-w-screen-xl mx-auto pt-4 sm:pt-6 lg:pt-8 relative z-10",
            "px-4 sm:px-6 lg:px-8",
          )}
          style={{ paddingBottom: bottomPadding }}
        >
          <SEOHead {...SEO_PRESETS.home} canonical="https://aimusicverse.lovable.app/" />
          <h1 className="sr-only">MusicVerse — Платформа для генерации музыки с AI</h1>

          <HomeHeader
            userName={displayUser?.first_name || displayUser?.username?.split("@")[0]}
            userPhotoUrl={displayUser?.photo_url}
            onProfileClick={goToProfile}
          />

          <BotContextBanner />

          {/* Unified rhythm: 40px between clusters on mobile, 56px on desktop */}
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-12 items-start">
            <div className="xl:col-span-8 min-w-0 space-y-10 xl:space-y-12">
              {heroBlock}
              {createBlock}
              {discoverBlock}
            </div>

            <aside className="xl:col-span-4 min-w-0 xl:sticky xl:top-8 space-y-10">
              {youBlock}
            </aside>
          </div>
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
