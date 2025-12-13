// useMarkAsRead hook - Sprint 011 Phase 8
// Mark notifications as read (single, multiple, or all)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MarkAsReadParams {
  notificationIds?: string[];
  markAll?: boolean;
}

export function useMarkAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationIds, markAll }: MarkAsReadParams) => {
      if (!user?.id) throw new Error('Не авторизован');

      if (markAll) {
        // Mark all notifications as read
        const { error } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) throw error;
      } else if (notificationIds && notificationIds.length > 0) {
        // Mark specific notifications as read
        const { error } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .in('id', notificationIds)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      return { notificationIds, markAll };
    },
    onMutate: async ({ notificationIds, markAll }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });

      // Optimistic update
      queryClient.setQueriesData({ queryKey: ['notifications', user?.id] }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;

        return old.map((notification: any) => {
          if (markAll || (notificationIds && notificationIds.includes(notification.id))) {
            return {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            };
          }
          return notification;
        });
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      
      if (result.markAll) {
        toast.success('Все уведомления отмечены как прочитанные');
      } else if (result.notificationIds && result.notificationIds.length > 1) {
        toast.success('Уведомления отмечены как прочитанные');
      }
      // Don't show toast for single notification mark as read (too noisy)
    },
    onError: (error) => {
      console.error('Error marking notifications as read:', error);
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      toast.error('Не удалось отметить уведомления');
    },
  });
}
