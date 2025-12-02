
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTelegram } from '@/contexts/TelegramContext';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { hapticFeedback, user } = useTelegram();

  const menuItems = [
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

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{user?.firstName} {user?.lastName}</h1>
          <p className="text-muted-foreground">@{user?.username}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
};

export default ProfilePage;
