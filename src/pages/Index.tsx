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

import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import { usePublicContentBatch } from "@/hooks/usePublicContent";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySection } from "@/components/lazy/LazySection";
import { motion, useReducedMotion } from '@/lib/motion';
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { preloadImages } from "@/lib/imageOptimization";
import { Clock, Users, Music2 } from "lucide-react";

// Core home components
import { HomeQuickCreate } from "@/components/home/HomeQuickCreate";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { QuickStartCards, type QuickStartPreset } from "@/components/home/QuickStartCards";
import { BotContextBanner } from "@/components/home/BotContextBanner";
import { TracksGridSection } from "@/components/home/TracksGridSection";
import { FirstTimeHeroCard } from "@/components/home/FirstTimeHeroCard";
import { NewUserProgress } from "@/components/home/NewUserProgress";
import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { GenreTabsSection } from "@/components/home/GenreTabsSection";
import { PopularCreatorsSection } from "@/components/home/PopularCreatorsSection";
import { InviteFriendsCard } from "@/components/gamification/InviteFriendsCard";
import { ContinueDraftCard } from "@/components/home/ContinueDraftCard";

// Lazy loaded components
const GamificationBar = lazy(() => import("@/components/gamification/GamificationBar").then(m => ({ default: m.GamificationBar })));
const RecentTracksSection = lazy(() => import("@/components/home/RecentTracksSection").then(m => ({ default: m.RecentTracksSection })));

// Dialogs - only loaded when opened
const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then(m => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() => import("@/components/music-recognition/MusicRecognitionDialog").then(m => ({ default: m.MusicRecognitionDialog })));
const AudioActionDialog = lazy(() => import("@/components/generate-form/AudioActionDialog").then(m => ({ default: m.AudioActionDialog })));

// Skeleton for hero section
const HeroSkeleton = () => (
  <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-background p-6 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-56" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-12 w-28" />
        <Skeleton className="h-12 w-28" />
      </div>
    </div>
  </div>
);

