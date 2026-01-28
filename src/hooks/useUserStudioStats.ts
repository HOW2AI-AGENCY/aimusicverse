/**
 * useUserStudioStats - Fetch real user statistics for professional dashboard
 * Aggregates data from tracks, stems, generation tasks, and user activity
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserStudioStats {
  // Track stats
  totalTracks: number;
  tracksThisWeek: number;
  tracksThisMonth: number;
  
  // Stem stats
  totalStems: number;
  stemsThisWeek: number;
  
  // Generation stats
  totalGenerations: number;
  successfulGenerations: number;
  generationSuccessRate: number;
  
  // MIDI stats
  totalMidiFiles: number;
  
  // Time stats
  totalStudioTime: number; // in minutes
  studioTimeThisWeek: number;
  
  // Activity stats
  lastActiveAt: string | null;
  streakDays: number;
  
  // Productivity metrics
  productivityScore: number;
  weeklyChange: {
    tracks: number;
    stems: number;
    generations: number;
  };
}

const defaultStats: UserStudioStats = {
  totalTracks: 0,
  tracksThisWeek: 0,
  tracksThisMonth: 0,
  totalStems: 0,
  stemsThisWeek: 0,
  totalGenerations: 0,
  successfulGenerations: 0,
  generationSuccessRate: 0,
  totalMidiFiles: 0,
  totalStudioTime: 0,
  studioTimeThisWeek: 0,
  lastActiveAt: null,
  streakDays: 0,
  productivityScore: 0,
  weeklyChange: {
    tracks: 0,
    stems: 0,
    generations: 0,
  },
};

export function useUserStudioStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-studio-stats', user?.id],
    queryFn: async (): Promise<UserStudioStats> => {
      if (!user?.id) return defaultStats;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Parallel queries for better performance
      const [
        tracksResult,
        tracksWeekResult,
        tracksMonthResult,
        tracksPrevWeekResult,
        stemsResult,
        stemsWeekResult,
        stemsPrevWeekResult,
        generationsResult,
        successfulGenerationsResult,
        midiResult,
        userCreditsResult,
      ] = await Promise.all([
        // Total tracks
        supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Tracks this week
        supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString()),
        
        // Tracks this month
        supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthAgo.toISOString()),
        
        // Tracks previous week (for comparison)
        supabase
          .from('tracks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString()),
        
        // Total stems
        supabase
          .from('track_stems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Stems this week
        supabase
          .from('track_stems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString()),
        
        // Stems previous week
        supabase
          .from('track_stems')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', twoWeeksAgo.toISOString())
          .lt('created_at', weekAgo.toISOString()),
        
        // Total generations
        supabase
          .from('generation_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Successful generations
        supabase
          .from('generation_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        
        // MIDI files (from guitar_recordings table)
        supabase
          .from('guitar_recordings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('midi_url', 'is', null),
        
        // User credits for streak info
        supabase
          .from('user_credits')
          .select('current_streak, updated_at')
          .eq('user_id', user.id)
          .single(),
      ]);

      const totalTracks = tracksResult.count || 0;
      const tracksThisWeek = tracksWeekResult.count || 0;
      const tracksThisMonth = tracksMonthResult.count || 0;
      const tracksPrevWeek = tracksPrevWeekResult.count || 0;
      
      const totalStems = stemsResult.count || 0;
      const stemsThisWeek = stemsWeekResult.count || 0;
      const stemsPrevWeek = stemsPrevWeekResult.count || 0;
      
      const totalGenerations = generationsResult.count || 0;
      const successfulGenerations = successfulGenerationsResult.count || 0;
      
      const totalMidiFiles = midiResult.count || 0;
      
      const streakDays = userCreditsResult.data?.current_streak || 0;
      const lastActiveAt = userCreditsResult.data?.updated_at || null;

      // Calculate success rate
      const generationSuccessRate = totalGenerations > 0 
        ? Math.round((successfulGenerations / totalGenerations) * 100) 
        : 0;

      // Calculate productivity score (0-100)
      const productivityScore = Math.min(100, Math.round(
        (tracksThisWeek * 10) + 
        (stemsThisWeek * 2) + 
        (streakDays * 5) + 
        (generationSuccessRate * 0.3)
      ));

      // Calculate weekly changes
      const weeklyChange = {
        tracks: tracksThisWeek - tracksPrevWeek,
        stems: stemsThisWeek - stemsPrevWeek,
        generations: 0, // Would need additional query
      };

      // Estimate studio time based on tracks and stems
      const totalStudioTime = (totalTracks * 5) + (totalStems * 2) + (totalMidiFiles * 3);
      const studioTimeThisWeek = (tracksThisWeek * 5) + (stemsThisWeek * 2);

      return {
        totalTracks,
        tracksThisWeek,
        tracksThisMonth,
        totalStems,
        stemsThisWeek,
        totalGenerations,
        successfulGenerations,
        generationSuccessRate,
        totalMidiFiles,
        totalStudioTime,
        studioTimeThisWeek,
        lastActiveAt,
        streakDays,
        productivityScore,
        weeklyChange,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Format studio time in human readable format
 */
export function formatStudioTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}ч`;
  }
  return `${hours}ч ${mins}м`;
}

/**
 * Get change indicator for stats
 */
export function getChangeIndicator(change: number): { sign: string; color: string; trend: 'up' | 'down' | 'neutral' } {
  if (change > 0) {
    return { sign: `+${change}`, color: 'text-green-400', trend: 'up' };
  }
  if (change < 0) {
    return { sign: `${change}`, color: 'text-red-400', trend: 'down' };
  }
  return { sign: '0', color: 'text-muted-foreground', trend: 'neutral' };
}
