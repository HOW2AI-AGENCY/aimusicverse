/**
 * Admin Overview Page
 * 
 * Dashboard landing page with:
 * - Key metrics summary (users, tracks, revenue)
 * - Quick actions
 * - Recent activity
 * - System health status
 * 
 * TODO: Add real-time updates via Supabase Realtime
 * TODO: Add date range selector for metrics
 * TODO: Add export functionality
 * 
 * @author MusicVerse AI
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { QuickActionsPanel } from '../QuickActionsPanel';
import { 
  Users, 
  Music2, 
  TrendingUp, 
  Activity,
  Zap,
  Star,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============================================================
// Types
// ============================================================
interface OverviewStats {
  totalUsers: number;
  totalTracks: number;
  totalGenerations: number;
  activeToday: number;
  recentTracks: Array<{
    id: string;
    title: string | null;
    created_at: string | null;
    status: string | null;
  }>;
}

// ============================================================
// Data Fetching Hook
// ============================================================
function useOverviewStats() {
  return useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: async (): Promise<OverviewStats> => {
      // Parallel queries for performance
      const [usersResult, tracksResult, generationsResult, recentResult] = await Promise.all([
        // Total users count
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        
        // Total tracks count
        supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true }),
        
        // Total generations today
        supabase
          .from('generation_tasks')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Recent tracks
        supabase
          .from('tracks')
          .select('id, title, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalTracks: tracksResult.count || 0,
        totalGenerations: generationsResult.count || 0,
        activeToday: generationsResult.count || 0,
        recentTracks: recentResult.data || [],
      };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// ============================================================
// Stat Card Component
// ============================================================
interface StatCardProps {
  title: string;
  value: number | string;
  icon: typeof Users;
  trend?: number;
  loading?: boolean;
}

const StatCard = ({ title, value, icon: Icon, trend, loading }: StatCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:bg-accent/5 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
            {trend !== undefined && (
              <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? '+' : ''}{trend}% за сегодня
              </p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// Recent Activity Component
// ============================================================
interface RecentActivityProps {
  tracks: OverviewStats['recentTracks'];
  loading?: boolean;
}

const RecentActivity = ({ tracks, loading }: RecentActivityProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Последние треки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Последние треки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет треков
          </p>
        ) : (
          tracks.map((track) => (
            <div 
              key={track.id} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <Music2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{track.title || 'Без названия'}</p>
                <p className="text-xs text-muted-foreground">
                  {track.created_at ? formatDistanceToNow(new Date(track.created_at), { 
                    addSuffix: true, 
                    locale: ru 
                  }) : '—'}
                </p>
              </div>
              <Badge 
                variant={track.status === 'completed' ? 'default' : 'secondary'}
                className="shrink-0 text-xs"
              >
                {track.status === 'completed' ? 'Готов' : track.status || '—'}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================
// Main Component
// ============================================================
export function AdminOverview() {
  const { data: stats, isLoading } = useOverviewStats();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Обзор</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Основные метрики и статистика платформы
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Пользователей"
          value={stats?.totalUsers || 0}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Треков"
          value={stats?.totalTracks || 0}
          icon={Music2}
          loading={isLoading}
        />
        <StatCard
          title="Генераций сегодня"
          value={stats?.totalGenerations || 0}
          icon={Zap}
          loading={isLoading}
        />
        <StatCard
          title="Активных сегодня"
          value={stats?.activeToday || 0}
          icon={Activity}
          loading={isLoading}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />
              Быстрые действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActionsPanel />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity 
          tracks={stats?.recentTracks || []} 
          loading={isLoading} 
        />
      </div>

      {/* TODO: Add more sections */}
      {/* 
        - System health status
        - Error rate chart
        - Top users leaderboard
        - Revenue metrics
      */}
    </div>
  );
}

export default AdminOverview;
