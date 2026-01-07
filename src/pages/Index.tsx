import { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import { usePublicContentBatch, getGenrePlaylists } from "@/hooks/usePublicContent";
import { useUserJourneyState } from "@/hooks/useUserJourneyState";
import { HomeHeader } from "@/components/home/HomeHeader";
import { SectionSkeleton as UnifiedSectionSkeleton, GridSkeleton } from "@/components/ui/skeleton-components";
import { LazySection } from "@/components/lazy/LazySection";
import { motion, useReducedMotion } from '@/lib/motion';
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, Clock } from "lucide-react";
import { lazyWithRetry } from "@/lib/performance";
import { FeatureErrorBoundary } from "@/components/ui/feature-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

// Critical path - minimal imports for first paint
import { TracksGridSection } from "@/components/home/TracksGridSection";

// Lazy loaded - above fold but can wait
const HeroSectionPro = lazy(() => import("@/components/home/HeroSectionPro").then(m => ({ default: m.HeroSectionPro })));
const FirstTimeHeroCard = lazy(() => import("@/components/home/FirstTimeHeroCard").then(m => ({ default: m.FirstTimeHeroCard })));
const NewUserProgress = lazy(() => import("@/components/home/NewUserProgress").then(m => ({ default: m.NewUserProgress })));
const QuickInputBar = lazy(() => import("@/components/home/QuickInputBar").then(m => ({ default: m.QuickInputBar })));
const CreatorToolsSection = lazy(() => import("@/components/home/CreatorToolsSection").then(m => ({ default: m.CreatorToolsSection })));

// Lazy loaded - below fold
const QuickPlaySection = lazy(() => import("@/components/home/QuickPlaySection").then(m => ({ default: m.QuickPlaySection })));
const FeatureShowcase = lazy(() => import("@/components/home/FeatureShowcase").then(m => ({ default: m.FeatureShowcase })));
const SocialProofSection = lazy(() => import("@/components/home/SocialProofSection").then(m => ({ default: m.SocialProofSection })));
const EngagementHint = lazy(() => import("@/components/home/EngagementHint").then(m => ({ default: m.EngagementHint })));
const GenreTracksRow = lazy(() => import("@/components/home/GenreTracksRow").then(m => ({ default: m.GenreTracksRow })));
const FeaturedBlogBanners = lazy(() => import("@/components/home/FeaturedBlogBanners").then(m => ({ default: m.FeaturedBlogBanners })));
const GamificationBar = lazy(() => import("@/components/gamification/GamificationBar").then(m => ({ default: m.GamificationBar })));
const RecentTracksSection = lazy(() => import("@/components/home/RecentTracksSection").then(m => ({ default: m.RecentTracksSection })));
const AutoPlaylistsSection = lazy(() => import("@/components/home/AutoPlaylistsSection").then(m => ({ default: m.AutoPlaylistsSection })));
const PopularCreatorsSection = lazy(() => import("@/components/home/PopularCreatorsSection").then(m => ({ default: m.PopularCreatorsSection })));
const PublicArtistsSection = lazy(() => import("@/components/home/PublicArtistsSection").then(m => ({ default: m.PublicArtistsSection })));
const FeaturedProjectsBanner = lazyWithRetry(() => import("@/components/home/FeaturedProjectsBanner").then(m => ({ default: m.FeaturedProjectsBanner })));
const EngagementBanner = lazy(() => import("@/components/home/EngagementBanner").then(m => ({ default: m.EngagementBanner })));

// Dialogs - only loaded when opened
const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then(m => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() => import("@/components/music-recognition/MusicRecognitionDialog").then(m => ({ default: m.MusicRecognitionDialog })));
const AudioActionDialog = lazy(() => import("@/components/generate-form/AudioActionDialog").then(m => ({ default: m.AudioActionDialog })));

