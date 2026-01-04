/**
 * Generation Statistics Panel for Admin Dashboard
 * 
 * Displays aggregated generation statistics from user_generation_stats table
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Music, 
  Mic, 
  Guitar, 
  Scissors, 
  Layers,
  RefreshCw,
  Coins,
  Users,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { format } from '@/lib/date-utils';

interface AggregatedStats {
  total_generations: number;
  total_successful: number;
  total_failed: number;
  total_music: number;
  total_vocals: number;
  total_instrumental: number;
  total_extend: number;
  total_stems: number;
  total_cover: number;
  total_cost: number;
  total_credits_spent: number;
  unique_users: number;
  avg_per_user: number;
}

interface DailyStats {
  date: string;
  generations_count: number;
  successful_count: number;
  failed_count: number;
  music_count: number;
  vocals_count: number;
  instrumental_count: number;
  extend_count: number;
  stems_count: number;
  cover_count: number;
  estimated_cost: number;
  credits_spent: number;
}

interface TopUser {
  user_id: string;
  first_name: string;
  username: string | null;
  photo_url: string | null;
  total_generations: number;
  total_cost: number;
}

const TIME_PERIODS = [
  { value: '7', label: 'Последние 7 дней' },
  { value: '14', label: 'Последние 14 дней' },
  { value: '30', label: 'Последние 30 дней' },
  { value: '90', label: 'Последние 90 дней' },
];

export function GenerationStatsPanel() {
  const [days, setDays] = useState('7');

  // Fetch aggregated stats
  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['admin-generation-stats', days],
    queryFn: async (): Promise<AggregatedStats> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const { data, error } = await supabase
        .from('user_generation_stats')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0]);
      
      if (error) throw error;

      const aggregated: AggregatedStats = {
        total_generations: 0,
        total_successful: 0,
        total_failed: 0,
        total_music: 0,
        total_vocals: 0,
        total_instrumental: 0,
        total_extend: 0,
        total_stems: 0,
        total_cover: 0,
        total_cost: 0,
        total_credits_spent: 0,
        unique_users: new Set(data?.map(d => d.user_id)).size,
        avg_per_user: 0
      };

      data?.forEach(row => {
        aggregated.total_generations += row.generations_count || 0;
        aggregated.total_successful += row.successful_count || 0;
        aggregated.total_failed += row.failed_count || 0;
        aggregated.total_music += row.music_count || 0;
        aggregated.total_vocals += row.vocals_count || 0;
        aggregated.total_instrumental += row.instrumental_count || 0;
        aggregated.total_extend += row.extend_count || 0;
        aggregated.total_stems += row.stems_count || 0;
        aggregated.total_cover += row.cover_count || 0;
        aggregated.total_cost += Number(row.estimated_cost) || 0;
        aggregated.total_credits_spent += row.credits_spent || 0;
      });

      aggregated.avg_per_user = aggregated.unique_users > 0 
        ? aggregated.total_generations / aggregated.unique_users 
        : 0;

      return aggregated;
    },
    staleTime: 60000,
  });

  // Fetch daily breakdown
  const { data: dailyStats } = useQuery({
    queryKey: ['admin-generation-daily', days],
    queryFn: async (): Promise<DailyStats[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      const { data, error } = await supabase
        .from('user_generation_stats')
        .select('date, generations_count, successful_count, failed_count, music_count, vocals_count, instrumental_count, extend_count, stems_count, cover_count, estimated_cost, credits_spent')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      if (error) throw error;

      // Group by date
      const byDate = new Map<string, DailyStats>();
      data?.forEach(row => {
        const existing = byDate.get(row.date) || {
          date: row.date,
          generations_count: 0,
          successful_count: 0,
          failed_count: 0,
          music_count: 0,
          vocals_count: 0,
          instrumental_count: 0,
          extend_count: 0,
          stems_count: 0,
          cover_count: 0,
          estimated_cost: 0,
          credits_spent: 0
        };
        
        existing.generations_count += row.generations_count || 0;
        existing.successful_count += row.successful_count || 0;
        existing.failed_count += row.failed_count || 0;
        existing.music_count += row.music_count || 0;
        existing.vocals_count += row.vocals_count || 0;
        existing.instrumental_count += row.instrumental_count || 0;
        existing.extend_count += row.extend_count || 0;
        existing.stems_count += row.stems_count || 0;
        existing.cover_count += row.cover_count || 0;
        existing.estimated_cost += Number(row.estimated_cost) || 0;
        existing.credits_spent += row.credits_spent || 0;
        
        byDate.set(row.date, existing);
      });

      return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
    },
    staleTime: 60000,
  });

  // Fetch top users
  const { data: topUsers } = useQuery({
    queryKey: ['admin-generation-top-users', days],
    queryFn: async (): Promise<TopUser[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      
      // Get generation stats grouped by user
      const { data: statsData, error: statsError } = await supabase
        .from('user_generation_stats')
        .select('user_id, generations_count, estimated_cost')
        .gte('date', startDate.toISOString().split('T')[0]);
      
      if (statsError) throw statsError;

      // Aggregate by user
      const userTotals = new Map<string, { generations: number; cost: number }>();
      statsData?.forEach(row => {
        const existing = userTotals.get(row.user_id) || { generations: 0, cost: 0 };
        existing.generations += row.generations_count || 0;
        existing.cost += Number(row.estimated_cost) || 0;
        userTotals.set(row.user_id, existing);
      });

      // Sort and get top 10
      const topUserIds = Array.from(userTotals.entries())
        .sort((a, b) => b[1].generations - a[1].generations)
        .slice(0, 10)
        .map(([id]) => id);

      if (topUserIds.length === 0) return [];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, username, photo_url')
        .in('user_id', topUserIds);

      return topUserIds.map(userId => {
        const profile = profiles?.find(p => p.user_id === userId);
        const totals = userTotals.get(userId)!;
        return {
          user_id: userId,
          first_name: profile?.first_name || 'Unknown',
          username: profile?.username || null,
          photo_url: profile?.photo_url || null,
          total_generations: totals.generations,
          total_cost: totals.cost
        };
      });
    },
    staleTime: 60000,
  });

  const successRate = stats && stats.total_generations > 0
    ? ((stats.total_successful / stats.total_generations) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-bold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <span className="truncate">Генерации</span>
          </h2>
          <p className="text-[10px] md:text-sm text-muted-foreground">
            Агрегированные данные
          </p>
        </div>
        <div className="flex gap-1.5">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[100px] md:w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => refetch()}>
            <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Stats Grid - compact for mobile */}
      <div className="grid grid-cols-4 gap-1.5 md:gap-3">
        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-primary/10 w-fit mx-auto mb-1">
                <Activity className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
              <div className="text-sm md:text-xl font-bold">
                {stats?.total_generations?.toLocaleString() || 0}
              </div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Ген.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-green-500/10 w-fit mx-auto mb-1">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
              </div>
              <div className="text-sm md:text-xl font-bold text-green-600">
                {successRate}%
              </div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Усп.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-blue-500/10 w-fit mx-auto mb-1">
                <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
              </div>
              <div className="text-sm md:text-xl font-bold">
                {stats?.unique_users || 0}
              </div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Юзеров</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-amber-500/10 w-fit mx-auto mb-1">
                <Coins className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
              </div>
              <div className="text-sm md:text-xl font-bold">
                {stats?.total_credits_spent?.toLocaleString() || 0}
              </div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Кред.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Types Breakdown */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs md:text-sm">По типам</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-6 gap-1">
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Music className="h-3 w-3 md:h-4 md:w-4 mx-auto text-violet-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_music || 0}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Муз.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Mic className="h-3 w-3 md:h-4 md:w-4 mx-auto text-pink-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_vocals || 0}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Вок.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Guitar className="h-3 w-3 md:h-4 md:w-4 mx-auto text-orange-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_instrumental || 0}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Инстр.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mx-auto text-cyan-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_extend || 0}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Ext.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Scissors className="h-3 w-3 md:h-4 md:w-4 mx-auto text-green-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_stems || 0}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Стем.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Layers className="h-3 w-3 md:h-4 md:w-4 mx-auto text-indigo-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_cover || 0}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground">Кав.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Daily Breakdown */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm">По дням</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[180px] md:h-[250px]">
              <div className="space-y-1.5">
                {dailyStats?.map(day => (
                  <div key={day.date} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/50">
                    <div>
                      <div className="font-medium text-xs">
                        {format(new Date(day.date), 'dd MMM')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        <span className="text-green-600">✓{day.successful_count}</span>
                        {day.failed_count > 0 && (
                          <span className="text-red-500 ml-1">✗{day.failed_count}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      {day.generations_count}
                    </Badge>
                  </div>
                ))}
                {(!dailyStats || dailyStats.length === 0) && (
                  <div className="text-center text-muted-foreground py-6 text-xs">
                    Нет данных
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm">Топ юзеров</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[180px] md:h-[250px]">
              <div className="space-y-1.5">
                {topUsers?.map((user, idx) => (
                  <div key={user.user_id} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted/50">
                    <span className="text-[10px] text-muted-foreground w-3">{idx + 1}</span>
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium overflow-hidden flex-shrink-0">
                      {user.photo_url ? (
                        <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.first_name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{user.first_name}</div>
                      {user.username && (
                        <div className="text-[10px] text-muted-foreground truncate">@{user.username}</div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {user.total_generations}
                    </Badge>
                  </div>
                ))}
                {(!topUsers || topUsers.length === 0) && (
                  <div className="text-center text-muted-foreground py-6 text-xs">
                    Нет данных
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
