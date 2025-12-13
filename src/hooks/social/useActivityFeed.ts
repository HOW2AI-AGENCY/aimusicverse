// useActivityFeed hook - Sprint 011 Phase 7
// Fetch user activity feed with filters

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ActivityFeedItem, ActivityType } from '@/types/activity';

interface UseActivityFeedParams {
  activityTypes?: ActivityType[];
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

// Format activity message based on type
function formatActivityMessage(activity: any): string {
  const actorName = activity.actor?.display_name || activity.actor?.username || 'Пользователь';
  
  switch (activity.activity_type) {
    case 'track_created':
      return `${actorName} создал трек`;
    case 'track_liked':
      return `${actorName} понравился трек`;
    case 'comment_posted':
      return `${actorName} оставил комментарий`;
    case 'user_followed':
      return `${actorName} подписался на вас`;
    case 'playlist_created':
      return `${actorName} создал плейлист`;
    case 'track_added_to_playlist':
      return `${actorName} добавил трек в плейлист`;
    default:
      return `${actorName} выполнил действие`;
  }
}

// Get action label and URL based on activity type
function getActivityAction(activity: any): { label?: string; url?: string } {
  switch (activity.activity_type) {
    case 'track_created':
    case 'track_liked':
      return {
        label: 'Слушать',
        url: `/track/${activity.entity_id}`,
      };
    case 'comment_posted':
      return {
        label: 'Посмотреть',
        url: `/track/${activity.metadata?.trackId || activity.entity_id}`,
      };
    case 'user_followed':
      return {
        label: 'Профиль',
        url: `/profile/${activity.actor_id}`,
      };
    case 'playlist_created':
      return {
        label: 'Открыть',
        url: `/playlist/${activity.entity_id}`,
      };
    case 'track_added_to_playlist':
      return {
        label: 'Открыть плейлист',
        url: `/playlist/${activity.entity_id}`,
      };
    default:
      return {};
  }
}

export function useActivityFeed({ activityTypes, pageSize = DEFAULT_PAGE_SIZE }: UseActivityFeedParams = {}) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['activity-feed', user?.id, activityTypes],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('Не авторизован');

      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // Build query
      let query = supabase
        .from('activities')
        .select(`
          id,
          user_id,
          actor_id,
          activity_type,
          entity_type,
          entity_id,
          metadata,
          created_at,
          actor:profiles!activities_actor_id_fkey (
            user_id,
            display_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply activity type filter if provided
      if (activityTypes && activityTypes.length > 0) {
        query = query.in('activity_type', activityTypes);
      }

      const { data, error } = await query;

      if (error) throw error;

      const activities: ActivityFeedItem[] = (data || []).map((activity: any) => {
        const action = getActivityAction(activity);
        
        return {
          id: activity.id,
          userId: activity.user_id,
          actorId: activity.actor_id,
          activityType: activity.activity_type,
          entityType: activity.entity_type,
          entityId: activity.entity_id,
          metadata: activity.metadata || {},
          createdAt: activity.created_at,
          actor: {
            userId: activity.actor.user_id,
            displayName: activity.actor.display_name || undefined,
            username: activity.actor.username || undefined,
            avatarUrl: activity.actor.avatar_url || undefined,
            isVerified: activity.actor.is_verified || false,
          },
          formattedMessage: formatActivityMessage(activity),
          actionLabel: action.label,
          actionUrl: action.url,
        };
      });

      return {
        activities,
        nextPage: activities.length === pageSize ? pageParam + 1 : undefined,
        hasMore: activities.length === pageSize,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id,
  });
}
