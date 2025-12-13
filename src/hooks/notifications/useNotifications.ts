// useNotifications hook - Sprint 011 Phase 8
// Fetch notifications with real-time subscriptions

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { NotificationWithActor, NotificationType } from '@/types/notification';

interface UseNotificationsParams {
  isRead?: boolean;
  notificationType?: NotificationType;
  limit?: number;
}

export function useNotifications({ isRead, notificationType, limit = 50 }: UseNotificationsParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id, isRead, notificationType, limit],
    queryFn: async (): Promise<NotificationWithActor[]> => {
      if (!user?.id) return [];

      // Build query
      let query = supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          actor_id,
          notification_type,
          entity_type,
          entity_id,
          content,
          is_read,
          telegram_sent,
          created_at,
          read_at,
          actor:profiles!notifications_actor_id_fkey (
            user_id,
            display_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (isRead !== undefined) {
        query = query.eq('is_read', isRead);
      }

      if (notificationType) {
        query = query.eq('notification_type', notificationType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((notification: any) => {
        // Determine action label and URL based on notification type
        let actionLabel: string | undefined;
        let actionUrl: string | undefined;

        switch (notification.notification_type) {
          case 'new_follower':
            actionLabel = 'Посмотреть профиль';
            actionUrl = `/profile/${notification.actor_id}`;
            break;
          case 'track_liked':
          case 'track_commented':
          case 'comment_liked':
          case 'comment_reply':
          case 'mention':
            actionLabel = 'Посмотреть';
            actionUrl = `/track/${notification.entity_id}`;
            break;
          case 'track_shared':
            actionLabel = 'Открыть трек';
            actionUrl = `/track/${notification.entity_id}`;
            break;
        }

        return {
          id: notification.id,
          userId: notification.user_id,
          actorId: notification.actor_id,
          notificationType: notification.notification_type,
          entityType: notification.entity_type,
          entityId: notification.entity_id,
          content: notification.content,
          isRead: notification.is_read,
          telegramSent: notification.telegram_sent,
          createdAt: notification.created_at,
          readAt: notification.read_at || undefined,
          actor: {
            userId: notification.actor.user_id,
            displayName: notification.actor.display_name || undefined,
            username: notification.actor.username || undefined,
            avatarUrl: notification.actor.avatar_url || undefined,
            isVerified: notification.actor.is_verified || false,
          },
          actionLabel,
          actionUrl,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}
