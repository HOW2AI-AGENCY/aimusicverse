/**
 * Index Page - Redesigned Mobile-First Home
 * Feature: 001-mobile-ui-redesign
 *
 * Streamlined home screen with 4 main sections:
 * 1. QuickCreate - Primary create action
 * 2. Featured - Popular tracks (max 6, horizontal scroll)
 * 3. RecentPlays - Last 5 played tracks
 * 4. QuickStart - Quick action cards
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
import { motion, useReducedMotion } from '@/lib/motion';
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSkeleton } from "@/components/ui/skeletons/TrackListSkeleton";
import { Clock } from "lucide-react";

// Core home components
import { HomeQuickCreate } from "@/components/home/HomeQuickCreate";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { QuickStartCards } from "@/components/home/QuickStartCards";
import { type TrackPreset } from "@/components/home/TrackPresetsRow";
import { BotContextBanner } from "@/components/home/BotContextBanner";
import { TracksGridSection } from "@/components/home/TracksGridSection";
import { FirstTimeHeroCard } from "@/components/home/FirstTimeHeroCard";
import { NewUserProgress } from "@/components/home/NewUserProgress";
import { ContinueDraftCard } from "@/components/home/ContinueDraftCard";
import { CreativePresetsSection } from "@/components/home/CreativePresetsSection";
import { StatsHighlightBanner } from "@/components/home/StatsHighlightBanner";
import { DailyTipCard } from "@/components/home/DailyTipCard";

// Lazy loaded components
const GamificationBar = lazy(() => import("@/components/gamification/GamificationBar").then(m => ({ default: m.GamificationBar })));
const RecentTracksSection = lazy(() => import("@/components/home/RecentTracksSection").then(m => ({ default: m.RecentTracksSection })));

// Dialogs - only loaded when opened
const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then(m => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() => import("@/components/music-recognition/MusicRecognitionDialog").then(m => ({ default: m.MusicRecognitionDialog })));
const AudioActionDialog = lazy(() => import("@/components/generate-form/AudioActionDialog").then(m => ({ default: m.AudioActionDialog })));

const Index = () => {
  const { user } = useAuth();
  const { user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Dialog states
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);

  // User journey state for personalized experience
  const { isNewUser } = useUserJourneyState();

  // Consolidated data hook
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

  // Consolidated handlers
  const {
    goToProfile,
    handleCreate,
    handleRemix,
    handleTrackClick,
    handleQuickStartPreset,
    handleQuickGenrePreset,
  } = useHomePageHandlers({
    onOpenGenerateSheet: () => setGenerateSheetOpen(true),
    onOpenAudioDialog: () => setAudioDialogOpen(true),
  });

  // URL effects and deep linking
  useHomePageEffects({
    onOpenGenerateSheet: () => setGenerateSheetOpen(true),
    onOpenRecognitionDialog: () => setRecognitionDialogOpen(true),
  });

  // Use profile data from DB if available, fallback to Telegram context
  const displayUser = profile || telegramUser;

  // Animation props - simplified for better scroll performance
  // Disable animations during loading to prevent scroll jank
  const fadeInUp = useMemo(() => {
    if (prefersReducedMotion || isLoading) return {};
    return { 
      initial: { opacity: 0 }, 
      animate: { opacity: 1 }, 
      transition: { duration: 0.15 } 
    };
  }, [prefersReducedMotion, isLoading]);

  const lazySectionAnimation = useMemo(() => {
    if (prefersReducedMotion || isLoading) return {};
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.2 },
      viewport: { once: true, margin: "-30px" }
    };
  }, [prefersReducedMotion, isLoading]);

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        paddingTop: 'max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))',
      }}
    >
      <PullToRefreshWrapper
        onRefresh={refresh}
        disabled={!isMobile}
        className="pb-24 relative"
      >
        {/* Background gradient - lazy rendered */}
        {!prefersReducedMotion && !isLoading && (
          <div className="fixed inset-0 pointer-events-none opacity-15">
            <div className="absolute top-0 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          </div>
        )}

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 sm:py-6 relative z-10">
          <SEOHead {...SEO_PRESETS.home} />

        {/* Header */}
        <HomeHeader
          userName={displayUser?.first_name || displayUser?.username?.split('@')[0]}
          userPhotoUrl={displayUser?.photo_url}
          onProfileClick={goToProfile}
        />

        {/* Bot Context Banner */}
        <BotContextBanner />

        {/* Gamification Bar - for logged in users */}
        {user && (
          <Suspense fallback={null}>
            <motion.div className="mb-4" {...fadeInUp}>
              <GamificationBar />
            </motion.div>
          </Suspense>
        )}

        {/* ============== MAIN SECTIONS ============== */}

        {/* New Users: Hero + Progress */}
        {isNewUser && (
          <>
            <Suspense fallback={<HeroSkeleton />}>
              <motion.section className="mb-3" {...fadeInUp}>
                <FirstTimeHeroCard onCreateClick={handleCreate} />
              </motion.section>
            </Suspense>
            <Suspense fallback={null}>
              <motion.section className="mb-3" {...lazySectionAnimation}>
                <NewUserProgress />
              </motion.section>
            </Suspense>
          </>
        )}

        {/* Returning Users: Continue Draft or QuickCreate */}
        {!isNewUser && (
          <>
            <ContinueDraftCard onContinue={handleCreate} className="mb-3" />
            <motion.section className="mb-3" {...fadeInUp}>
              <HomeQuickCreate onCreateClick={handleCreate} />
            </motion.section>
          </>
        )}

        {/* Stats Banner - social proof */}
        <motion.section className="mb-3" {...fadeInUp}>
          <StatsHighlightBanner />
        </motion.section>

        {/* Creative Presets Section - Tracks, Lyrics & Projects */}
        <motion.section className="mb-4" {...fadeInUp}>
          <CreativePresetsSection 
            onTrackPresetSelect={handleQuickGenrePreset} 
          />
        </motion.section>

        {/* Featured Tracks - horizontal scroll with load more */}
        <motion.section className="mb-3" {...fadeInUp}>
          <FeaturedSection
            tracks={popularTracks}
            isLoading={isLoading}
            onTrackClick={handleTrackClick}
            onRemix={handleRemix}
            hasMore={hasMorePopular}
            isLoadingMore={isLoadingMorePopular}
            onLoadMore={fetchMorePopular}
          />
        </motion.section>

        {/* Daily Tip - feature discovery */}
        {!isNewUser && (
          <motion.section className="mb-3" {...fadeInUp}>
            <DailyTipCard />
          </motion.section>
        )}

        {/* Recent Tracks - for logged in users */}
        {user && (
          <Suspense fallback={<Skeleton className="h-32 rounded-xl" />}>
            <motion.section className="mb-3" {...fadeInUp}>
              <RecentTracksSection maxTracks={5} />
            </motion.section>
          </Suspense>
        )}

        {/* QuickStart Cards - for returning users */}
        {!isNewUser && (
          <motion.section className="mb-3" {...fadeInUp}>
            <QuickStartCards onPresetSelect={handleQuickStartPreset} />
          </motion.section>
        )}

        {/* ============== SECONDARY SECTIONS ============== */}

        {/* New Tracks - with infinite scroll */}
        <LazySection className="mb-3" minHeight="120px" skipSuspense>
          <motion.div {...lazySectionAnimation}>
            <TracksGridSection
              title="✨ Новинки"
              subtitle="Свежие треки от авторов сообщества"
              icon={Clock}
              iconColor="text-orange-400"
              iconGradient="from-orange-500/20 to-amber-500/10"
              tracks={recentTracks}
              isLoading={isLoading}
              maxTracks={100}
              columns={isMobile ? 2 : 4}
              onRemix={handleRemix}
              hasMore={hasMoreRecent}
              isLoadingMore={isLoadingMoreRecent}
              onLoadMore={fetchMoreRecent}
            />
          </motion.div>
        </LazySection>
      </div>

      {/* Dialogs - lazy loaded on demand */}
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
      </PullToRefreshWrapper>
    </div>
  );
};

export default Index;
