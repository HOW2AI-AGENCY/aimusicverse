import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { NotificationBadge } from "@/components/NotificationBadge";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import logo from "@/assets/logo.png";
import { usePublicContentOptimized, getGenrePlaylists } from "@/hooks/usePublicContent";
import { PublicArtistsSection } from "@/components/home/PublicArtistsSection";
import { AutoPlaylistsSectionOptimized } from "@/components/home/AutoPlaylistsSectionOptimized";
import { UnifiedDiscoverySection } from "@/components/home/UnifiedDiscoverySection";
import { CommunityNewTracksSection } from "@/components/home/CommunityNewTracksSection";
import { HeroQuickActions } from "@/components/home/HeroQuickActions";
import { RecentTracksSection } from "@/components/home/RecentTracksSection";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { DailyCheckin } from "@/components/gamification/DailyCheckin";
import { CompactStatsWidget } from "@/components/home/CompactStatsWidget";
import { FeaturedBlogBanners } from "@/components/home/FeaturedBlogBanners";
import { UserProjectsSection } from "@/components/home/UserProjectsSection";
import { FollowingFeed } from "@/components/social/FollowingFeed";
import { SubscriptionFeatureAnnouncement } from "@/components/announcements/SubscriptionFeatureAnnouncement";
import { GenerateSheet } from "@/components/GenerateSheet";
import { MusicRecognitionDialog } from "@/components/music-recognition/MusicRecognitionDialog";
import { HomeSkeletonEnhanced } from "@/components/home/HomeSkeletonEnhanced";
import { LazySection, SectionSkeleton } from "@/components/lazy/LazySection";
import { QuickProjectSheet } from "@/components/project/QuickProjectSheet";
import { useTelegramMainButton } from "@/hooks/telegram/useTelegramMainButton";
import { motion } from '@/lib/motion';

// Lazy loaded components for below-the-fold content
const PopularCreatorsSection = lazy(() => import("@/components/home/PopularCreatorsSection").then(m => ({ default: m.PopularCreatorsSection })));
const PublishedAlbumsSection = lazy(() => import("@/components/home/PublishedAlbumsSection").then(m => ({ default: m.PublishedAlbumsSection })));
const ProfessionalToolsHub = lazy(() => import("@/components/home/ProfessionalToolsHub").then(m => ({ default: m.ProfessionalToolsHub })));

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

  // Single optimized query for all public content
  const { data: publicContent, isLoading: contentLoading } = usePublicContentOptimized();
  
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

  // Telegram MainButton - primary CTA
  const { shouldShowUIButton } = useTelegramMainButton({
    text: 'СОЗДАТЬ МУЗЫКУ',
    onClick: () => setGenerateSheetOpen(true),
    visible: !generateSheetOpen && !quickProjectOpen,
  });

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
        {/* Enhanced background gradient with better depth */}
        <div className="fixed inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/12 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-generate/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 pt-2 pb-4 sm:py-6 relative z-10">
          {/* Enhanced Compact Header with glass effect */}
          <motion.header 
            className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2 backdrop-blur-strong bg-background/85 border-b border-border/50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <img src={logo} alt="MusicVerse AI" className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl shadow-soft" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gradient leading-tight">MusicVerse AI</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Создай свою музыку</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-1.5">
              <NotificationBadge />
              <motion.button
                onClick={goToProfile}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-primary/30 transition-all touch-manipulation"
                whileTap={{ scale: 0.95 }}
              >
                {displayUser?.photo_url ? (
                  <img
                    src={displayUser.photo_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.button>
            </div>
          </motion.header>

          {/* Welcome Section - Mobile optimized */}
          <motion.div 
            className="mb-3 sm:mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WelcomeSection 
              userName={displayUser?.first_name || displayUser?.username?.split('@')[0]} 
            />
          </motion.div>

          {/* Compact Gamification - Single row */}
          {user && (
            <motion.div 
              className="mb-3 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.25 }}
            >
              <DailyCheckin />
              <CompactStatsWidget />
            </motion.div>
          )}

          {/* Loading Skeleton */}
          {contentLoading && !publicContent && (
            <HomeSkeletonEnhanced />
          )}

          {/* Hero Quick Actions - Primary CTA */}
          <motion.section 
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <HeroQuickActions onGenerateClick={() => setGenerateSheetOpen(true)} />
          </motion.section>

          {/* Community New Tracks Section */}
          <motion.section 
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            <motion.section
              className="mb-4 sm:mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <RecentTracksSection maxTracks={4} />
            </motion.section>
          )}

          {/* User Projects Section */}
          {user && (
            <motion.section
              className="mb-4 sm:mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17, duration: 0.3 }}
            >
              <UserProjectsSection />
            </motion.section>
          )}

          {/* Following Feed - Tracks from followed users and liked creators */}
          {user && (
            <motion.section
              className="mb-4 sm:mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.19, duration: 0.3 }}
            >
              <FollowingFeed />
            </motion.section>
          )}

          {/* Unified Discovery Section - Main content */}
          <motion.section 
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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

          {/* Auto Playlists by Genre */}
          <motion.section 
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <AutoPlaylistsSectionOptimized 
              playlists={autoPlaylists} 
              isLoading={contentLoading} 
            />
          </motion.section>

          {/* Popular Creators Section - Lazy loaded */}
          <LazySection 
            className="mb-4 sm:mb-5"
            fallback={<SectionSkeleton height="160px" />}
          >
            <PopularCreatorsSection maxCreators={8} />
          </LazySection>

          {/* Featured Blog Banners */}
          <motion.section
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32, duration: 0.3 }}
          >
            <FeaturedBlogBanners />
          </motion.section>

          {/* Public AI Artists Section */}
          <motion.section
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <PublicArtistsSection />
          </motion.section>

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

        <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
        <MusicRecognitionDialog open={recognitionDialogOpen} onOpenChange={setRecognitionDialogOpen} />
        <QuickProjectSheet open={quickProjectOpen} onOpenChange={setQuickProjectOpen} />
        
        {/* Feature announcement for subscriptions */}
        <SubscriptionFeatureAnnouncement />
    </div>
  );
};

export default Index;
