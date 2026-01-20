/**
 * Admin Dashboard Header Component
 * 
 * Header with title and refresh button for admin dashboard.
 * 
 * @module components/admin/dashboard/AdminDashboardHeader
 */

import { Button } from '@/components/ui/button';
import { Shield, RefreshCw } from 'lucide-react';

interface AdminDashboardHeaderProps {
  /** Callback to refresh all data */
  onRefresh: () => void;
}

/**
 * Admin dashboard header with title and refresh action
 * 
 * @example
 * ```tsx
 * <AdminDashboardHeader onRefresh={dashboard.refetchMetrics} />
 * ```
 */
export function AdminDashboardHeader({ onRefresh }: AdminDashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
        <Shield className="h-5 w-5 md:h-6 md:w-6" />
        <span className="hidden sm:inline">Админ-панель</span>
        <span className="sm:hidden">Админ</span>
      </h1>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Обновить</span>
      </Button>
    </div>
  );
}
