import { useState, useEffect, useMemo } from "react";
import { NotificationBadge } from "@/components/NotificationBadge";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import logo from "@/assets/logo.png";
import { usePublicContentOptimized, getGenrePlaylists } from "@/hooks/usePublicContentOptimized";
import { PublicArtistsSection } from "@/components/home/PublicArtistsSection";
import { AutoPlaylistsSectionOptimized } from "@/components/home/AutoPlaylistsSectionOptimized";
import { UnifiedDiscoverySection } from "@/components/home/UnifiedDiscoverySection";
import { CommunityNewTracksSection } from "@/components/home/CommunityNewTracksSection";
import { HeroQuickActions } from "@/components/home/HeroQuickActions";
import { RecentTracksSection } from "@/components/home/RecentTracksSection";
import { WelcomeSection } from "@/components/home/WelcomeSection";
import { GamificationWidget } from "@/components/gamification/GamificationWidget";
import { BlogSection } from "@/components/home/BlogSection";
import { GraphPreview } from "@/components/home/GraphPreview";
import { ProfessionalToolsHub } from "@/components/home/ProfessionalToolsHub";
import { GenerateSheet } from "@/components/GenerateSheet";
import { MusicRecognitionDialog } from "@/components/music-recognition/MusicRecognitionDialog";
import { HomeSkeletonEnhanced } from "@/components/home/HomeSkeletonEnhanced";
import { motion } from '@/lib/motion';

const Index = () => {
  const { user } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);
  const [recognitionDialogOpen, setRecognitionDialogOpen] = useState(false);

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
    navigate("/profile");
  };

  const handleRemix = (trackId: string) => {
    hapticFeedback("light");
    navigate(`/generate?remix=${trackId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Subtle background gradient - reduced for performance */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 pt-2 pb-4 sm:py-6 relative z-10">
        {/* Compact Header with glass effect */}
        <motion.header 
          className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 z-20 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2 backdrop-blur-md bg-background/80"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <motion.div 
              className="relative"
              whileTap={{ scale: 0.95 }}
            >
              <img src={logo} alt="MusicVerse" className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />
              <motion.div 
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gradient leading-tight">MusicVerse</h1>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">AI Music Studio</p>
            </div>
          </div>
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

        {/* Gamification Widget - Prominent position after welcome */}
        {user && (
          <motion.section 
            className="mb-4 sm:mb-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            <GamificationWidget />
          </motion.section>
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

        {/* Public AI Artists Section */}
        <motion.section
          className="mb-4 sm:mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <PublicArtistsSection />
        </motion.section>

        {/* Professional Tools Hub - Desktop only or collapsed on mobile */}
        {user && (
          <motion.section
            className="hidden sm:block mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <ProfessionalToolsHub />
          </motion.section>
        )}

      </div>

      <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
      <MusicRecognitionDialog open={recognitionDialogOpen} onOpenChange={setRecognitionDialogOpen} />
    </div>
  );
};

export default Index;
