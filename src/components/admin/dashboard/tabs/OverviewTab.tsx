/**
 * Admin Overview Tab Component
 * 
 * Quick actions, stats grid, and health check for admin dashboard.
 * 
 * @module components/admin/dashboard/tabs/OverviewTab
 */

import { Users, Music, FolderKanban, ListMusic, Activity, TrendingUp } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/admin/StatCard';
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel';
import { HealthCheckPanel } from '@/components/admin/HealthCheckPanel';

interface OverviewTabProps {
  stats: {
    totalUsers: number;
    totalTracks: number;
    totalProjects: number;
    totalPlaylists: number;
    publicTracks: number;
    generationTasks: number;
  } | undefined;
}

/**
 * Overview tab content with stats and quick actions
 */
export function OverviewTab({ stats }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <QuickActionsPanel />
      <StatGrid columns={6}>
        <StatCard 
          title="Пользователи" 
          value={stats?.totalUsers || 0} 
          icon={<Users className="h-4 w-4" />} 
        />
        <StatCard 
          title="Треки" 
          value={stats?.totalTracks || 0} 
          icon={<Music className="h-4 w-4" />} 
        />
        <StatCard 
          title="Проекты" 
          value={stats?.totalProjects || 0} 
          icon={<FolderKanban className="h-4 w-4" />} 
        />
        <StatCard 
          title="Плейлисты" 
          value={stats?.totalPlaylists || 0} 
          icon={<ListMusic className="h-4 w-4" />} 
        />
        <StatCard 
          title="Публичные" 
          value={stats?.publicTracks || 0} 
          icon={<TrendingUp className="h-4 w-4" />} 
        />
        <StatCard 
          title="Генераций" 
          value={stats?.generationTasks || 0} 
          icon={<Activity className="h-4 w-4" />} 
        />
      </StatGrid>
      <HealthCheckPanel />
    </div>
  );
}
