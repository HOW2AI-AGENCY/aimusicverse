/**
 * Admin Layout Component
 * 
 * Provides consistent layout for all admin sub-pages with:
 * - Sidebar navigation (desktop)
 * - Bottom tabs (mobile)
 * - Breadcrumbs
 * - Common header
 * 
 * Architecture:
 * - Uses Outlet for nested routes
 * - Lazy loads sub-pages for performance
 * - Responsive layout adapts to screen size
 * 
 * TODO: Add role-based access control
 * TODO: Add activity log sidebar
 * TODO: Add quick search (Cmd+K)
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

import { Suspense } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard,
  Users,
  Music2,
  Bot,
  Send,
  Bell,
  CreditCard,
  Settings,
  BarChart3,
  Shield,
  Coins,
} from 'lucide-react';

// ============================================================
// Navigation Configuration
// ============================================================
interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  description?: string;
}

/**
 * Admin navigation items
 * Ordered by frequency of use
 * 
 * TODO: Add role-based filtering
 */
const NAV_ITEMS: NavItem[] = [
  {
    path: '/admin',
    label: 'Обзор',
    icon: LayoutDashboard,
    description: 'Основные метрики и статистика',
  },
  {
    path: '/admin/users',
    label: 'Пользователи',
    icon: Users,
    description: 'Управление пользователями и балансами',
  },
  {
    path: '/admin/tracks',
    label: 'Треки',
    icon: Music2,
    description: 'Модерация и статистика треков',
  },
  {
    path: '/admin/economy',
    label: 'Экономика',
    icon: Coins,
    description: 'Кредиты, тарифы, платежи',
  },
  {
    path: '/admin/analytics',
    label: 'Аналитика',
    icon: BarChart3,
    description: 'Детальная аналитика и отчёты',
  },
  {
    path: '/admin/bot',
    label: 'Telegram Бот',
    icon: Bot,
    description: 'Настройки бота и меню',
  },
  {
    path: '/admin/broadcast',
    label: 'Рассылки',
    icon: Send,
    description: 'Массовые уведомления',
  },
  {
    path: '/admin/alerts',
    label: 'Алерты',
    icon: Bell,
    description: 'Мониторинг и уведомления',
  },
  {
    path: '/admin/moderation',
    label: 'Модерация',
    icon: Shield,
    description: 'Жалобы и модерация контента',
  },
  {
    path: '/admin/settings',
    label: 'Настройки',
    icon: Settings,
    description: 'Системные настройки',
  },
];

// ============================================================
// Loading Skeleton
// ============================================================
const AdminPageSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-lg" />
  </div>
);

// ============================================================
// Desktop Sidebar
// ============================================================
const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h1 className="text-lg font-semibold text-foreground">
          Админ-панель
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          MusicVerse AI
        </p>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                  'text-sm font-medium transition-colors',
                  'hover:bg-accent/50',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          v2.0.0 · Modular Admin
        </p>
      </div>
    </aside>
  );
};

// ============================================================
// Mobile Bottom Navigation
// ============================================================
const AdminMobileNav = () => {
  const location = useLocation();
  
  // Show only first 5 items on mobile
  const mobileItems = NAV_ITEMS.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg',
                'text-xs font-medium transition-colors min-w-[56px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="truncate max-w-[48px]">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

// ============================================================
// Main Layout Component
// ============================================================
export function AdminLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content */}
        <div className={cn(
          'flex-1 overflow-auto',
          isMobile && 'pb-20' // Space for mobile nav
        )}>
          <Suspense fallback={<AdminPageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminMobileNav />
    </div>
  );
}

export default AdminLayout;
