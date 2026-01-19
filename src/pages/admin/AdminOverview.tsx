/**
 * AdminOverview - Overview tab for admin dashboard
 */
import { useAdminStats } from "@/hooks/useAdminUsers";
import { StatCard, StatGrid } from "@/components/admin/StatCard";
import { QuickActionsPanel } from "@/components/admin/QuickActionsPanel";
import { HealthCheckPanel } from "@/components/admin/HealthCheckPanel";
import { Users, Music, FolderKanban, ListMusic, TrendingUp, Activity } from "lucide-react";

export default function AdminOverview() {
  const { data: stats } = useAdminStats();

  return (
    <div className="space-y-4">
      <QuickActionsPanel />
      <StatGrid columns={6}>
        <StatCard title="Пользователи" value={stats?.totalUsers || 0} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Треки" value={stats?.totalTracks || 0} icon={<Music className="h-4 w-4" />} />
        <StatCard title="Проекты" value={stats?.totalProjects || 0} icon={<FolderKanban className="h-4 w-4" />} />
        <StatCard title="Плейлисты" value={stats?.totalPlaylists || 0} icon={<ListMusic className="h-4 w-4" />} />
        <StatCard title="Публичные" value={stats?.publicTracks || 0} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="Генераций" value={stats?.generationTasks || 0} icon={<Activity className="h-4 w-4" />} />
      </StatGrid>
      <HealthCheckPanel />
    </div>
  );
}
