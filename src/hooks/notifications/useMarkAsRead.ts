// useMarkAsRead Hook - Sprint 011 Task T083
// Mark notifications as read

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * Hook to mark notification(s) as read
 */
export function useMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
      }

      return notificationIds;
    },
    onMutate: async (notificationIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['notifications', user?.id],
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData([
        'notifications',
        user?.id,
      ]);

      // Optimistically update to mark as read
      queryClient.setQueryData(
        ['notifications', user?.id],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notifications: page.notifications.map((notification: any) =>
                notificationIds.includes(notification.id)
                  ? { ...notification, is_read: true }
                  : notification
              ),
            })),
          };
        }
      );

      // Return context for rollback
      return { previousNotifications };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ['notifications', user?.id],
          context.previousNotifications
        );
      }
      toast.error('Ошибка отметки уведомлений как прочитанных');
    },
    onSuccess: () => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: ['unread-count', user?.id],
      });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({
        queryKey: ['notifications', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['unread-count', user?.id],
      });
      toast.success('Все уведомления отмечены как прочитанные');
    },
    onError: () => {
      toast.error('Ошибка отметки уведомлений');
    },
  });
}
