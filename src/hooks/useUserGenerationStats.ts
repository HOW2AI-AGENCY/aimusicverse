/**
 * Hook for user generation statistics
 * Provides today's and total generation counts, types, and costs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserGenerationStats {
  today: {
    generations: number;
    successful: number;
    failed: number;
    cost: number;
  };
  total: {
    generations: number;
    successful: number;
    failed: number;
    cost: number;
  };
  byType: {
    music: number;
    vocals: number;
    instrumental: number;
    extend: number;
    stems: number;
    cover: number;
  };
  // Recent days for trend display
  recentDays: Array<{
    date: string;
    generations: number;
    successful: number;
  }>;
}

const defaultStats: UserGenerationStats = {
  today: { generations: 0, successful: 0, failed: 0, cost: 0 },
  total: { generations: 0, successful: 0, failed: 0, cost: 0 },
  byType: { music: 0, vocals: 0, instrumental: 0, extend: 0, stems: 0, cover: 0 },
  recentDays: [],
};

export function useUserGenerationStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-generation-stats', user?.id],
    queryFn: async (): Promise<UserGenerationStats> => {
      if (!user?.id) return defaultStats;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's stats
      const { data: todayStats } = await supabase
        .from('user_generation_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      
      // Fetch last 7 days for trend
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentStats } = await supabase
        .from('user_generation_stats')
        .select('date, generations_count, successful_count, failed_count, estimated_cost, music_count, vocals_count, instrumental_count, extend_count, stems_count, cover_count')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });
      
      // Calculate totals from recent data
      const totals = recentStats?.reduce(
        (acc, row) => ({
          generations: acc.generations + (row.generations_count || 0),
          successful: acc.successful + (row.successful_count || 0),
          failed: acc.failed + (row.failed_count || 0),
          cost: acc.cost + Number(row.estimated_cost || 0),
          music: acc.music + (row.music_count || 0),
          vocals: acc.vocals + (row.vocals_count || 0),
          instrumental: acc.instrumental + (row.instrumental_count || 0),
          extend: acc.extend + (row.extend_count || 0),
          stems: acc.stems + (row.stems_count || 0),
          cover: acc.cover + (row.cover_count || 0),
        }),
        { generations: 0, successful: 0, failed: 0, cost: 0, music: 0, vocals: 0, instrumental: 0, extend: 0, stems: 0, cover: 0 }
      ) || { generations: 0, successful: 0, failed: 0, cost: 0, music: 0, vocals: 0, instrumental: 0, extend: 0, stems: 0, cover: 0 };
      
      return {
        today: {
          generations: todayStats?.generations_count || 0,
          successful: todayStats?.successful_count || 0,
          failed: todayStats?.failed_count || 0,
          cost: Number(todayStats?.estimated_cost || 0),
        },
        total: {
          generations: totals.generations,
          successful: totals.successful,
          failed: totals.failed,
          cost: totals.cost,
        },
        byType: {
          music: totals.music,
          vocals: totals.vocals,
          instrumental: totals.instrumental,
          extend: totals.extend,
          stems: totals.stems,
          cover: totals.cover,
        },
        recentDays: recentStats?.map(row => ({
          date: row.date,
          generations: row.generations_count || 0,
          successful: row.successful_count || 0,
        })) || [],
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Get total generation count for all time
 */
export function useTotalGenerationCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['total-generation-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;
      
      const { count } = await supabase
        .from('generation_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}
