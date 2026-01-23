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
  // Run all queries in parallel
  const [tracksResult, usersResult, generationsResult, playsResult] = await Promise.all([
    // Count completed tracks
    supabase
      .from('tracks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    
    // Count active users (profiles)
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true }),
    
    // Count generation tasks
    supabase
      .from('generation_tasks')
      .select('id', { count: 'exact', head: true }),
    
    // Sum all play counts
    supabase
      .from('tracks')
      .select('play_count')
      .eq('status', 'completed')
  ]);

  // Calculate total plays
  const totalPlays = playsResult.data?.reduce((acc, track) => acc + (track.play_count || 0), 0) || 0;

  return {
    tracksCount: tracksResult.count || 0,
    usersCount: usersResult.count || 0,
    generationsCount: generationsResult.count || 0,
    totalPlays,
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
