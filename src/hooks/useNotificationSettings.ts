import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { notify } from '@/lib/notifications';
import { logger } from '@/lib/logger';

export interface NotificationSettings {
  id: string;
  user_id: string;
  telegram_chat_id: number | null;
  // Generation notifications
  notify_completed: boolean;
  notify_failed: boolean;
  notify_progress: boolean;
  notify_stem_ready: boolean;
  // Social notifications
  notify_likes: boolean;
  notify_comments: boolean;
  notify_followers: boolean;
  notify_mentions: boolean;
  // Gamification
  notify_achievements: boolean;
  notify_daily_reminder: boolean;
  // Quiet hours
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  // MIDI settings
  auto_midi_enabled: boolean;
  auto_midi_model: string;
  auto_midi_stems_only: boolean;
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
        // Generation
        notify_completed: data.notify_completed ?? true,
        notify_failed: data.notify_failed ?? true,
        notify_progress: data.notify_progress ?? false,
        notify_stem_ready: data.notify_stem_ready ?? true,
        // Social
        notify_likes: data.notify_likes ?? true,
        notify_comments: data.notify_comments ?? true,
        notify_followers: (data as any).notify_followers ?? true,
        notify_mentions: (data as any).notify_mentions ?? true,
        // Gamification
        notify_achievements: data.notify_achievements ?? true,
        notify_daily_reminder: data.notify_daily_reminder ?? false,
        // Quiet hours
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end,
        // MIDI settings
        auto_midi_enabled: (data as any).auto_midi_enabled ?? false,
        auto_midi_model: (data as any).auto_midi_model ?? 'basic-pitch',
        auto_midi_stems_only: (data as any).auto_midi_stems_only ?? false,
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
      notify.success('Настройки сохранены', { dedupe: true, dedupeKey: 'settings-saved' });
    },
    onError: (error) => {
      logger.error('Error updating notification settings', error);
      notify.error('Ошибка сохранения настроек');
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
