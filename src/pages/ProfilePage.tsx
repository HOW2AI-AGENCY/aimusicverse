import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, User, Users, LogOut, GraduationCap, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTelegram } from '@/contexts/TelegramContext';
import { useProfile } from '@/hooks/useProfile.tsx';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { hapticFeedback, user: telegramUser } = useTelegram();
  const { data: profile } = useProfile();
  const { logout } = useAuth();
  const { startOnboarding } = useOnboarding();
  const { data: adminAuth } = useAdminAuth();

  const displayUser = profile || telegramUser;

  const handleStartOnboarding = () => {
    hapticFeedback('medium');
    startOnboarding();
  };

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
      icon: Settings,
      title: 'Настройки',
      description: 'Управление профилем и уведомлениями',
      path: '/settings',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  const handleLogout = () => {
    hapticFeedback('medium');
    logout();
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 pb-24">
      {/* User Profile Card */}
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {displayUser?.first_name} {displayUser?.last_name}
            </h1>
            {displayUser?.username && (
              <p className="text-muted-foreground">@{displayUser.username}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Admin Panel Link - only for admins */}
      {adminAuth?.isAdmin && (
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
      )}

      {/* Menu Items */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {menuItems.map((item) => (
          <Card
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className="p-4 hover:bg-muted/50 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      {/* Onboarding Button */}
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

      {/* Logout Button */}
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
    </div>
  );
};

export default ProfilePage;
