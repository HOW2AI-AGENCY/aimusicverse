import { useState, useEffect, useMemo, lazy, Suspense, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import { usePublicContentBatch, getGenrePlaylists } from "@/hooks/usePublicContent";
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

// Core components - not lazy loaded for critical content
import { TracksGridSection } from "@/components/home/TracksGridSection";
import { MainActionsBar } from "@/components/home/MainActionsBar";
import { GenreTracksRow } from "@/components/home/GenreTracksRow";
import { FeaturedBlogBanners } from "@/components/home/FeaturedBlogBanners";
import { HeroSectionPro } from "@/components/home/HeroSectionPro";
import { CreatorToolsSection } from "@/components/home/CreatorToolsSection";
import { QuickInputBar } from "@/components/home/QuickInputBar";
import { FeatureShowcase } from "@/components/home/FeatureShowcase";
import { QuickPlaySection } from "@/components/home/QuickPlaySection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { EngagementHint } from "@/components/home/EngagementHint";

// Lazy loaded components
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

// Genre configurations (based on computed_genre data in DB)
const GENRE_SECTIONS = [
  { genre: 'hiphop', label: 'Хип-Хоп', color: 'violet' },
  { genre: 'pop', label: 'Поп', color: 'rose' },
  { genre: 'rock', label: 'Рок', color: 'orange' },
  { genre: 'electronic', label: 'Электроника', color: 'cyan' },
] as const;

const Index = () => {
  const { user } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [audioDialogMode, setAudioDialogMode] = useState<'record' | 'upload'>('record');
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

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

  const goToProfile = () => {
    hapticFeedback("light");
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    } else {
      navigate("/profile");
    }
  };

  const handleRemix = (trackId: string) => {
    hapticFeedback("light");
    navigate(`/generate?remix=${trackId}`);
  };

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await refetchContent();
  }, [refetchContent]);

  // Hero actions
  const handleRecord = useCallback(() => {
    hapticFeedback("light");
    setAudioDialogMode('record');
    setAudioDialogOpen(true);
  }, [hapticFeedback]);

  const handleUpload = useCallback(() => {
    hapticFeedback("light");
    setAudioDialogMode('upload');
    setAudioDialogOpen(true);
  }, [hapticFeedback]);

  const handleCreate = useCallback(() => {
    hapticFeedback("light");
    setGeneratePrompt('');
    setGenerateSheetOpen(true);
  }, [hapticFeedback]);

  // Quick input submit
  const handleQuickInputSubmit = useCallback((prompt: string) => {
    hapticFeedback("light");
    setGeneratePrompt(prompt);
    setGenerateSheetOpen(true);
  }, [hapticFeedback]);

  // Animation props
  const fadeInUp = prefersReducedMotion 
    ? {} 
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

  // Scroll to tracks section
  const tracksSectionRef = useRef<HTMLDivElement>(null);

  return (
    <PullToRefreshWrapper 
      onRefresh={handleRefresh} 
      disabled={!isMobile}
      className="min-h-screen bg-background pb-20 relative overflow-hidden"
    >
      {/* Background gradient */}
      {!prefersReducedMotion && (
        <div className="fixed inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/12 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-generate/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-4 sm:py-6 relative z-10">
        {/* SEO */}
        <SEOHead {...SEO_PRESETS.home} />
        
        {/* Header */}
        <HomeHeader
          userName={displayUser?.first_name || displayUser?.username?.split('@')[0]}
          userPhotoUrl={displayUser?.photo_url}
          onProfileClick={goToProfile}
        />

        {/* Gamification Bar - logged in users */}
        {user && (
          <Suspense fallback={null}>
            <motion.div className="mb-3" {...fadeInUp} transition={{ delay: 0.05 }}>
              <GamificationBar />
            </motion.div>
          </Suspense>
        )}

        {/* Loading Skeleton */}
        {contentLoading && !publicContent && (
          <div className="space-y-5">
            <UnifiedSectionSkeleton contentType="grid" gridCount={4} gridColumns={2} />
            <UnifiedSectionSkeleton contentType="carousel" />
          </div>
        )}

        {/* Hero Section Pro - главный баннер */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.1 }}>
          <HeroSectionPro 
            onRecord={handleRecord}
            onUpload={handleUpload}
            onCreate={handleCreate}
          />
        </motion.section>

        {/* Quick Input Bar - быстрый ввод промпта */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.12 }}>
          <QuickInputBar onSubmit={handleQuickInputSubmit} />
        </motion.section>

        {/* Creator Tools Section - инструменты */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.14 }}>
          <CreatorToolsSection onRecordClick={handleRecord} />
        </motion.section>

        {/* Quick Play Section - начни слушать сразу */}
        {!contentLoading && publicContent?.popularTracks && publicContent.popularTracks.length > 0 && (
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.16 }}>
            <QuickPlaySection 
              tracks={publicContent.popularTracks} 
              isLoading={contentLoading}
            />
          </motion.section>
        )}

        {/* Feature Showcase - возможности платформы */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.18 }}>
          <FeatureShowcase />
        </motion.section>

        {/* Social Proof - статистика для доверия (только для гостей) */}
        {!user && (
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.2 }}>
            <SocialProofSection />
          </motion.section>
        )}

        {/* Featured Projects Banner */}
        <FeatureErrorBoundary featureName="Featured Projects Banner">
          <Suspense fallback={null}>
            <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.22 }}>
              <FeaturedProjectsBanner />
            </motion.section>
          </Suspense>
        </FeatureErrorBoundary>

        {/* Blog Articles */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.24 }}>
          <FeaturedBlogBanners />
        </motion.section>

        {/* Engagement Hint - подсказка для вовлечения */}
        <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.26 }}>
          <EngagementHint variant={user ? "play" : "like"} />
        </motion.section>

        {/* Popular Tracks - Main section */}
        <div ref={tracksSectionRef}>
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.28 }}>
            <TracksGridSection
              title="🔥 Популярное"
              subtitle="Треки, которые слушают больше всего — начни с них!"
              icon={TrendingUp}
              iconColor="text-emerald-400"
              iconGradient="from-emerald-500/20 to-teal-500/10"
              tracks={publicContent?.popularTracks || []}
              isLoading={contentLoading}
              maxTracks={12}
              columns={4}
              showMoreLink="/community?sort=popular"
              showMoreLabel="Все популярные"
              onRemix={handleRemix}
            />
          </motion.section>
        </div>

        {/* New Tracks */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.3 }}>
          <TracksGridSection
            title="✨ Новинки"
            subtitle="Свежие треки от сообщества — оцени первым!"
            icon={Clock}
            iconColor="text-orange-400"
            iconGradient="from-orange-500/20 to-amber-500/10"
            tracks={publicContent?.recentTracks || []}
            isLoading={contentLoading}
            maxTracks={12}
            columns={4}
            showMoreLink="/community?sort=recent"
            showMoreLabel="Все новинки"
            onRemix={handleRemix}
          />
        </motion.section>

        {/* Recent user tracks */}
        {user && (
          <Suspense fallback={null}>
            <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.32 }}>
              <RecentTracksSection maxTracks={4} />
            </motion.section>
          </Suspense>
        )}

        {/* Genre Rows */}
        {publicContent?.allTracks && publicContent.allTracks.length > 0 && (
          <>
            {GENRE_SECTIONS.map((genre, index) => (
              <motion.section 
                key={genre.genre} 
                className="mb-4"
                {...fadeInUp}
                transition={{ delay: 0.34 + index * 0.04 }}
              >
                <GenreTracksRow
                  genre={genre.genre}
                  genreLabel={genre.label}
                  tracks={publicContent.allTracks}
                  color={genre.color}
                  onRemix={handleRemix}
                />
              </motion.section>
            ))}
          </>
        )}

        {/* Auto Playlists by Genre */}
        <Suspense fallback={null}>
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.5 }}>
            <AutoPlaylistsSection 
              playlists={autoPlaylists} 
              isLoading={contentLoading} 
            />
          </motion.section>
        </Suspense>

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

      {/* Dialogs */}
      {generateSheetOpen && (
        <Suspense fallback={null}>
          <GenerateSheet 
            open={generateSheetOpen} 
            onOpenChange={setGenerateSheetOpen}
          />
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
            onAudioSelected={() => {
              // Handle audio selection - will be used in generation
              setAudioDialogOpen(false);
            }}
          />
        </Suspense>
      )}
    </PullToRefreshWrapper>
  );
};

export default Index;
