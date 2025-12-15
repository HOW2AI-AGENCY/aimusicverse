import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ModelUsageStats {
  model: string;
  count: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
}

export interface GenerationModeStats {
  mode: string;
  count: number;
  percentage: number;
}

export interface DailyGrowthStats {
  date: string;
  users: number;
  tracks: number;
  generations: number;
}

export interface ActiveUsersStats {
  daily_active: number;
  weekly_active: number;
  monthly_active: number;
  new_today: number;
  new_this_week: number;
}

export interface ErrorDistribution {
  error_type: string;
  count: number;
  percentage: number;
}

export interface ContentStats {
  total_plays: number;
  total_likes: number;
  total_comments: number;
  avg_plays_per_track: number;
  public_tracks_percentage: number;
}

export function useModelUsageStats(timeRange: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['model-usage-stats', timeRange],
    queryFn: async () => {
      const getTimeFilter = () => {
        const now = new Date();
        switch (timeRange) {
          case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      };

      const { data, error } = await supabase
        .from('generation_tasks')
        .select('model_used, status')
        .gte('created_at', getTimeFilter())
        .not('model_used', 'is', null);

      if (error) throw error;

      // Aggregate by model
      const modelMap = new Map<string, { total: number; success: number; failed: number }>();
      
      data?.forEach(task => {
        const model = task.model_used || 'unknown';
        const existing = modelMap.get(model) || { total: 0, success: 0, failed: 0 };
        existing.total++;
        if (task.status === 'completed') existing.success++;
        if (task.status === 'failed') existing.failed++;
        modelMap.set(model, existing);
      });

      const stats: ModelUsageStats[] = Array.from(modelMap.entries())
        .map(([model, stats]) => ({
          model,
          count: stats.total,
          success_count: stats.success,
          failed_count: stats.failed,
          success_rate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return stats;
    },
    refetchInterval: 60000,
  });
}

export function useGenerationModeStats(timeRange: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['generation-mode-stats', timeRange],
    queryFn: async () => {
      const getTimeFilter = () => {
        const now = new Date();
        switch (timeRange) {
          case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      };

      const { data, error } = await supabase
        .from('generation_tasks')
        .select('generation_mode')
        .gte('created_at', getTimeFilter());

      if (error) throw error;

      const modeMap = new Map<string, number>();
      data?.forEach(task => {
        const mode = task.generation_mode || 'standard';
        modeMap.set(mode, (modeMap.get(mode) || 0) + 1);
      });

      const total = data?.length || 0;
      const stats: GenerationModeStats[] = Array.from(modeMap.entries())
        .map(([mode, count]) => ({
          mode,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return stats;
    },
    refetchInterval: 60000,
  });
}

export function useActiveUsersStats() {
  return useQuery({
    queryKey: ['active-users-stats'],
    queryFn: async () => {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();

      // Get active users from generation_tasks
      const [
        { data: dailyActive },
        { data: weeklyActive },
        { data: monthlyActive },
        { count: newToday },
        { count: newThisWeek },
      ] = await Promise.all([
        supabase
          .from('generation_tasks')
          .select('user_id')
          .gte('created_at', dayAgo),
        supabase
          .from('generation_tasks')
          .select('user_id')
          .gte('created_at', weekAgo),
        supabase
          .from('generation_tasks')
          .select('user_id')
          .gte('created_at', monthAgo),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo),
      ]);

      const uniqueDaily = new Set(dailyActive?.map(d => d.user_id)).size;
      const uniqueWeekly = new Set(weeklyActive?.map(d => d.user_id)).size;
      const uniqueMonthly = new Set(monthlyActive?.map(d => d.user_id)).size;

      return {
        daily_active: uniqueDaily,
        weekly_active: uniqueWeekly,
        monthly_active: uniqueMonthly,
        new_today: newToday || 0,
        new_this_week: newThisWeek || 0,
      } as ActiveUsersStats;
    },
    refetchInterval: 60000,
  });
}

export function useErrorDistribution(timeRange: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['error-distribution', timeRange],
    queryFn: async () => {
      const getTimeFilter = () => {
        const now = new Date();
        switch (timeRange) {
          case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      };

      const { data, error } = await supabase
        .from('generation_tasks')
        .select('error_message')
        .eq('status', 'failed')
        .gte('created_at', getTimeFilter())
        .not('error_message', 'is', null);

      if (error) throw error;

      // Categorize errors
      const errorMap = new Map<string, number>();
      data?.forEach(task => {
        const msg = task.error_message?.toLowerCase() || '';
        let category = 'Другое';
        
        if (msg.includes('artist') || msg.includes('named') || msg.includes('celebrity')) {
          category = 'Имя артиста';
        } else if (msg.includes('lyrics') || msg.includes('empty') || msg.includes('malformed')) {
          category = 'Проблема с текстом';
        } else if (msg.includes('credit') || msg.includes('429')) {
          category = 'Лимит кредитов';
        } else if (msg.includes('timeout') || msg.includes('rate limit') || msg.includes('430')) {
          category = 'Rate limit';
        } else if (msg.includes('audio') || msg.includes('duration')) {
          category = 'Проблема с аудио';
        } else if (msg.includes('model') || msg.includes('version')) {
          category = 'Модель недоступна';
        }
        
        errorMap.set(category, (errorMap.get(category) || 0) + 1);
      });

      const total = data?.length || 0;
      const stats: ErrorDistribution[] = Array.from(errorMap.entries())
        .map(([error_type, count]) => ({
          error_type,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return stats;
    },
    refetchInterval: 60000,
  });
}

export function useContentStats() {
  return useQuery({
    queryKey: ['content-stats'],
    queryFn: async () => {
      const [
        { data: tracks },
        { count: totalLikes },
        { count: totalComments },
      ] = await Promise.all([
        supabase
          .from('tracks')
          .select('play_count, is_public')
          .eq('status', 'completed'),
        supabase
          .from('track_likes')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true }),
      ]);

      const totalTracks = tracks?.length || 0;
      const totalPlays = tracks?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      const publicTracks = tracks?.filter(t => t.is_public).length || 0;

      return {
        total_plays: totalPlays,
        total_likes: totalLikes || 0,
        total_comments: totalComments || 0,
        avg_plays_per_track: totalTracks > 0 ? totalPlays / totalTracks : 0,
        public_tracks_percentage: totalTracks > 0 ? (publicTracks / totalTracks) * 100 : 0,
      } as ContentStats;
    },
    refetchInterval: 60000,
  });
}

export function useSourceDistribution(timeRange: '24h' | '7d' | '30d' = '7d') {
  return useQuery({
    queryKey: ['source-distribution', timeRange],
    queryFn: async () => {
      const getTimeFilter = () => {
        const now = new Date();
        switch (timeRange) {
          case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      };

      const { data, error } = await supabase
        .from('generation_tasks')
        .select('source')
        .gte('created_at', getTimeFilter());

      if (error) throw error;

      const sourceMap = new Map<string, number>();
      data?.forEach(task => {
        const source = task.source || 'mini_app';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const total = data?.length || 0;
      return Array.from(sourceMap.entries())
        .map(([source, count]) => ({
          source,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
    refetchInterval: 60000,
  });
}