const Index = () => {
  const { user } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // User journey state for personalized experience
  const { isNewUser } = useUserJourneyState();

  // Single optimized query for all public content
  const { data: publicContent, isLoading: contentLoading, refetch: refetchContent } = usePublicContentBatch();

  // Show skeleton only on initial load
  const showSkeleton = contentLoading && !publicContent;

  // Preload first 4 track cover images
  useEffect(() => {
    if (publicContent?.popularTracks?.length) {
      const firstCovers = publicContent.popularTracks
        .slice(0, 4)
        .map(t => t.cover_url)
        .filter(Boolean) as string[];

      if (firstCovers.length) {
        preloadImages(firstCovers, true).catch(() => {});
      }
    }
  }, [publicContent?.popularTracks]);

  // Use profile data from DB if available, fallback to Telegram context
  const displayUser = profile || telegramUser;

  // Handle navigation state for opening GenerateSheet
  useEffect(() => {
    if (location.state?.openGenerate) {
      setGenerateSheetOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Handle deep link for recognition
  useEffect(() => {
    if (searchParams.get('recognize') === 'true') {
      setRecognitionDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const goToProfile = useCallback(() => {
    hapticFeedback("light");
    navigate(user?.id ? `/profile/${user.id}` : "/profile");
  }, [hapticFeedback, navigate, user?.id]);

  const handleRemix = useCallback((trackId: string) => {
    hapticFeedback("light");
    navigate(`/generate?remix=${trackId}`);
  }, [hapticFeedback, navigate]);

  const handleRefresh = useCallback(async () => {
    await refetchContent();
  }, [refetchContent]);

  const handleCreate = useCallback(() => {
    hapticFeedback("medium");
    setGenerateSheetOpen(true);
  }, [hapticFeedback]);

  // Handler for Quick Start preset cards
  const handleQuickStartPreset = useCallback((preset: QuickStartPreset) => {
    hapticFeedback("medium");
    switch (preset) {
      case 'track':
      case 'riff':
        setGenerateSheetOpen(true);
        break;
      case 'cover':
        setAudioDialogOpen(true);
        break;
    }
  }, [hapticFeedback]);

  // Animation props - simplified for faster rendering
  const fadeInUp = useMemo(() => prefersReducedMotion
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } },
    [prefersReducedMotion]
  );

  const lazySectionAnimation = useMemo(() => prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 },
        viewport: { once: true, margin: "-30px" }
      },
    [prefersReducedMotion]
  );

  return (
    <PullToRefreshWrapper
      onRefresh={handleRefresh}
      disabled={!isMobile}
      className="min-h-screen bg-background pb-24 relative"
    >
      {/* Background gradient - lazy rendered */}
      {!prefersReducedMotion && !showSkeleton && (
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
              <motion.section className="mb-4" {...fadeInUp}>
                <FirstTimeHeroCard onCreateClick={handleCreate} />
              </motion.section>
            </Suspense>
            <Suspense fallback={null}>
              <motion.section className="mb-4" {...lazySectionAnimation}>
                <NewUserProgress />
              </motion.section>
            </Suspense>
          </>
        )}

        {/* Returning Users: Continue Draft or QuickCreate */}
        {!isNewUser && (
          <>
            <ContinueDraftCard onContinue={handleCreate} className="mb-3" />
            <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.05 }}>
              <HomeQuickCreate onCreateClick={handleCreate} />
            </motion.section>
          </>
        )}

        {/* Featured Tracks */}
        <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.1 }}>
          <FeaturedSection
            tracks={publicContent?.popularTracks || []}
            isLoading={showSkeleton}
            maxTracks={6}
            onTrackClick={(trackId) => {
              hapticFeedback("light");
              navigate(`/track/${trackId}`);
            }}
            onRemix={handleRemix}
          />
        </motion.section>

        {/* Recent Tracks - for logged in users */}
        {user && (
          <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
            <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.15 }}>
              <RecentTracksSection maxTracks={5} />
            </motion.section>
          </Suspense>
        )}

        {/* QuickStart Cards - for returning users */}
        {!isNewUser && (
          <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.2 }}>
            <QuickStartCards onPresetSelect={handleQuickStartPreset} />
          </motion.section>
        )}

        {/* ============== SECONDARY SECTIONS ============== */}

        {/* New Tracks */}
        <LazySection className="mb-4" minHeight="120px" skipSuspense>
          <motion.div {...lazySectionAnimation}>
            <TracksGridSection
              title="✨ Новинки"
              subtitle="Свежие треки от авторов сообщества"
              icon={Clock}
              iconColor="text-orange-400"
              iconGradient="from-orange-500/20 to-amber-500/10"
              tracks={publicContent?.recentTracks || []}
              isLoading={showSkeleton}
              maxTracks={isMobile ? 6 : 12}
              columns={isMobile ? 2 : 4}
              showMoreLink="/community?sort=recent"
              showMoreLabel="Смотреть все"
              onRemix={handleRemix}
            />
          </motion.div>
        </LazySection>

        {/* Genre Tabs - collapsible */}
        {publicContent?.allTracks && publicContent.allTracks.length > 0 && (
          <LazySection className="mb-4" minHeight="120px" skipSuspense>
            <motion.div {...lazySectionAnimation}>
              <CollapsibleSection
                storageKey="home-genre-tabs"
                title="По жанрам"
                icon={<Music2 className="w-3.5 h-3.5 text-primary" />}
                defaultCollapsed={true}
              >
                <GenreTabsSection
                  tracks={publicContent.allTracks}
                  tracksByGenre={publicContent.tracksByGenre}
                  isLoading={showSkeleton}
                  onRemix={handleRemix}
                />
              </CollapsibleSection>
            </motion.div>
          </LazySection>
        )}

        {/* Popular Creators - collapsible */}
        <LazySection className="mb-4" minHeight="80px" skipSuspense>
          <motion.div {...lazySectionAnimation}>
            <CollapsibleSection
              storageKey="home-creators"
              title="Популярные авторы"
              icon={<Users className="w-3.5 h-3.5 text-primary" />}
              defaultCollapsed={true}
            >
              <PopularCreatorsSection maxCreators={6} />
            </CollapsibleSection>
          </motion.div>
        </LazySection>

        {/* Invite Friends Banner */}
        {user && !isNewUser && (
          <motion.section className="mb-4" {...lazySectionAnimation}>
            <InviteFriendsCard variant="banner" />
          </motion.section>
        )}
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
  );
};

export default Index;
