import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, BarChart3, UserCircle, ChevronRight } from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MoreSheet = ({ open, onOpenChange }: MoreSheetProps) => {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const menuItems = [
    {
      icon: Users,
      title: 'Артисты',
      description: 'Исследуйте популярных артистов',
      path: '/artists',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      icon: BookOpen,
      title: 'Блог',
      description: 'Новости и обновления',
      path: '/blog',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: BarChart3,
      title: 'Аналитика',
      description: 'Статистика и аналитика',
      path: '/analytics',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: UserCircle,
      title: 'Профиль',
      description: 'Настройки и профиль',
      path: '/profile',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
  ];

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">Ещё</SheetTitle>
          <p className="text-sm text-muted-foreground">Дополнительные возможности</p>
        </SheetHeader>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => handleNavigate(item.path)}
              className="w-full h-auto p-4 justify-start hover:bg-accent/50 transition-all"
            >
              <div className="flex items-center gap-4 w-full">
                <div className={`p-3 rounded-xl ${item.bgColor}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
