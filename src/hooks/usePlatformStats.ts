/**
 * usePlatformStats - Public platform statistics hook
 * Fetches real-time counts for tracks, users, generations, and plays
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlatformStats {
  tracksCount: number;
  usersCount: number;
  generationsCount: number;
  totalPlays: number;
}

interface FormattedStats {
  tracks: string;
  users: string;
  generations: string;
  plays: string;
}

/**
 * Format large numbers with K/M suffix
 */
function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K+`;
  }
  return `${num}+`;
}

/**
 * Fetch platform statistics from database
 */
async function fetchPlatformStats(): Promise<PlatformStats> {
  // Use SECURITY DEFINER function to bypass RLS for anonymous users
  const { data, error } = await supabase.rpc('get_platform_stats');

  if (error || !data) {
    // Fallback: query only publicly accessible tables
    const { count: tracksCount } = await supabase
      .from('tracks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    return {
      tracksCount: tracksCount || 0,
      usersCount: 0,
      generationsCount: 0,
      totalPlays: 0,
    };
  }

  const stats = data as Record<string, number>;
  return {
    tracksCount: stats.tracks_count || 0,
    usersCount: stats.users_count || 0,
    generationsCount: stats.generations_count || 0,
    totalPlays: stats.total_plays || 0,
  };
}

/**
 * Hook to get formatted platform statistics
 */
export function usePlatformStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  const formatted: FormattedStats = {
    tracks: data ? formatCount(data.tracksCount) : '...',
    users: data ? formatCount(data.usersCount) : '...',
    generations: data ? formatCount(data.generationsCount) : '...',
    plays: data ? formatCount(data.totalPlays) : '...',
  };

  return {
    stats: data,
    formatted,
    isLoading,
    error,
  };
}
