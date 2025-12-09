import { useState, useEffect, useMemo } from "react";
import { NotificationBadge } from "@/components/NotificationBadge";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import logo from "@/assets/logo.png";
import { usePublicContentOptimized, getGenrePlaylists } from "@/hooks/usePublicContentOptimized";
import { PublicArtistsSection } from "@/components/home/PublicArtistsSection";
import { AutoPlaylistsSectionOptimized } from "@/components/home/AutoPlaylistsSectionOptimized";
import { UnifiedDiscoverySection } from "@/components/home/UnifiedDiscoverySection";
import { HeroQuickActions } from "@/components/home/HeroQuickActions";
import { RecentTracksSection } from "@/components/home/RecentTracksSection";
import { GamificationWidgetCompact } from "@/components/gamification/GamificationWidgetCompact";
import { BlogSection } from "@/components/home/BlogSection";
import { GenerateSheet } from "@/components/GenerateSheet";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);

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
    if (location.state?.openGenerate) {
      setGenerateSheetOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const goToProfile = () => {
    hapticFeedback("light");
    navigate("/profile");
  };

  const handleRemix = (trackId: string) => {
    hapticFeedback("light");
    navigate(`/generate?remix=${trackId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
      
      
      <div className="container max-w-6xl mx-auto px-4 py-4 sm:py-6 relative z-10">
        {/* Compact Header with glass effect */}
        <motion.header 
          className="flex items-center justify-between mb-6 sticky top-0 z-20 -mx-4 px-4 py-3 backdrop-blur-md bg-background/60"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={logo} alt="MusicVerse" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg" />
              <motion.div 
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gradient">MusicVerse</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">AI Music Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBadge />
            <motion.button
              onClick={goToProfile}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary transition-all touch-manipulation ring-2 ring-primary/10 hover:ring-primary/30"
              whileHover={{ scale: 1.05 }}
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
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* Compact Gamification Widget */}
        <motion.section 
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <GamificationWidgetCompact />
        </motion.section>

        {/* Hero Quick Actions */}
        <motion.section 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <HeroQuickActions onGenerateClick={() => setGenerateSheetOpen(true)} />
        </motion.section>

        {/* Recent Tracks for logged-in users */}
        {user && (
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.3 }}
          >
            <RecentTracksSection maxTracks={4} />
          </motion.section>
        )}

        {/* Public AI Artists Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <PublicArtistsSection />
        </motion.div>

        {/* Auto Playlists by Genre */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          <AutoPlaylistsSectionOptimized 
            playlists={autoPlaylists} 
            isLoading={contentLoading} 
          />
        </motion.div>

        {/* Unified Discovery Section - Combines Featured, New, Popular */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <UnifiedDiscoverySection
            featuredTracks={publicContent?.featuredTracks || []}
            recentTracks={publicContent?.recentTracks || []}
            popularTracks={publicContent?.popularTracks || []}
            isLoading={contentLoading}
            onRemix={handleRemix}
          />
        </motion.div>

        {/* Blog Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <BlogSection />
        </motion.div>
      </div>

      <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
    </div>
  );
};

export default Index;
