import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  ChevronRight, 
  User, 
  Users, 
  LogOut, 
  GraduationCap, 
  Shield,
  Music,
  Play,
  Heart,
  FolderOpen,
  ListMusic,
  BarChart3,
  TrendingUp,
  Sparkles,
  Gift
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTelegram } from '@/contexts/TelegramContext';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { motion } from '@/lib/motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { InviteFriendsCard } from '@/components/gamification/InviteFriendsCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopDashboardLayout } from '@/components/layout/desktop';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const { logout } = useAuth();
  const { startOnboarding } = useOnboarding();
  const { data: adminAuth } = useAdminAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const isMobile = useIsMobile();

  // Telegram BackButton
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  const displayUser = profile || telegramUser;

  const handleStartOnboarding = () => {
    hapticFeedback('medium');
    startOnboarding();
  };

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  const handleLogout = () => {
    hapticFeedback('medium');
    logout();
  };

  const statItems = [
    { icon: Music, label: 'Треков', value: stats?.totalTracks || 0, color: 'text-blue-500' },
    { icon: Play, label: 'Прослушиваний', value: stats?.totalPlays || 0, color: 'text-green-500' },
    { icon: Heart, label: 'Лайков', value: stats?.totalLikes || 0, color: 'text-red-500' },
    { icon: Sparkles, label: 'Генераций', value: stats?.generationsThisMonth || 0, color: 'text-purple-500' },
  ];

  const menuItems = [
    {
      icon: Users,
      title: 'Мои AI-артисты',
      description: 'Управление вашими AI-артистами',
      path: '/artists',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: BarChart3,
      title: 'Аналитика',
      description: 'Детальная статистика',
      path: '/analytics',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Settings,
      title: 'Настройки',
      description: 'Профиль, уведомления, Telegram',
      path: '/settings',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  // Profile card component
  const ProfileCard = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 lg:p-8 glass-card border-primary/20 transition-shadow hover:shadow-lg">
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 lg:border-3 border-primary/30 shadow-lg transition-transform hover:scale-105">
            {displayUser?.photo_url ? (
              <img
                src={displayUser.photo_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 lg:w-14 lg:h-14 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {displayUser?.first_name} {displayUser?.last_name}
            </h1>
            {displayUser?.username && (
              <p className="text-muted-foreground lg:text-lg">@{displayUser.username}</p>
            )}
            {profile?.subscription_tier && (
              <span className="inline-block mt-1 lg:mt-2 px-2 lg:px-3 py-0.5 lg:py-1 text-xs lg:text-sm font-medium rounded-full bg-primary/20 text-primary">
                {profile.subscription_tier === 'premium' ? 'Premium' : 
                 profile.subscription_tier === 'enterprise' ? 'Enterprise' : 'Free'}
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // Stats grid component
  const StatsGrid = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4"
    >
      {statItems.map((stat) => (
        <Card key={stat.label} className="p-4 lg:p-5 glass-card border-border/50 transition-all hover:shadow-md hover:scale-[1.02]">
          {statsLoading ? (
            <Skeleton className="h-12 lg:h-16 w-full" />
          ) : (
            <div className="text-center">
              <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 ${stat.color}`} />
              <p className="text-2xl lg:text-3xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          )}
        </Card>
      ))}
    </motion.div>
  );

  // Quick stats row
  const QuickStatsRow = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="p-4 lg:p-6 glass-card border-border/50 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-around text-center">
          <div className="transition-transform hover:scale-105">
            <FolderOpen className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 text-amber-500" />
            <p className="text-lg lg:text-xl font-semibold">{stats?.totalProjects || 0}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Проектов</p>
          </div>
          <div className="w-px h-10 lg:h-12 bg-border" />
          <div className="transition-transform hover:scale-105">
            <ListMusic className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 text-cyan-500" />
            <p className="text-lg lg:text-xl font-semibold">{stats?.totalPlaylists || 0}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Плейлистов</p>
          </div>
          <div className="w-px h-10 lg:h-12 bg-border" />
          <div className="transition-transform hover:scale-105">
            <Users className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 text-violet-500" />
            <p className="text-lg lg:text-xl font-semibold">{stats?.totalArtists || 0}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Артистов</p>
          </div>
          <div className="w-px h-10 lg:h-12 bg-border" />
          <div className="transition-transform hover:scale-105">
            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 text-emerald-500" />
            <p className="text-lg lg:text-xl font-semibold">{stats?.publicTracks || 0}</p>
            <p className="text-xs lg:text-sm text-muted-foreground">Публичных</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  // Menu items grid
  const MenuItemsGrid = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="grid gap-3 lg:gap-4 lg:grid-cols-3"
    >
      {menuItems.map((item) => (
        <Card
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className="p-4 lg:p-5 hover:bg-muted/50 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <div className={`p-2.5 lg:p-3 rounded-lg lg:rounded-xl ${item.bgColor} transition-transform group-hover:scale-110`}>
              <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold lg:text-lg">{item.title}</p>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </Card>
      ))}
    </motion.div>
  );

  // Admin panel link
  const AdminPanelLink = adminAuth?.isAdmin ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card
        onClick={() => handleNavigate('/admin')}
        className="p-4 hover:bg-red-500/10 transition-all cursor-pointer border-red-500/30 bg-red-500/5"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-500/10">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">Админ-панель</p>
            <p className="text-sm text-muted-foreground">Метрики, пользователи, аналитика</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  ) : null;

  // Action cards (onboarding + logout)
  const ActionCards = (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card
          onClick={handleStartOnboarding}
          className="p-4 hover:bg-primary/10 transition-all cursor-pointer border-primary/20"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Обучение</p>
              <p className="text-sm text-muted-foreground">Пройти тур по возможностям</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          onClick={handleLogout}
          className="p-4 hover:bg-destructive/10 transition-all cursor-pointer border-destructive/20"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg text-destructive">Выйти</p>
              <p className="text-sm text-muted-foreground">Завершить сеанс</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
      </motion.div>
    </>
  );

  // Desktop layout
  if (!isMobile) {
    return (
      <div 
        className="min-h-screen pb-24"
        style={{ paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))' }}
      >
        <DesktopDashboardLayout
          maxWidth="wide"
          header={ProfileCard}
          leftColumn={
            <div className="space-y-6">
              {StatsGrid}
              {QuickStatsRow}
              {AdminPanelLink}
              {MenuItemsGrid}
            </div>
          }
          rightColumn={
            <div className="space-y-4">
              <InviteFriendsCard variant="banner" />
              {ActionCards}
            </div>
          }
        />
      </div>
    );
  }

  // Mobile layout (original)
  return (
    <div 
      className="container mx-auto max-w-4xl px-4 pb-24"
      style={{ paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 1rem), calc(env(safe-area-inset-top, 0px) + 1rem))' }}
    >
      {/* User Profile Card */}
      <div className="mb-6">{ProfileCard}</div>

      {/* Stats Grid */}
      <div className="mb-6">{StatsGrid}</div>

      {/* Quick Stats Row */}
      <div className="mb-6">{QuickStatsRow}</div>

      {/* Admin Panel Link */}
      {AdminPanelLink && <div className="mb-4">{AdminPanelLink}</div>}

      {/* Menu Items */}
      <div className="mb-6">{MenuItemsGrid}</div>

      {/* Invite Friends */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <InviteFriendsCard variant="banner" />
      </motion.div>

      {/* Action Cards */}
      <div className="space-y-4">{ActionCards}</div>
    </div>
  );
};

export default ProfilePage;