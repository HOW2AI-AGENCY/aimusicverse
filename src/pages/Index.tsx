import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import { usePublicContentBatch, getGenrePlaylists } from "@/hooks/usePublicContent";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSkeletonEnhanced } from "@/components/home/HomeSkeletonEnhanced";
import { LazySection, SectionSkeleton } from "@/components/lazy/LazySection";
import { motion, useReducedMotion } from '@/lib/motion';
import { SEOHead, SEO_PRESETS } from "@/components/SEOHead";
import { QuickCreatePreset } from "@/constants/quickCreatePresets";
import { PullToRefreshWrapper } from "@/components/library/PullToRefreshWrapper";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, Clock } from "lucide-react";

// Core components - not lazy loaded for critical content
import { TracksGridSection } from "@/components/home/TracksGridSection";
import { MainActionsBar } from "@/components/home/MainActionsBar";
import { GenreTracksRow } from "@/components/home/GenreTracksRow";
import { CreateCTABanner } from "@/components/home/CreateCTABanner";
import { FeaturedBlogBanners } from "@/components/home/FeaturedBlogBanners";

// Lazy loaded components
const GamificationBar = lazy(() => import("@/components/gamification/GamificationBar").then(m => ({ default: m.GamificationBar })));
const RecentTracksSection = lazy(() => import("@/components/home/RecentTracksSection").then(m => ({ default: m.RecentTracksSection })));

const AutoPlaylistsSection = lazy(() => import("@/components/home/AutoPlaylistsSection").then(m => ({ default: m.AutoPlaylistsSection })));
const PopularCreatorsSection = lazy(() => import("@/components/home/PopularCreatorsSection").then(m => ({ default: m.PopularCreatorsSection })));
const PublicArtistsSection = lazy(() => import("@/components/home/PublicArtistsSection").then(m => ({ default: m.PublicArtistsSection })));
const FeaturedProjectsBanner = lazy(() => import("@/components/home/FeaturedProjectsBanner").then(m => ({ default: m.FeaturedProjectsBanner })));
const EngagementBanner = lazy(() => import("@/components/home/EngagementBanner").then(m => ({ default: m.EngagementBanner })));

// Dialogs - only loaded when opened
const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then(m => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() => import("@/components/music-recognition/MusicRecognitionDialog").then(m => ({ default: m.MusicRecognitionDialog })));

// Genre configurations (based on computed_genre data in DB)
const GENRE_SECTIONS = [
  { genre: 'hiphop', label: 'Хип-Хоп', color: 'violet' },
  { genre: 'pop', label: 'Поп', color: 'rose' },
  { genre: 'rock', label: 'Рок', color: 'orange' },
  { genre: 'folk', label: 'Фолк', color: 'emerald' },
  { genre: 'jazz', label: 'Джаз', color: 'primary' },
  { genre: 'electronic', label: 'Электроника', color: 'cyan' },
  { genre: 'ambient', label: 'Эмбиент', color: 'emerald' },
] as const;

const Index = () => {
  const { user } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
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

  // Animation props
  const fadeInUp = prefersReducedMotion 
    ? {} 
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

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
          <Suspense fallback={<div className="h-14 bg-card/40 animate-pulse rounded-2xl mb-3" />}>
            <motion.div className="mb-3" {...fadeInUp} transition={{ delay: 0.05 }}>
              <GamificationBar />
            </motion.div>
          </Suspense>
        )}

        {/* Loading Skeleton */}
        {contentLoading && !publicContent && <HomeSkeletonEnhanced />}

        {/* CTA for guests */}
        {!user && (
          <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.1 }}>
            <CreateCTABanner onGenerateClick={() => setGenerateSheetOpen(true)} />
          </motion.section>
        )}

        {/* Featured Projects Banner */}
        <Suspense fallback={<div className="w-full h-[180px] rounded-2xl bg-card/40 animate-pulse mb-4" />}>
          <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.12 }}>
            <FeaturedProjectsBanner />
          </motion.section>
        </Suspense>

        {/* Main Actions Bar (Audio/Lyrics/Projects) */}
        <motion.section className="mb-4" {...fadeInUp} transition={{ delay: 0.14 }}>
          <MainActionsBar />
        </motion.section>

        {/* Blog Articles */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.16 }}>
          <FeaturedBlogBanners />
        </motion.section>

        {/* Popular Tracks - Main section */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.18 }}>
          <TracksGridSection
            title="Популярное"
            subtitle="Треки, которые слушают больше всего"
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

        {/* New Tracks */}
        <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.2 }}>
          <TracksGridSection
            title="Новинки"
            subtitle="Свежие треки от сообщества"
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

        {/* CTA for logged in users */}
        {user && (
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.22 }}>
            <CreateCTABanner 
              onGenerateClick={() => setGenerateSheetOpen(true)} 
              variant="minimal"
            />
          </motion.section>
        )}

        {/* Recent user tracks */}
        {user && (
          <Suspense fallback={<SectionSkeleton height="120px" />}>
            <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.24 }}>
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
                transition={{ delay: 0.26 + index * 0.04 }}
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
        <Suspense fallback={<SectionSkeleton height="160px" />}>
          <motion.section className="mb-5" {...fadeInUp} transition={{ delay: 0.4 }}>
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
        <LazySection className="mb-5" fallback={<SectionSkeleton height="160px" />}>
          <PopularCreatorsSection maxCreators={8} />
        </LazySection>

        {/* AI Artists */}
        <LazySection className="mb-5" fallback={<SectionSkeleton height="160px" />}>
          <PublicArtistsSection />
        </LazySection>
      </div>

      {/* Dialogs */}
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
    </PullToRefreshWrapper>
  );
};

export default Index;
