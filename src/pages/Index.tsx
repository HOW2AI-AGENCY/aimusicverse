import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import logo from "@/assets/logo.png";
import { usePublicContentBatch, getGenrePlaylists } from "@/hooks/usePublicContent";
import { HeroQuickActions } from "@/components/home/HeroQuickActions";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeSkeletonEnhanced } from "@/components/home/HomeSkeletonEnhanced";
import { LazySection, SectionSkeleton } from "@/components/lazy/LazySection";
import { motion, useReducedMotion } from '@/lib/motion';

// Critical above-the-fold components - loaded sync
import { CommunityNewTracksSection } from "@/components/home/CommunityNewTracksSection";

// Below-the-fold and conditional components - lazy loaded
const DailyCheckin = lazy(() => import("@/components/gamification/DailyCheckin").then(m => ({ default: m.DailyCheckin })));
const CompactStatsWidget = lazy(() => import("@/components/home/CompactStatsWidget").then(m => ({ default: m.CompactStatsWidget })));
const RecentTracksSection = lazy(() => import("@/components/home/RecentTracksSection").then(m => ({ default: m.RecentTracksSection })));
const UserProjectsSection = lazy(() => import("@/components/home/UserProjectsSection").then(m => ({ default: m.UserProjectsSection })));
const FollowingFeed = lazy(() => import("@/components/social/FollowingFeed").then(m => ({ default: m.FollowingFeed })));
const UnifiedDiscoverySection = lazy(() => import("@/components/home/UnifiedDiscoverySection").then(m => ({ default: m.UnifiedDiscoverySection })));
const AutoPlaylistsSection = lazy(() => import("@/components/home/AutoPlaylistsSection").then(m => ({ default: m.AutoPlaylistsSection })));
const PublicArtistsSection = lazy(() => import("@/components/home/PublicArtistsSection").then(m => ({ default: m.PublicArtistsSection })));
const FeaturedBlogBanners = lazy(() => import("@/components/home/FeaturedBlogBanners").then(m => ({ default: m.FeaturedBlogBanners })));
const PopularCreatorsSection = lazy(() => import("@/components/home/PopularCreatorsSection").then(m => ({ default: m.PopularCreatorsSection })));
const PublishedAlbumsSection = lazy(() => import("@/components/home/PublishedAlbumsSection").then(m => ({ default: m.PublishedAlbumsSection })));
const ProfessionalToolsHub = lazy(() => import("@/components/home/ProfessionalToolsHub").then(m => ({ default: m.ProfessionalToolsHub })));

// Dialogs - only loaded when opened
const GenerateSheet = lazy(() => import("@/components/GenerateSheet").then(m => ({ default: m.GenerateSheet })));
const MusicRecognitionDialog = lazy(() => import("@/components/music-recognition/MusicRecognitionDialog").then(m => ({ default: m.MusicRecognitionDialog })));
const QuickProjectSheet = lazy(() => import("@/components/project/QuickProjectSheet").then(m => ({ default: m.QuickProjectSheet })));
const SubscriptionFeatureAnnouncement = lazy(() => import("@/components/announcements/SubscriptionFeatureAnnouncement").then(m => ({ default: m.SubscriptionFeatureAnnouncement })));

