import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationSettings {
  id: string;
  user_id: string;
  telegram_chat_id: number | null;
  notify_completed: boolean;
  notify_failed: boolean;
  notify_progress: boolean;
  notify_stem_ready: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export function useNotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async (): Promise<NotificationSettings | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // Map nullable booleans to non-nullable with defaults
      return {
        id: data.id,
        user_id: data.user_id,
        telegram_chat_id: data.telegram_chat_id,
        notify_completed: data.notify_completed ?? true,
        notify_failed: data.notify_failed ?? true,
        notify_progress: data.notify_progress ?? false,
        notify_stem_ready: data.notify_stem_ready ?? true,
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end,
      };
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Настройки сохранены');
    },
    onError: (error) => {
      console.error('Error updating notification settings:', error);
      toast.error('Ошибка сохранения настроек');
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
