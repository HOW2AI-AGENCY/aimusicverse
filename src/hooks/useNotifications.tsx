// Unified notification hooks - re-export from context to avoid duplicate subscriptions
import { useNotificationHub, NotificationItem } from '@/contexts/NotificationContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useMemo } from 'react';

// Re-export types
export type { NotificationItem, GenerationProgress } from '@/contexts/NotificationContext';

/**
 * Main notifications hook - uses unified context
 * Avoids duplicate realtime subscriptions
 */
export const useNotifications = (filter?: 'all' | 'unread') => {
  const { notifications } = useNotificationHub();
  
  const data = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);
  
  return {
    data,
    isLoading: false, // Context handles loading
    isError: false,
  };
};

/**
 * Get unread notifications count
 */
export const useUnreadCount = () => {
  const { unreadCount } = useNotificationHub();
  return unreadCount;
};

/**
 * Mark single notification as read
 */
export const useMarkAsRead = () => {
  const { markAsRead } = useNotificationHub();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const { markAllAsRead } = useNotificationHub();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      await markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
};

/**
 * Create a new notification
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      action_url?: string;
    }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          ...notification,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
    onError: (error) => {
      toast.error('Ошибка создания уведомления', {
        description: error.message,
      });
    },
  });
};

// Re-export context hook for direct access
export { useNotificationHub } from '@/contexts/NotificationContext';
