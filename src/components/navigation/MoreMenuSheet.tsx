/**
 * MoreMenuSheet - Expandable menu for additional navigation items
 * Phase 1: Mobile navigation optimization with search, quick actions, collapsible sections
 */

import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Settings, Music2, Guitar, FileText, 
  Users, BookOpen, Gift, BarChart3, Sparkles,
  Shield, Grid3X3, MessageSquare, Flag
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTelegram } from '@/contexts/TelegramContext';
import { motion } from '@/lib/motion';
import { QuickActionsBar } from './QuickActionsBar';
import { CollapsibleMenuSection } from './CollapsibleMenuSection';
import { MenuSearch } from './MenuSearch';

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
  section?: string;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
  defaultExpanded?: boolean;
}

const menuSections: MenuSection[] = [
  {
    id: 'studios',
    title: 'Студии',
    icon: Sparkles,
    defaultExpanded: true,
    items: [
      { path: '/music-lab', icon: Music2, label: 'Music Lab', description: 'Все инструменты', section: 'Студии' },
      { path: '/creative-tools/guitar', icon: Guitar, label: 'Guitar Studio', description: 'Запись гитары', section: 'Студии' },
      { path: '/creative-tools/lyrics', icon: FileText, label: 'Lyrics Studio', description: 'Текст песен', section: 'Студии' },
    ],
  },
  {
    id: 'community',
    title: 'Сообщество',
    icon: Users,
    defaultExpanded: false,
    items: [
      { path: '/blog', icon: BookOpen, label: 'Блог', description: 'Новости и статьи', section: 'Сообщество' },
      { path: '/artists', icon: Users, label: 'Авторы', description: 'ИИ-персоны', section: 'Сообщество' },
    ],
  },
];

// Admin section - separate from profile, shown prominently to admins
const adminSection: MenuSection = {
  id: 'admin',
  title: 'Администрирование',
  icon: Shield,
  defaultExpanded: false,
  items: [
    { path: '/admin', icon: Shield, label: 'Админ панель', badge: 'Admin', description: 'Управление', section: 'Администрирование' },
    { path: '/admin/moderation', icon: Flag, label: 'Модерация', description: 'Контент', section: 'Администрирование' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Аналитика', description: 'Статистика', section: 'Администрирование' },
    { path: '/admin/feedback', icon: MessageSquare, label: 'Обратная связь', description: 'Отзывы', section: 'Администрирование' },
  ],
};

export function MoreMenuSheet({ open, onOpenChange }: MoreMenuSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { hapticFeedback } = useTelegram();
  
  // Build sections list with admin section if user is admin
  const allSections = isAdmin ? [...menuSections, adminSection] : menuSections;

  // Flatten all items for search
  const allItems = useMemo(() => {
    return allSections.flatMap(section => section.items);
  }, [allSections]);

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
          {/* Search */}
          <MenuSearch 
            items={allItems} 
            onNavigate={handleNavigate}
            isActive={isActive}
          />

          {/* Quick Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <QuickActionsBar onClose={() => onOpenChange(false)} />
          </motion.div>

          <Separator />

          {/* Collapsible Sections */}
          {allSections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.05 }}
            >
              <CollapsibleMenuSection
                title={section.title}
                icon={section.icon}
                items={section.items}
                isActive={isActive}
                onNavigate={handleNavigate}
                defaultExpanded={section.defaultExpanded}
              />

              {sectionIndex < allSections.length - 1 && (
                <Separator className="mt-3" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Version info */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-[10px] tracking-wider text-muted-foreground/25 font-light">
            V0.1.0 · BETA · HOW2AI.AGENCY © 2025
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
