// useNotifications Hook - Sprint 011 Task T082
// Query notifications with real-time updates

import { useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types/notification';

interface UseNotificationsParams {
  filter?: 'all' | 'unread' | 'mentions';
  enabled?: boolean;
}

interface NotificationsPage {
  notifications: Notification[];
  nextCursor?: string;
}

const NOTIFICATIONS_PER_PAGE = 50;

/**
 * Hook to fetch notifications with pagination and real-time updates
 */
export function useNotifications({
  filter = 'all',
  enabled = true,
}: UseNotificationsParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query notifications
  const query = useInfiniteQuery({
    queryKey: ['notifications', user?.id, filter],
    queryFn: async ({ pageParam }): Promise<NotificationsPage> => {
      if (!user?.id) {
        return { notifications: [] };
      }

      let query = supabase
        .from('notifications')
        .select(
          `
          id,
          user_id,
          actor_id,
          notification_type,
          entity_type,
          entity_id,
          content,
          is_read,
          created_at,
          actor:profiles!notifications_actor_id_fkey(
            user_id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(NOTIFICATIONS_PER_PAGE);

      // Apply filter
      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'mentions') {
        query = query.eq('notification_type', 'mention');
      }

      // Pagination cursor
      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      const notifications = (data || []) as Notification[];

      return {
        notifications,
        nextCursor:
          notifications.length === NOTIFICATIONS_PER_PAGE
            ? notifications[notifications.length - 1]?.created_at
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: enabled && !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id || !enabled) return;

    const channel = supabase
      .channel(`notifications:user:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New notification received:', payload);

          // Invalidate query to refetch
          queryClient.invalidateQueries({
            queryKey: ['notifications', user.id],
          });

          // Update unread count
          queryClient.invalidateQueries({
            queryKey: ['unread-count', user.id],
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
 * Hook to get unread notification count
 */
export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}
