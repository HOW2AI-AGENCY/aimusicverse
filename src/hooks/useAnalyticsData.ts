/**
 * Analytics Data Hook
 * Extended analytics with time-series data for charts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface DailyLikes {
  date: string;
  likes: number;
  plays: number;
}

export interface GenreStats {
  genre: string;
  count: number;
  percentage: number;
}

export interface WeeklySummary {
  tracks: number;
  likes: number;
  plays: number;
  followers: number;
  tracksChange: number;
  likesChange: number;
  playsChange: number;
}

export interface AnalyticsData {
  dailyEngagement: DailyLikes[];
  genreDistribution: GenreStats[];
  weeklySummary: WeeklySummary;
  topTrack: {
    id: string;
    title: string;
    plays: number;
    likes: number;
  } | null;
}

export function useAnalyticsData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics-data', user?.id],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) {
        return {
          dailyEngagement: [],
          genreDistribution: [],
          weeklySummary: {
            tracks: 0,
            likes: 0,
            plays: 0,
            followers: 0,
            tracksChange: 0,
            likesChange: 0,
            playsChange: 0,
          },
          topTrack: null,
        };
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = subDays(weekStart, 7);

      // Fetch tracks for the user
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, title, style, created_at, likes_count, play_count, status')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const allTracks = tracks || [];

      // Calculate daily engagement for last 7 days
      const dailyEngagement: DailyLikes[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayLabel = format(date, 'EEE', { locale: ru });
        
        // Count tracks created on this day
        const dayTracks = allTracks.filter(t => 
          t.created_at?.startsWith(dateStr)
        );
        
        dailyEngagement.push({
          date: dayLabel,
          likes: dayTracks.reduce((sum, t) => sum + (t.likes_count || 0), 0),
          plays: dayTracks.reduce((sum, t) => sum + (t.play_count || 0), 0),
        });
      }

      // Calculate genre distribution
      const genreCounts: Record<string, number> = {};
      allTracks.forEach(track => {
        const style = track.style || 'Без жанра';
        // Extract primary genre from style string
        const genre = style.split(',')[0]?.trim() || 'Без жанра';
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });

      const totalTracks = allTracks.length;
      const genreDistribution: GenreStats[] = Object.entries(genreCounts)
        .map(([genre, count]) => ({
          genre,
          count,
          percentage: totalTracks > 0 ? Math.round((count / totalTracks) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate weekly summary
      const thisWeekTracks = allTracks.filter(t => {
        const created = new Date(t.created_at || 0);
        return created >= weekStart && created <= weekEnd;
      });
      
      const lastWeekTracks = allTracks.filter(t => {
        const created = new Date(t.created_at || 0);
        return created >= lastWeekStart && created < weekStart;
      });

      const thisWeekLikes = thisWeekTracks.reduce((sum, t) => sum + (t.likes_count || 0), 0);
      const lastWeekLikes = lastWeekTracks.reduce((sum, t) => sum + (t.likes_count || 0), 0);
      
      const thisWeekPlays = thisWeekTracks.reduce((sum, t) => sum + (t.play_count || 0), 0);
      const lastWeekPlays = lastWeekTracks.reduce((sum, t) => sum + (t.play_count || 0), 0);

      const weeklySummary: WeeklySummary = {
        tracks: thisWeekTracks.length,
        likes: thisWeekLikes,
        plays: thisWeekPlays,
        followers: 0, // Would need followers table
        tracksChange: thisWeekTracks.length - lastWeekTracks.length,
        likesChange: thisWeekLikes - lastWeekLikes,
        playsChange: thisWeekPlays - lastWeekPlays,
      };

      // Find top track
      const topTrack = allTracks
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))[0];

      return {
        dailyEngagement,
        genreDistribution,
        weeklySummary,
        topTrack: topTrack ? {
          id: topTrack.id,
          title: topTrack.title || 'Без названия',
          plays: topTrack.play_count || 0,
          likes: topTrack.likes_count || 0,
        } : null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
