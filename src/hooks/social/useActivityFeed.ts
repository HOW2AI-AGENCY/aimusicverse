// useActivityFeed Hook - Sprint 011 Task T073
// Query activity feed with pagination and real-time updates

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Activity, ActivityType } from '@/types/activity';

interface UseActivityFeedParams {
  activityType?: ActivityType;
  enabled?: boolean;
}

interface ActivitiesPage {
  activities: Activity[];
  nextCursor?: string;
}

const ACTIVITIES_PER_PAGE = 50;

/**
 * Hook to fetch activity feed from followed users
 * Includes real-time subscriptions and infinite scroll
 */
export function useActivityFeed({
  activityType,
  enabled = true,
}: UseActivityFeedParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query activity feed
  const query = useInfiniteQuery({
    queryKey: ['activity-feed', user?.id, activityType],
    queryFn: async ({ pageParam }): Promise<ActivitiesPage> => {
      if (!user?.id) {
        return { activities: [] };
      }

      let query = supabase
        .from('activities')
        .select(
          `
          id,
          user_id,
          actor_id,
          activity_type,
          entity_type,
          entity_id,
          metadata,
          created_at,
          actor:profiles!activities_actor_id_fkey(
            user_id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `
        )
        .in('actor_id', supabase.from('follows').select('following_id').eq('follower_id', user.id))
        .order('created_at', { ascending: false })
        .limit(ACTIVITIES_PER_PAGE);

      // Filter by activity type if specified
      if (activityType) {
        query = query.eq('activity_type', activityType);
      }

      // Pagination cursor
      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activity feed:', error);
        throw error;
      }

      const activities = (data || []) as Activity[];

      return {
        activities,
        nextCursor:
          activities.length === ACTIVITIES_PER_PAGE
            ? activities[activities.length - 1]?.created_at
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: enabled && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id || !enabled) return;

    const channel = supabase
      .channel(`activities:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New activity received:', payload);
          
          // Invalidate query to refetch
          queryClient.invalidateQueries({
            queryKey: ['activity-feed', user.id],
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, enabled, queryClient]);

  return query;
}

/**
 * Hook to get unread activity count (since last view)
 */
export function useUnreadActivityCount() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['activity-unread-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      // Get last viewed timestamp from localStorage
      const lastViewed = localStorage.getItem(
        `activity-last-viewed-${user.id}`
      );
      const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0);

      // Count activities created after last view
      const { count, error } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('created_at', lastViewedDate.toISOString());

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Mark activities as viewed
 */
export function markActivitiesAsViewed() {
  const { user } = useAuth();

  if (!user?.id) return;

  localStorage.setItem(
    `activity-last-viewed-${user.id}`,
    new Date().toISOString()
  );
}
