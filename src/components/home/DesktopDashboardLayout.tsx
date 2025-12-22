/**
 * Desktop Dashboard Layout - Two-column layout for homepage on desktop
 * Main content (2/3) + Right sidebar widgets (1/3)
 */

import { lazy, Suspense, ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { SectionSkeleton } from '@/components/lazy/LazySection';
import { cn } from '@/lib/utils';

const DailyCheckin = lazy(() => import('@/components/gamification/DailyCheckin').then(m => ({ default: m.DailyCheckin })));
const CompactStatsWidget = lazy(() => import('@/components/home/CompactStatsWidget').then(m => ({ default: m.CompactStatsWidget })));
const FollowingFeed = lazy(() => import('@/components/social/FollowingFeed').then(m => ({ default: m.FollowingFeed })));

interface DesktopDashboardLayoutProps {
  children: ReactNode;
  showRightSidebar?: boolean;
  className?: string;
}

export function DesktopDashboardLayout({ 
  children, 
  showRightSidebar = true,
  className 
}: DesktopDashboardLayoutProps) {
  return (
    <div className={cn("flex gap-6", className)}>
      {/* Main Content - 2/3 width */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Right Sidebar - 1/3 width */}
      {showRightSidebar && (
        <motion.aside
          className="w-80 xl:w-96 flex-shrink-0 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Daily Checkin Widget */}
          <Suspense fallback={<SectionSkeleton height="120px" />}>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <h3 className="text-sm font-semibold mb-3">Ежедневный чекин</h3>
              <DailyCheckin />
            </div>
          </Suspense>

          {/* Stats Widget */}
          <Suspense fallback={<SectionSkeleton height="100px" />}>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <h3 className="text-sm font-semibold mb-3">Статистика</h3>
              <CompactStatsWidget />
            </div>
          </Suspense>

          {/* Following Feed Widget */}
          <Suspense fallback={<SectionSkeleton height="200px" />}>
            <div className="bg-card rounded-xl border border-border/50 p-4">
              <h3 className="text-sm font-semibold mb-3">Подписки</h3>
              <FollowingFeed />
            </div>
          </Suspense>
        </motion.aside>
      )}
    </div>
  );
}