const Index = () => {
  const { user } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);
  const [quickProjectOpen, setQuickProjectOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Single optimized query for all public content
  const { data: publicContent, isLoading: contentLoading } = usePublicContentBatch();
  
  // Compute auto-playlists from the same data
  const autoPlaylists = useMemo(() => 
    publicContent?.allTracks ? getGenrePlaylists(publicContent.allTracks) : [],
    [publicContent?.allTracks]
  );

  // Use profile data from DB if available, fallback to Telegram context
  const displayUser = profile || telegramUser;

  // Handle navigation state for opening GenerateSheet
  useEffect(() => {
    let mounted = true;
    
    const handleNavigationState = () => {
      if (location.state?.openGenerate && mounted) {
        setGenerateSheetOpen(true);
        navigate(location.pathname, { replace: true, state: {} });
      }
    };
    
    handleNavigationState();
    
    return () => {
      mounted = false;
    };
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
    // Navigate to public profile page if user is logged in
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


  // Animation props - disabled when reduced motion is preferred
  const fadeInUp = prefersReducedMotion 
    ? {} 
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
  
  const fadeIn = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 } };

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
        {/* Background gradient - hidden on reduced motion for performance */}
        {!prefersReducedMotion && (
          <div className="fixed inset-0 pointer-events-none opacity-40">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/12 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-generate/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>
        )}
        
        <div className="container max-w-6xl mx-auto pb-4 sm:px-4 sm:py-6 relative z-10">
          {/* Unified Header Component */}
          <HomeHeader
            userName={displayUser?.first_name || displayUser?.username?.split('@')[0]}
            userPhotoUrl={displayUser?.photo_url}
            onProfileClick={goToProfile}
          />

          {/* Compact Gamification - Single row */}
          {user && (
            <Suspense fallback={null}>
              <motion.div 
                className="mb-3 space-y-2"
                {...fadeInUp}
                transition={{ delay: 0.05, duration: 0.25 }}
              >
                <DailyCheckin />
                <CompactStatsWidget />
              </motion.div>
            </Suspense>
          )}

          {/* Loading Skeleton */}
          {contentLoading && !publicContent && (
            <HomeSkeletonEnhanced />
          )}

          {/* Hero Quick Actions - Primary CTA */}
          <motion.section 
            className="mb-4 sm:mb-5"
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <HeroQuickActions onGenerateClick={() => setGenerateSheetOpen(true)} />
          </motion.section>

          {/* Community New Tracks Section */}
          <motion.section 
            className="mb-4 sm:mb-5"
            {...fadeInUp}
            transition={{ delay: 0.12, duration: 0.3 }}
          >
            <CommunityNewTracksSection
              tracks={publicContent?.recentTracks || []}
              isLoading={contentLoading}
              onRemix={handleRemix}
              maxTracks={8}
            />
          </motion.section>

          {/* Recent Tracks for logged-in users */}
          {user && (
            <Suspense fallback={<SectionSkeleton height="120px" />}>
              <motion.section
                className="mb-4 sm:mb-5"
                {...fadeInUp}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <RecentTracksSection maxTracks={4} />
              </motion.section>
            </Suspense>
          )}

          {/* User Projects Section */}
          {user && (
            <Suspense fallback={<SectionSkeleton height="120px" />}>
              <motion.section
                className="mb-4 sm:mb-5"
                {...fadeInUp}
                transition={{ delay: 0.17, duration: 0.3 }}
              >
                <UserProjectsSection />
              </motion.section>
            </Suspense>
          )}

          {/* Following Feed - Tracks from followed users and liked creators */}
          {user && (
            <LazySection className="mb-4 sm:mb-5" fallback={<SectionSkeleton height="160px" />}>
              <FollowingFeed />
            </LazySection>
          )}

          {/* Unified Discovery Section - Main content */}
          <Suspense fallback={<SectionSkeleton height="200px" />}>
            <motion.section 
              className="mb-4 sm:mb-5"
              {...fadeIn}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <UnifiedDiscoverySection
                featuredTracks={publicContent?.featuredTracks || []}
                recentTracks={publicContent?.recentTracks || []}
                popularTracks={publicContent?.popularTracks || []}
                isLoading={contentLoading}
                onRemix={handleRemix}
              />
            </motion.section>
          </Suspense>

          {/* Auto Playlists by Genre */}
          <Suspense fallback={<SectionSkeleton height="160px" />}>
            <motion.section 
              className="mb-4 sm:mb-5"
              {...fadeIn}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <AutoPlaylistsSection 
                playlists={autoPlaylists} 
                isLoading={contentLoading} 
              />
            </motion.section>
          </Suspense>

          {/* Popular Creators Section - Lazy loaded */}
          <LazySection 
            className="mb-4 sm:mb-5"
            fallback={<SectionSkeleton height="160px" />}
          >
            <PopularCreatorsSection maxCreators={8} />
          </LazySection>

          {/* Featured Blog Banners */}
          <LazySection className="mb-4 sm:mb-5" fallback={<SectionSkeleton height="100px" />}>
            <FeaturedBlogBanners />
          </LazySection>

          {/* Public AI Artists Section */}
          <LazySection className="mb-4 sm:mb-5" fallback={<SectionSkeleton height="160px" />}>
            <PublicArtistsSection />
          </LazySection>

          {/* Published Albums Section - Lazy loaded */}
          <LazySection 
            className="mb-4 sm:mb-5"
            fallback={<SectionSkeleton height="180px" />}
          >
            <PublishedAlbumsSection />
          </LazySection>

          {/* Professional Tools Hub - Desktop only, Lazy loaded */}
          {user && (
            <LazySection 
              className="hidden sm:block mb-5"
              fallback={<SectionSkeleton height="200px" />}
            >
              <ProfessionalToolsHub />
            </LazySection>
          )}

        </div>

        {/* Dialogs - only render when open */}
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
        {quickProjectOpen && (
          <Suspense fallback={null}>
            <QuickProjectSheet open={quickProjectOpen} onOpenChange={setQuickProjectOpen} />
          </Suspense>
        )}
        
        {/* Feature announcement for subscriptions */}
        <Suspense fallback={null}>
          <SubscriptionFeatureAnnouncement />
        </Suspense>
    </div>
  );
};

export default Index;
