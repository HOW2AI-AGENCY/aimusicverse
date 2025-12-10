import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { usePlaylists } from '@/hooks/usePlaylists';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  ListMusic, 
  Users, 
  Globe, 
  BookOpen, 
  User, 
  Settings, 
  HelpCircle,
  ChevronRight,
  Sparkles,
  Gift,
  FileText,
  Music2,
  Guitar,
  Home,
  Library,
  Folder,
  Bell,
  Loader2,
  Volume2,
  VolumeX
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
    title: 'Быстрый доступ',
    items: [
      { icon: Home, label: 'Главная', path: '/', description: 'Лента и открытия' },
      { icon: Library, label: 'Библиотека', path: '/library', description: 'Ваши треки' },
      { icon: Folder, label: 'Проекты', path: '/projects', description: 'Музыкальные проекты' },
    ]
  },
  {
    title: 'Музыка',
    items: [
      { icon: ListMusic, label: 'Плейлисты', path: '/playlists', badgeVariant: 'count' },
      { icon: Guitar, label: 'Guitar Studio', path: '/guitar-studio', description: 'Запись, транскрипция и анализ гитары', badge: 'PRO', badgeVariant: 'new' },
      { icon: FileText, label: 'Шаблоны', path: '/templates', description: 'Шаблоны текстов' },
      { icon: Users, label: 'AI-артисты', path: '/artists' },
      { icon: Globe, label: 'Сообщество', path: '/community' },
      { icon: BookOpen, label: 'Блог', path: '/blog' },
    ]
  },
  {
    title: 'Аккаунт',
    items: [
      { icon: User, label: 'Профиль', path: '/profile' },
      { icon: Gift, label: 'Награды', path: '/rewards' },
      { icon: Settings, label: 'Настройки', path: '/settings' },
      { icon: HelpCircle, label: 'Обучение', path: '/onboarding' },
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
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-left">
              <Sparkles className="w-5 h-5 text-primary" />
              Меню
            </SheetTitle>
            
            <div className="flex items-center gap-2">
              {/* Notification indicator */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigate('/settings')}
                  className="gap-1.5"
                >
                  <Bell className="w-4 h-4" />
                  <Badge variant="destructive" className="h-5 px-1.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                </Button>
              )}
              
              {/* Sound toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  hapticFeedback('light');
                  setSoundEnabled(!soundEnabled);
                }}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Active Generations Section */}
          <AnimatePresence>
            {generationCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <h3 className="text-sm font-semibold">
                    Активные генерации ({generationCount})
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {activeGenerations.slice(0, 3).map((gen) => (
                    <motion.div
                      key={gen.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Music2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {gen.prompt.slice(0, 30)}{gen.prompt.length > 30 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={gen.progress} className="h-1 flex-1" />
                          <span className="text-[10px] text-muted-foreground">
                            {gen.progress}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-primary"
                  onClick={() => handleNavigate('/library')}
                >
                  Открыть библиотеку →
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {menuSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const active = isActive(item.path);
                  return (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl",
                        "hover:bg-muted/50 active:bg-muted transition-colors",
                        "touch-manipulation min-h-[48px]",
                        active && "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        active ? "bg-primary/20" : "bg-muted/50"
                      )}>
                        <item.icon className={cn("w-5 h-5", active ? "text-primary" : "text-foreground")} />
                      </div>
                      <div className="flex-1 text-left">
                        <span className={cn("font-medium", active && "text-primary")}>{item.label}</span>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      {renderBadge(item)}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
