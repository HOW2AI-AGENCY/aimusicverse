/**
 * MoreMenuSheet - Expandable menu for additional navigation items
 * Phase 1: Mobile navigation optimization
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Settings, Music2, Guitar, FileText, 
  Users, BookOpen, Gift, BarChart3, Sparkles,
  Palette, Shield, Grid3X3
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MoreMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  description?: string;
}

interface MenuSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Студии',
    icon: Sparkles,
    items: [
      { path: '/music-lab', icon: Music2, label: 'Music Lab', description: 'Все инструменты' },
      { path: '/creative-tools/guitar', icon: Guitar, label: 'Guitar Studio', description: 'Запись гитары' },
      { path: '/creative-tools/lyrics', icon: FileText, label: 'Lyrics Studio', description: 'Текст песен' },
    ],
  },
  {
    title: 'Сообщество',
    icon: Users,
    items: [
      { path: '/blog', icon: BookOpen, label: 'Блог', description: 'Новости и статьи' },
      { path: '/artists', icon: Users, label: 'Авторы', description: 'ИИ-персоны' },
    ],
  },
  {
    title: 'Аккаунт',
    icon: User,
    items: [
      { path: '__profile__', icon: User, label: 'Мой профиль', description: 'Ваша страница' },
      { path: '/rewards', icon: Gift, label: 'Награды', badge: 'Бонус', description: 'Ежедневные бонусы' },
      { path: '/settings', icon: Settings, label: 'Настройки', description: 'Параметры' },
    ],
  },
];

export function MoreMenuSheet({ open, onOpenChange }: MoreMenuSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();

  const handleNavigate = (path: string) => {
    hapticFeedback?.('light');
    onOpenChange(false);
    
    if (path === '__profile__') {
      if (user?.id) {
        navigate(`/profile/${user.id}`);
      } else {
        navigate('/profile');
      }
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '__profile__') {
      return location.pathname.includes('/profile');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto pb-safe">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Grid3X3 className="w-5 h-5 text-primary" />
            Ещё
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          {menuSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
            >
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <section.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </span>
              </div>

              {/* Section Items */}
              <div className="grid gap-1">
                {section.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sectionIndex * 0.05 + itemIndex * 0.03 }}
                  >
                    <Button
                      variant={isActive(item.path) ? 'secondary' : 'ghost'}
                      className={cn(
                        "w-full justify-start h-auto py-3 px-3 gap-3",
                        isActive(item.path) && "bg-primary/10 text-primary border border-primary/20"
                      )}
                      onClick={() => handleNavigate(item.path)}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        isActive(item.path) 
                          ? "bg-primary/20" 
                          : "bg-muted"
                      )}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>

              {sectionIndex < menuSections.length - 1 && (
                <Separator className="mt-4" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Version info */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            MusicVerse AI v1.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
