import { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import { usePublicContentBatch } from "@/hooks/usePublicContent";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { HomeHeader } from "@/components/home/HomeHeader";
import { GridSkeleton } from "@/components/ui/skeleton-components";
import { LazySection } from "@/components/lazy/LazySection";
import { motion, useReducedMotion } from '@/lib/motion';
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, Clock, Wrench, Users, Music2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { preloadImages } from "@/lib/imageOptimization";
import { MobileHeroSkeleton, MobileSectionSkeleton } from "@/components/mobile/MobileSkeletons";

// Critical path - eager loading for first paint
import { TracksGridSection } from "@/components/home/TracksGridSection";
import { HeroSectionPro } from "@/components/home/HeroSectionPro";
import { FirstTimeHeroCard } from "@/components/home/FirstTimeHeroCard";
import { NewUserProgress } from "@/components/home/NewUserProgress";
import { QuickInputBar } from "@/components/home/QuickInputBar";
import { CreatorToolsSection } from "@/components/home/CreatorToolsSection";
import { QuickPlaySection } from "@/components/home/QuickPlaySection";
import { QuickStartCards, type QuickStartPreset } from "@/components/home/QuickStartCards";
import { CollapsibleSection } from "@/components/home/CollapsibleSection";
import { BotContextBanner } from "@/components/home/BotContextBanner";
import { InviteFriendsCard } from "@/components/gamification/InviteFriendsCard";

// Lazy loaded components - only essential ones
const GamificationBar = lazy(() => import("@/components/gamification/GamificationBar").then(m => ({ default: m.GamificationBar })));
const RecentTracksSection = lazy(() => import("@/components/home/RecentTracksSection").then(m => ({ default: m.RecentTracksSection })));
const PopularCreatorsSection = lazy(() => import("@/components/home/PopularCreatorsSection").then(m => ({ default: m.PopularCreatorsSection })));
const GenreTabsSection = lazy(() => import("@/components/home/GenreTabsSection").then(m => ({ default: m.GenreTabsSection })));

// Dialogs - only loaded when opened
const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then(m => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() => import("@/components/music-recognition/MusicRecognitionDialog").then(m => ({ default: m.MusicRecognitionDialog })));
const AudioActionDialog = lazy(() => import("@/components/generate-form/AudioActionDialog").then(m => ({ default: m.AudioActionDialog })));

// Lightweight skeletons
const HeroSkeleton = () => (
  <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-background p-6 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-56" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-12 w-28" />
        <Skeleton className="h-12 w-28" />
        <Skeleton className="h-12 w-28" />
      </div>
    </div>
  </div>
);

const ToolsSkeleton = () => (
  <div className="grid grid-cols-2 gap-2">
    {[1, 2, 3, 4].map(i => (
      <Skeleton key={i} className="h-28 rounded-xl" />
    ))}
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
  const tracksSectionRef = useRef<HTMLDivElement>(null);

  // User journey state for personalized experience
  const { isNewUser } = useUserJourneyState();

  // Single optimized query for all public content
  const { data: publicContent, isLoading: contentLoading, refetch: refetchContent } = usePublicContentBatch();

  // Preload first 4 track cover images for faster perceived loading
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

  // Hero actions
  const handleRecord = useCallback(() => {
    hapticFeedback("light");
    setAudioDialogOpen(true);
  }, [hapticFeedback]);

  const handleUpload = useCallback(() => {
    hapticFeedback("light");
    setAudioDialogOpen(true);
  }, [hapticFeedback]);

  const handleCreate = useCallback(() => {
    hapticFeedback("light");
    setGenerateSheetOpen(true);
  }, [hapticFeedback]);

  const handleQuickInputSubmit = useCallback(() => {
    hapticFeedback("light");
    setGenerateSheetOpen(true);
  }, [hapticFeedback]);

  // Handler for Quick Start preset cards
  const handleQuickStartPreset = useCallback((preset: QuickStartPreset) => {
    hapticFeedback("medium");
    switch (preset) {
      case 'track':
        // Open generate sheet in custom mode for full track
        setGenerateSheetOpen(true);
        break;
      case 'riff':
        // Open generate sheet - could prefill with instrumental
        setGenerateSheetOpen(true);
        break;
      case 'cover':
        // Open audio dialog for cover/remix
        setAudioDialogOpen(true);
        break;
    }
  }, [hapticFeedback]);

  // Animation props - memoized
  const fadeInUp = useMemo(() => prefersReducedMotion 
    ? {} 
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
    [prefersReducedMotion]
  );

  return (
    <PullToRefreshWrapper 
      onRefresh={handleRefresh} 
      disabled={!isMobile}
      className="min-h-screen bg-background pb-24 relative overflow-hidden"
    >
      {/* Background gradient - simplified */}
      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-40 sm:w-64 h-40 sm:h-64 bg-generate/10 rounded-full blur-3xl" />
        </div>
      )}
      
      {/* Main content container - mobile-first spacing */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 sm:py-6 relative z-10">
        <SEOHead {...SEO_PRESETS.home} />
        
        {/* Header */}
        <HomeHeader
          userName={displayUser?.first_name || displayUser?.username?.split('@')[0]}
          userPhotoUrl={displayUser?.photo_url}
          onProfileClick={goToProfile}
        />

        {/* Bot Context Banner - shows context when navigating from Telegram bot */}
        <BotContextBanner />

        {/* Gamification Bar - for logged in users */}
        {user && (
          <Suspense fallback={null}>
            <motion.div className="mb-3" {...fadeInUp} transition={{ delay: 0.05 }}>
              <GamificationBar />
            </motion.div>
          </Suspense>
        )}

        {/* Loading state */}
        {contentLoading && !publicContent && (
          isMobile ? (
            <div className="space-y-4">
              <MobileHeroSkeleton />
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <HeroSkeleton />
              <ToolsSkeleton />
            </div>
          )
        )}

        {/* Hero Section - Personalized */}
        <Suspense fallback={<HeroSkeleton />}>
          <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.1 }}>
            {isNewUser ? (
              <FirstTimeHeroCard onCreateClick={handleCreate} />
            ) : (
              <HeroSectionPro 
                onRecord={handleRecord}
                onUpload={handleUpload}
                onCreate={handleCreate}
              />
            )}
          </motion.section>
        </Suspense>

        {/* New User Progress - only for newcomers */}
        {isNewUser && (
          <Suspense fallback={null}>
            <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.12 }}>
              <NewUserProgress />
            </motion.section>
          </Suspense>
        )}

        {/* Quick Start Cards - для быстрого старта */}
        {!isNewUser && (
          <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.12 }}>
            <QuickStartCards onPresetSelect={handleQuickStartPreset} />
          </motion.section>
        )}

        {/* Quick Input Bar - for returning users */}
        {!isNewUser && (
          <Suspense fallback={<Skeleton className="h-14 w-full rounded-lg" />}>
            <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.14 }}>
              <QuickInputBar onSubmit={handleQuickInputSubmit} />
            </motion.section>
          </Suspense>
        )}

        {/* Creator Tools Section - collapsible for returning users */}
        {!isNewUser && (
          <Suspense fallback={<ToolsSkeleton />}>
            <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.16 }}>
              <CollapsibleSection
                storageKey="home-creator-tools"
                title="Инструменты"
                icon={<Wrench className="w-3.5 h-3.5 text-primary" />}
                defaultCollapsed={false}
              >
                <CreatorToolsSection onRecordClick={handleRecord} />
              </CollapsibleSection>
            </motion.section>
          </Suspense>
        )}

        {/* Quick Play Section */}
        {publicContent?.popularTracks && publicContent.popularTracks.length > 0 && (
          <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
            <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.16 }}>
              <QuickPlaySection 
                tracks={publicContent.popularTracks} 
                isLoading={contentLoading}
              />
            </motion.section>
          </Suspense>
        )}

        {/* Popular Tracks - Primary content section */}
        <div ref={tracksSectionRef}>
          <Suspense fallback={isMobile ? <MobileSectionSkeleton /> : <GridSkeleton count={6} columns={2} />}>
            <motion.section className="mb-6 sm:mb-8" {...fadeInUp} transition={{ delay: 0.18 }}>
              <TracksGridSection
                title="🔥 Популярное"
                subtitle="Треки, которые слушают прямо сейчас"
                icon={TrendingUp}
                iconColor="text-emerald-400"
                iconGradient="from-emerald-500/20 to-teal-500/10"
                tracks={publicContent?.popularTracks || []}
                isLoading={contentLoading}
                maxTracks={isMobile ? 6 : 12}
                columns={isMobile ? 2 : 4}
                showMoreLink="/community?sort=popular"
                showMoreLabel="Смотреть все"
                onRemix={handleRemix}
              />
            </motion.section>
          </Suspense>
        </div>

        {/* New Tracks - Secondary content section */}
        <Suspense fallback={isMobile ? <MobileSectionSkeleton /> : <GridSkeleton count={4} columns={2} />}>
          <motion.section className="mb-6 sm:mb-8" {...fadeInUp} transition={{ delay: 0.2 }}>
            <TracksGridSection
              title="✨ Новинки"
              subtitle="Свежие треки от авторов сообщества"
              icon={Clock}
              iconColor="text-orange-400"
              iconGradient="from-orange-500/20 to-amber-500/10"
              tracks={publicContent?.recentTracks || []}
              isLoading={contentLoading}
              maxTracks={isMobile ? 6 : 12}
              columns={isMobile ? 2 : 4}
              showMoreLink="/community?sort=recent"
              showMoreLabel="Смотреть все"
              onRemix={handleRemix}
            />
          </motion.section>
        </Suspense>

        {/* Recent user tracks - for logged in users */}
        {user && (
          <LazySection className="mb-5" minHeight="80px" skipSuspense eager>
            <RecentTracksSection maxTracks={4} />
          </LazySection>
        )}

        {/* Genre Tabs - collapsible, personalized based on user preferences */}
        {publicContent?.allTracks && publicContent.allTracks.length > 0 && (
          <LazySection className="mb-5" minHeight="120px" skipSuspense>
            <CollapsibleSection
              storageKey="home-genre-tabs"
              title="По жанрам"
              icon={<Music2 className="w-3.5 h-3.5 text-primary" />}
              defaultCollapsed={true}
            >
              <GenreTabsSection
                tracks={publicContent.allTracks}
                isLoading={contentLoading}
                onRemix={handleRemix}
              />
            </CollapsibleSection>
          </LazySection>
        )}

        {/* Popular Creators - collapsible */}
        <LazySection className="mb-5" skipSuspense>
          <CollapsibleSection
            storageKey="home-creators"
            title="Популярные авторы"
            icon={<Users className="w-3.5 h-3.5 text-primary" />}
            defaultCollapsed={true}
          >
            <PopularCreatorsSection maxCreators={6} />
          </CollapsibleSection>
        </LazySection>

        {/* Invite Friends Banner - for logged in users */}
        {user && !isNewUser && (
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.25 }}>
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
