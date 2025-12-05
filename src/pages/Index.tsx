import { useState, useEffect, useMemo } from "react";
import { Onboarding } from "@/components/Onboarding";
import { NotificationBadge } from "@/components/NotificationBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  User,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  CheckSquare,
  Library,
  Sparkles,
  FolderOpen,
  ListMusic,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile.tsx";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { usePublicContentOptimized, getGenrePlaylists } from "@/hooks/usePublicContentOptimized";
import { FeaturedSectionOptimized } from "@/components/home/FeaturedSectionOptimized";
import { NewReleasesSectionOptimized } from "@/components/home/NewReleasesSectionOptimized";
import { PopularSectionOptimized } from "@/components/home/PopularSectionOptimized";
import { PublicArtistsSection } from "@/components/home/PublicArtistsSection";
import { AutoPlaylistsSectionOptimized } from "@/components/home/AutoPlaylistsSectionOptimized";
import { FilterBar } from "@/components/home/FilterBar";
import type { FilterState } from "@/components/home/FilterBar";
import { GenerateSheet } from "@/components/GenerateSheet";

const Index = () => {
  const { logout } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    moods: [],
    sort: 'recent',
  });
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

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Onboarding />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header with User Avatar */}
        <header className="flex items-center justify-between mb-6 glass-card p-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={logo} alt="MusicVerse" className="w-10 h-10 rounded-xl" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse-glow"></div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-telegram bg-clip-text text-transparent">MusicVerse</h1>
              <p className="text-xs text-muted-foreground">AI Music Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBadge />
            <button
              onClick={goToProfile}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary transition-all"
            >
              {displayUser?.photo_url ? (
                <img
                  src={displayUser.photo_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Compact Stats Row */}
        <Card className="p-3 mb-6 glass-card border-primary/20">
          <div className="flex items-center justify-between overflow-x-auto gap-4 scrollbar-hide">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold">{publicContent?.allTracks?.length || 0}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">треков</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-lg font-bold">100%</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">активность</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-lg font-bold">24/7</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">онлайн</span>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-lg font-bold">OK</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-5 sm:p-6 mb-6 glass-card border-primary/30">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Быстрые действия</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            <Button
              onClick={() => setGenerateSheetOpen(true)}
              className="bg-gradient-telegram hover:opacity-90 h-auto py-4 sm:py-5 flex flex-col gap-1.5 shadow-lg hover:shadow-primary/30 transition-all touch-manipulation min-h-[70px]"
              aria-label="Открыть генератор музыки"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-semibold">Генератор</span>
            </Button>
            <Button
              onClick={() => navigate("/library")}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 h-auto py-4 sm:py-5 flex flex-col gap-1.5 shadow-lg hover:shadow-purple-500/30 transition-all touch-manipulation min-h-[70px]"
              aria-label="Открыть библиотеку"
            >
              <Library className="w-5 h-5" />
              <span className="text-xs font-semibold">Библиотека</span>
            </Button>
            <Button
              onClick={() => navigate("/playlists")}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 h-auto py-4 sm:py-5 flex flex-col gap-1.5 shadow-lg hover:shadow-teal-500/30 transition-all touch-manipulation min-h-[70px]"
              aria-label="Открыть плейлисты"
            >
              <ListMusic className="w-5 h-5" />
              <span className="text-xs font-semibold">Плейлисты</span>
            </Button>
            <Button
              onClick={() => navigate("/tasks")}
              variant="outline"
              className="glass border-primary/30 hover:border-primary/50 h-auto py-4 sm:py-5 flex flex-col gap-1.5 transition-all touch-manipulation min-h-[70px]"
              aria-label="Открыть задачи"
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-xs">Задачи</span>
            </Button>
            <Button
              onClick={() => navigate("/projects")}
              variant="outline"
              className="glass border-primary/30 hover:border-primary/50 h-auto py-4 sm:py-5 flex flex-col gap-1.5 transition-all touch-manipulation min-h-[70px]"
              aria-label="Открыть проекты"
            >
              <FolderOpen className="w-5 h-5" />
              <span className="text-xs">Проекты</span>
            </Button>
            <Button
              onClick={() => navigate("/actors")}
              variant="outline"
              className="glass border-primary/30 hover:border-primary/50 h-auto py-4 sm:py-5 flex flex-col gap-1.5 transition-all touch-manipulation min-h-[70px]"
              aria-label="Открыть артистов"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Артисты</span>
            </Button>
          </div>
        </Card>

        {/* Public AI Artists Section */}
        <PublicArtistsSection />

        {/* Auto Playlists by Genre - uses pre-computed data */}
        <div className="mb-6">
          <AutoPlaylistsSectionOptimized 
            playlists={autoPlaylists} 
            isLoading={contentLoading} 
          />
        </div>

        {/* Discovery Section - Filter Bar */}
        <div className="mb-6">
          <FilterBar onFilterChange={handleFilterChange} />
        </div>

        {/* Featured Section - uses pre-fetched data */}
        <div className="mb-8">
          <FeaturedSectionOptimized 
            tracks={publicContent?.featuredTracks || []} 
            isLoading={contentLoading}
            onRemix={handleRemix} 
          />
        </div>

        {/* New Releases Section - uses pre-fetched data */}
        <div className="mb-8">
          <NewReleasesSectionOptimized 
            tracks={publicContent?.recentTracks || []} 
            isLoading={contentLoading}
            onRemix={handleRemix} 
          />
        </div>

        {/* Popular Section - uses pre-fetched data */}
        <div className="mb-8">
          <PopularSectionOptimized 
            tracks={publicContent?.popularTracks || []} 
            isLoading={contentLoading}
            onRemix={handleRemix} 
          />
        </div>
      </div>

      <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
    </div>
  );
};

export default Index;
