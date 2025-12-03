import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserActivity, useCreateActivity } from "@/hooks/useUserActivity";
import { useProfile } from "@/hooks/useProfile.tsx";
import { ActivitySkeleton, StatCardSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { NewReleasesSection } from "@/components/home/NewReleasesSection";
import { PopularSection } from "@/components/home/PopularSection";
import { PublicArtistsSection } from "@/components/home/PublicArtistsSection";
import { FilterBar } from "@/components/home/FilterBar";
import type { FilterState } from "@/components/home/FilterBar";
import { GenerateSheet } from "@/components/GenerateSheet";

const Index = () => {
  const { logout } = useAuth();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: activities, isLoading: activitiesLoading } = useUserActivity();
  const createActivity = useCreateActivity();
  const [filters, setFilters] = useState<FilterState>({
    genres: [],
    moods: [],
    sort: 'recent',
  });
  const [generateSheetOpen, setGenerateSheetOpen] = useState(false);

  // Use profile data from DB if available, fallback to Telegram context
  const displayUser = profile || telegramUser;

  // Handle navigation state for opening GenerateSheet
  useEffect(() => {
    if (location.state?.openGenerate) {
      setGenerateSheetOpen(true);
      // Clear the state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const { data: publicProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_projects")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const handleAction = async (actionType: string) => {
    hapticFeedback("success");

    createActivity.mutate(
      { action_type: actionType, action_data: { timestamp: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast.success(`Действие "${actionType}" выполнено!`);
        },
        onError: () => {
          toast.error("Ошибка при выполнении действия");
        },
      },
    );
  };

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
    // TODO: Implement filter logic with backend queries
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
            {/* User Avatar - clickable to profile */}
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
        {activitiesLoading ? (
          <div className="mb-6">
            <div className="h-14 rounded-xl bg-muted/50 animate-pulse" />
          </div>
        ) : (
          <Card className="p-3 mb-6 glass-card border-primary/20">
            <div className="flex items-center justify-between overflow-x-auto gap-4 scrollbar-hide">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold">{activities?.length || 0}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">действий</span>
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
        )}

        {/* Quick Actions */}
        <Card className="p-5 sm:p-6 mb-6 glass-card border-primary/30">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            <Button
              onClick={() => setGenerateSheetOpen(true)}
              className="bg-gradient-telegram hover:opacity-90 h-auto py-5 sm:py-6 flex flex-col gap-2 shadow-lg hover:shadow-primary/30 transition-all touch-manipulation min-h-[80px]"
              aria-label="Открыть генератор музыки"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-semibold">Генератор</span>
            </Button>
            <Button
              onClick={() => navigate("/library")}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 h-auto py-5 sm:py-6 flex flex-col gap-2 shadow-lg hover:shadow-purple-500/30 transition-all touch-manipulation min-h-[80px]"
              aria-label="Открыть библиотеку"
            >
              <Library className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-semibold">Библиотека</span>
            </Button>
            <Button
              onClick={() => navigate("/tasks")}
              variant="outline"
              className="glass border-primary/30 hover:border-primary/50 h-auto py-5 sm:py-6 flex flex-col gap-2 transition-all touch-manipulation min-h-[80px]"
              aria-label="Открыть задачи"
            >
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm">Задачи</span>
            </Button>
            <Button
              onClick={() => navigate("/projects")}
              variant="outline"
              className="glass border-primary/30 hover:border-primary/50 h-auto py-5 sm:py-6 flex flex-col gap-2 transition-all touch-manipulation min-h-[80px]"
              aria-label="Открыть проекты"
            >
              <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm">Проекты</span>
            </Button>
          </div>
        </Card>

        {/* Public AI Artists Section */}
        <PublicArtistsSection />

        {/* Public Projects */}
        {publicProjects && publicProjects.length > 0 && (
          <Card className="p-5 sm:p-6 mb-6 glass-card border-primary/20">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Публичные проекты
              </h2>
            </div>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicProjects.map((project) => (
                <Card
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-3 sm:p-4 glass-card border-primary/20 hover:border-primary/40 hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer touch-manipulation min-h-[80px]"
                  role="button"
                  tabIndex={0}
                  aria-label={`Открыть проект ${project.title}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/projects/${project.id}`);
                    }
                  }}
                >
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      {project.cover_url ? (
                        <img
                          src={project.cover_url}
                          alt={project.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Music className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 truncate">
                        {project.title}
                      </h3>
                      {project.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {project.genre}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Discovery Section - Filter Bar */}
        <div className="mb-6">
          <FilterBar onFilterChange={handleFilterChange} />
        </div>

        {/* Featured Section */}
        <div className="mb-8">
          <FeaturedSection onRemix={handleRemix} />
        </div>

        {/* New Releases Section */}
        <div className="mb-8">
          <NewReleasesSection onRemix={handleRemix} />
        </div>

        {/* Popular Section */}
        <div className="mb-8">
          <PopularSection onRemix={handleRemix} />
        </div>

        {/* Recent Activity */}
        <Card className="p-5 sm:p-6 glass-card border-primary/20">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Последняя активность</h2>
          {activitiesLoading ? (
            <div className="space-y-2.5 sm:space-y-3">
              {[1, 2, 3].map((i) => (
                <ActivitySkeleton key={i} />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-2.5 sm:space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg glass border border-primary/10 hover:border-primary/20 hover:shadow-md active:scale-[0.99] transition-all touch-manipulation"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0">
                      <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground capitalize truncate">
                        {activity.action_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] sm:text-xs flex-shrink-0">
                    Завершено
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Пока нет активности. Выполните действие, чтобы увидеть его здесь.
              </p>
            </div>
          )}
        </Card>
      </div>

      <GenerateSheet open={generateSheetOpen} onOpenChange={setGenerateSheetOpen} />
    </div>
  );
};

export default Index;
