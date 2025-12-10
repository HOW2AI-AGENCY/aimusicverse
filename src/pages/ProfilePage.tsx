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
  Sparkles
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

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const { logout } = useAuth();
  const { startOnboarding } = useOnboarding();
  const { data: adminAuth } = useAdminAuth();
  const { data: stats, isLoading: statsLoading } = useUserStats();

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

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 pb-24">
      {/* User Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 mb-6 glass-card border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30">
              {displayUser?.photo_url ? (
                <img
                  src={displayUser.photo_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {displayUser?.first_name} {displayUser?.last_name}
              </h1>
              {displayUser?.username && (
                <p className="text-muted-foreground">@{displayUser.username}</p>
              )}
              {profile?.subscription_tier && (
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                  {profile.subscription_tier === 'premium' ? 'Premium' : 
                   profile.subscription_tier === 'enterprise' ? 'Enterprise' : 'Free'}
                </span>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
      >
        {statItems.map((stat, index) => (
          <Card key={stat.label} className="p-4 glass-card border-border/50">
            {statsLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            )}
          </Card>
        ))}
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="p-4 mb-6 glass-card border-border/50">
          <div className="flex items-center justify-around text-center">
            <div>
              <FolderOpen className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-semibold">{stats?.totalProjects || 0}</p>
              <p className="text-xs text-muted-foreground">Проектов</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <ListMusic className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
              <p className="text-lg font-semibold">{stats?.totalPlaylists || 0}</p>
              <p className="text-xs text-muted-foreground">Плейлистов</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <Users className="w-5 h-5 mx-auto mb-1 text-violet-500" />
              <p className="text-lg font-semibold">{stats?.totalArtists || 0}</p>
              <p className="text-xs text-muted-foreground">Артистов</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-lg font-semibold">{stats?.publicTracks || 0}</p>
              <p className="text-xs text-muted-foreground">Публичных</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Admin Panel Link - only for admins */}
      {adminAuth?.isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            onClick={() => handleNavigate('/admin')}
            className="p-4 mb-4 hover:bg-red-500/10 transition-all cursor-pointer border-red-500/30 bg-red-500/5"
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
      )}

      {/* Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid gap-3 md:grid-cols-3 mb-6"
      >
        {menuItems.map((item) => (
          <Card
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className="p-4 hover:bg-muted/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Onboarding Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card
          onClick={handleStartOnboarding}
          className="p-4 mb-4 hover:bg-primary/10 transition-all cursor-pointer border-primary/20"
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

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
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
    </div>
  );
};

export default ProfilePage;