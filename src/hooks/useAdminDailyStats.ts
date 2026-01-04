/**
 * Hook for daily admin stats notification
 * Shows app statistics to admins once per day
 */

import { useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminStats } from '@/hooks/useAdminUsers';
import { toast } from 'sonner';
import { Users, Music, FolderOpen, Mic } from 'lucide-react';

const ADMIN_STATS_STORAGE_KEY = 'admin_daily_stats_shown';

export function useAdminDailyStats() {
  const { isAdmin, isLoading: rolesLoading } = useUserRole();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  useEffect(() => {
    // Only run for admins when data is ready
    if (rolesLoading || statsLoading || !isAdmin || !stats) return;

    // Check if already shown today
    const lastShown = localStorage.getItem(ADMIN_STATS_STORAGE_KEY);
    const today = new Date().toDateString();
    
    if (lastShown === today) return;

    // Show stats notification after a short delay
    const timer = setTimeout(() => {
      const message = [
        `👥 Пользователей: ${stats.totalUsers?.toLocaleString() || 0}`,
        `🎵 Треков: ${stats.totalTracks?.toLocaleString() || 0}`,
        `📁 Проектов: ${stats.totalProjects?.toLocaleString() || 0}`,
        `🎤 Публичных: ${stats.publicTracks?.toLocaleString() || 0}`,
      ].join('\n');

      toast.info('Статистика приложения', {
        description: message,
        duration: 8000,
        action: {
          label: 'Подробнее',
          onClick: () => window.location.href = '/admin/analytics',
        },
      });

      // Mark as shown today
      localStorage.setItem(ADMIN_STATS_STORAGE_KEY, today);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAdmin, rolesLoading, stats, statsLoading]);
}
