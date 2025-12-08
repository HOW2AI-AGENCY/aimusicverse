import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import { usePlaylists } from '@/hooks/usePlaylists';
import { motion } from 'framer-motion';
import { 
  ListMusic, 
  Users, 
  Globe, 
  BookOpen, 
  User, 
  Settings, 
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Gift,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Музыка',
    items: [
      { icon: ListMusic, label: 'Плейлисты', path: '/playlists', badgeVariant: 'count' },
      { icon: FileText, label: 'Шаблоны текстов', path: '/templates' },
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
  const { hapticFeedback } = useTelegram();
  const { playlists } = usePlaylists();

  const playlistCount = playlists?.length || 0;

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    onOpenChange(false);
    navigate(path);
  };

  const handleLogout = () => {
    hapticFeedback('medium');
    // TODO: Implement logout logic
    onOpenChange(false);
  };

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
          <SheetTitle className="flex items-center gap-2 text-left">
            <Sparkles className="w-5 h-5 text-primary" />
            Меню
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
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
                {section.items.map((item, itemIndex) => (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                    onClick={() => handleNavigate(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl",
                      "hover:bg-muted/50 active:bg-muted transition-colors",
                      "touch-manipulation min-h-[48px]"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {renderBadge(item)}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}

          <Separator />

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl",
              "hover:bg-destructive/10 active:bg-destructive/20 transition-colors",
              "touch-manipulation min-h-[48px] text-destructive"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left font-medium">Выйти</span>
          </motion.button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