// Genre configurations
const GENRE_SECTIONS = [
  { genre: 'hiphop', label: 'Хип-Хоп', color: 'violet' },
  { genre: 'pop', label: 'Поп', color: 'rose' },
  { genre: 'rock', label: 'Рок', color: 'orange' },
  { genre: 'electronic', label: 'Электроника', color: 'cyan' },
] as const;

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
  const { journeyPhase, isNewUser, markTrackPlayed } = useUserJourneyState();

  // Single optimized query for all public content
  const { data: publicContent, isLoading: contentLoading, refetch: refetchContent } = usePublicContentBatch();
  
  // Compute auto-playlists from the same data
  const autoPlaylists = useMemo(() => 
    publicContent?.allTracks ? getGenrePlaylists(publicContent.allTracks) : [],
    [publicContent?.allTracks]
  );

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

  const handleQuickInputSubmit = useCallback((prompt: string) => {
    hapticFeedback("light");
    setGenerateSheetOpen(true);
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
      className="min-h-screen bg-background pb-20 relative overflow-hidden"
    >
      {/* Background gradient - simplified */}
      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-generate/10 rounded-full blur-3xl" />
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-4 sm:py-6 relative z-10">
        <SEOHead {...SEO_PRESETS.home} />
        
        {/* Header - critical path */}
        <HomeHeader
          userName={displayUser?.first_name || displayUser?.username?.split('@')[0]}
          userPhotoUrl={displayUser?.photo_url}
          onProfileClick={goToProfile}
        />

        {/* Gamification Bar */}
        {user && (
          <Suspense fallback={null}>
            <motion.div className="mb-3" {...fadeInUp} transition={{ delay: 0.05 }}>
              <GamificationBar />
            </motion.div>
          </Suspense>
        )}

        {/* Loading state */}
        {contentLoading && !publicContent && (
          <div className="space-y-4">
            <HeroSkeleton />
            <ToolsSkeleton />
          </div>
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

        {/* Quick Input Bar - hide for new users (already have CTA in FirstTimeHeroCard) */}
        {!isNewUser && (
          <Suspense fallback={<Skeleton className="h-14 w-full rounded-lg" />}>
            <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.12 }}>
              <QuickInputBar onSubmit={handleQuickInputSubmit} />
            </motion.section>
          </Suspense>
        )}

        {/* Creator Tools Section - simplified for new users */}
        {!isNewUser && (
          <Suspense fallback={<ToolsSkeleton />}>
            <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.14 }}>
              <CreatorToolsSection onRecordClick={handleRecord} />
            </motion.section>
          </Suspense>
        )}

        {/* Quick Play Section - always show, eager load on mobile */}
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

        {/* Feature Showcase - hide for new users to reduce cognitive load */}
        {!isNewUser && (
          <LazySection className="mb-5" minHeight="150px" rootMargin="100px">
            <FeatureShowcase />
          </LazySection>
        )}

        {/* Social Proof - only for guests */}
        {!user && (
          <LazySection className="mb-5" minHeight="80px" rootMargin="100px">
            <SocialProofSection />
          </LazySection>
        )}

        {/* Featured Projects Banner */}
        <FeatureErrorBoundary featureName="Featured Projects">
          <LazySection className="mb-4" minHeight="100px">
            <FeaturedProjectsBanner />
          </LazySection>
        </FeatureErrorBoundary>

        {/* Blog Articles */}
        <LazySection className="mb-5" minHeight="100px">
          <FeaturedBlogBanners />
        </LazySection>

        {/* Engagement Hint */}
        <LazySection className="mb-4" minHeight="40px">
          <EngagementHint variant={user ? "play" : "like"} />
        </LazySection>

        {/* Popular Tracks - Main section - eager load */}
        <div ref={tracksSectionRef}>
          <Suspense fallback={<GridSkeleton count={8} columns={2} />}>
            <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.2 }}>
              <TracksGridSection
                title="🔥 Популярное"
                subtitle="Треки, которые слушают больше всего"
                icon={TrendingUp}
                iconColor="text-emerald-400"
                iconGradient="from-emerald-500/20 to-teal-500/10"
                tracks={publicContent?.popularTracks || []}
                isLoading={contentLoading}
                maxTracks={isMobile ? 6 : 12}
                columns={isMobile ? 2 : 4}
                showMoreLink="/community?sort=popular"
                showMoreLabel="Все популярные"
                onRemix={handleRemix}
              />
            </motion.section>
          </Suspense>
        </div>

        {/* New Tracks - eager load */}
        <Suspense fallback={<GridSkeleton count={6} columns={2} />}>
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.22 }}>
            <TracksGridSection
              title="✨ Новинки"
              subtitle="Свежие треки от сообщества"
              icon={Clock}
              iconColor="text-orange-400"
              iconGradient="from-orange-500/20 to-amber-500/10"
              tracks={publicContent?.recentTracks || []}
              isLoading={contentLoading}
              maxTracks={isMobile ? 6 : 12}
              columns={isMobile ? 2 : 4}
              showMoreLink="/community?sort=recent"
              showMoreLabel="Все новинки"
              onRemix={handleRemix}
            />
          </motion.section>
        </Suspense>

        {/* Recent user tracks */}
        {user && (
          <LazySection className="mb-5" minHeight="150px">
            <RecentTracksSection maxTracks={4} />
          </LazySection>
        )}

        {/* Genre Rows - show fewer for new users */}
        {publicContent?.allTracks && publicContent.allTracks.length > 0 && (
          <>
            {GENRE_SECTIONS.slice(0, isNewUser ? 2 : GENRE_SECTIONS.length).map((genre) => (
              <LazySection key={genre.genre} className="mb-4" minHeight="120px">
                <GenreTracksRow
                  genre={genre.genre}
                  genreLabel={genre.label}
                  tracks={publicContent.allTracks}
                  color={genre.color}
                  onRemix={handleRemix}
                />
              </LazySection>
            ))}
          </>
        )}

        {/* Auto Playlists - hide for new users */}
        {!isNewUser && (
          <LazySection className="mb-5" minHeight="120px">
            <AutoPlaylistsSection 
              playlists={autoPlaylists} 
              isLoading={contentLoading} 
            />
          </LazySection>
        )}

        {/* Engagement Banner for guests */}
        {!user && (
          <LazySection className="mb-5" fallback={null}>
            <EngagementBanner type="follow_creators" />
          </LazySection>
        )}

        {/* Popular Creators */}
        <LazySection className="mb-5" fallback={null}>
          <PopularCreatorsSection maxCreators={8} />
        </LazySection>

        {/* AI Artists */}
        <LazySection className="mb-5" fallback={null}>
          <PublicArtistsSection />
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
  );
};

export default Index;
