import { useNavigate } from "react-router";
import { User, FolderOpen, ListMusic, TrendingUp } from "@/lib/icons";
import { Card } from "@/components/ui/card";
import { motion } from "@/lib/motion";
import { useTelegram } from "@/contexts/TelegramContext";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useUserStats } from "@/hooks/useUserStats";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopDashboardLayout } from "@/components/layout/desktop";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const { logout } = useAuth();
  const { startOnboarding } = useOnboarding();
  const { data: adminAuth } = useAdminAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const isMobile = useIsMobile();

  useTelegramBackButton({ visible: true, fallbackPath: "/" });

  const displayUser = profile || telegramUser;

  const handleNavigate = (path: string) => {
    hapticFeedback("light");
    navigate(path);
  };

  const handleLogout = () => {
    hapticFeedback("medium");
    logout();
  };

  const handleStartOnboarding = () => {
    hapticFeedback("medium");
    startOnboarding();
  };

  // Quick stats row
  const QuickStatsRow = (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card className="p-4 lg:p-6 glass-card border-border/50 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-around text-center">
          <div className="transition-transform hover:scale-105">
            <FolderOpen className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 text-warning" />
            <p className="text-lg lg:text-xl font-semibold">{stats?.totalProjects || 0}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Проектов</p>
          </div>
          <div className="w-px h-10 lg:h-12 bg-border" />
          <div className="transition-transform hover:scale-105">
            <ListMusic className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 text-info" />
            <p className="text-lg lg:text-xl font-semibold">{stats?.totalPlaylists || 0}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Плейлистов</p>
          </div>
          <div className="w-px h-10 lg:h-12 bg-border" />
          <button onClick={() => handleNavigate("/referral")} className="transition-transform hover:scale-105">
            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 text-success" />
            <p className="text-lg lg:text-xl font-semibold">{stats?.referralCount || 0}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Рефералов</p>
          </button>
        </div>
      </Card>
    </motion.div>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="max-w-2xl mx-auto px-4 py-6 space-y-4"
          style={{
            paddingTop:
              "max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))",
          }}
        >
          <ProfileCard displayUser={displayUser} subscriptionTier={profile?.subscription_tier} />
          <ProfileStats {...stats} isLoading={statsLoading} />
          {QuickStatsRow}
          <ProfileMenu
            isAdmin={!!adminAuth}
            onNavigate={handleNavigate}
            onStartOnboarding={handleStartOnboarding}
            onLogout={handleLogout}
          />
          <div className="flex justify-center pt-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <DesktopDashboardLayout
      sidebar={
        <div className="space-y-4">
          <ProfileCard displayUser={displayUser} subscriptionTier={profile?.subscription_tier} />
          <ProfileMenu
            isAdmin={!!adminAuth}
            onNavigate={handleNavigate}
            onStartOnboarding={handleStartOnboarding}
            onLogout={handleLogout}
          />
        </div>
      }
    >
      <div className="space-y-6">
        <ProfileStats {...stats} isLoading={statsLoading} />
        {QuickStatsRow}
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </DesktopDashboardLayout>
  );
};
