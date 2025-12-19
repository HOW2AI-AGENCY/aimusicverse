import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { usePlaylists } from '@/hooks/usePlaylists';
import { motion, AnimatePresence } from '@/lib/motion';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { 
  ListMusic, 
  Users, 
  Globe, 
  BookOpen, 
  User, 
  Settings, 
  ChevronRight,
  Gift,
  FileText,
  Music2,
  Home,
  Library,
  Folder,
  Bell,
  Loader2,
  Volume2,
  VolumeX,
  Disc3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNotificationHub } from '@/contexts/NotificationContext';

interface NavigationMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'new' | 'count';
  description?: string;
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Основное',
    items: [
      { icon: Home, label: 'Главная', path: '/', description: 'Лента и открытия' },
      { icon: Library, label: 'Библиотека', path: '/library', description: 'Ваши треки' },
      { icon: Folder, label: 'Проекты', path: '/projects', description: 'Альбомы и EP' },
      { icon: ListMusic, label: 'Плейлисты', path: '/playlists', badgeVariant: 'count' },
    ]
  },
  {
    title: 'Инструменты',
    items: [
      { icon: Disc3, label: 'Music Lab', path: '/music-lab', description: 'DJ, ударные, аккорды, гитара' },
      { icon: FileText, label: 'Шаблоны текстов', path: '/templates' },
      { icon: Users, label: 'AI-артисты', path: '/artists' },
    ]
  },
  {
    title: 'Сообщество',
    items: [
      { icon: Globe, label: 'Открытия', path: '/community', description: 'Публичные треки' },
      { icon: BookOpen, label: 'Блог', path: '/blog' },
    ]
  },
  {
    title: 'Профиль',
    items: [
      { icon: User, label: 'Мой профиль', path: '/profile' },
      { icon: Gift, label: 'Награды', path: '/rewards' },
      { icon: Settings, label: 'Настройки', path: '/settings' },
    ]
  }
];

export const NavigationMenuSheet = ({ open, onOpenChange }: NavigationMenuSheetProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback } = useTelegram();
  const { playlists } = usePlaylists();
  const { 
    activeGenerations, 
    generationCount, 
    unreadCount,
    soundEnabled,
    setSoundEnabled 
  } = useNotificationHub();

  // Telegram BackButton integration
  useTelegramBackButton({
    visible: open,
    onClick: () => onOpenChange(false),
  });

  const playlistCount = playlists?.length || 0;

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    onOpenChange(false);
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const renderBadge = (item: MenuItem) => {
    if (item.badgeVariant === 'count' && item.path === '/playlists' && playlistCount > 0) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
          {playlistCount}
        </span>
      );
    }
    if (item.badgeVariant === 'new' && item.badge) {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground">
          {item.badge}
        </span>
      );
    }
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto p-4">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold">Меню</SheetTitle>
            
            <div className="flex items-center gap-0.5">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigate('/settings')}
                  className="h-7 w-7 relative"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-destructive text-[8px] font-bold text-white rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9' : unreadCount}
                  </span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  hapticFeedback('light');
                  setSoundEnabled(!soundEnabled);
                }}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {/* Active Generations Section - Compact */}
          <AnimatePresence>
            {generationCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <h3 className="text-xs font-semibold">
                    Генерации ({generationCount})
                  </h3>
                </div>
                
                <div className="space-y-1.5">
                  {activeGenerations.slice(0, 2).map((gen) => (
                    <div
                      key={gen.id}
                      className="flex items-center gap-2 p-1.5 rounded bg-background/50"
                    >
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music2 className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium truncate">
                          {gen.prompt.slice(0, 25)}...
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Progress value={gen.progress} className="h-1 flex-1" />
                          <span className="text-[9px] text-muted-foreground">
                            {gen.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1.5 h-7 text-xs text-primary"
                  onClick={() => handleNavigate('/library')}
                >
                  Открыть библиотеку →
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {menuSections.map((section, sectionIndex) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg",
                        "hover:bg-muted/50 active:bg-muted transition-colors",
                        "touch-manipulation min-h-[44px]",
                        active && "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        active ? "bg-primary/20" : "bg-muted/50"
                      )}>
                        <item.icon className={cn("w-4 h-4", active ? "text-primary" : "text-foreground")} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className={cn("text-sm font-medium", active && "text-primary")}>{item.label}</span>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                        )}
                      </div>
                      {renderBadge(item)}
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
