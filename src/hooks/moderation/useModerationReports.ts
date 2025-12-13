import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate_content' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
export type EntityType = 'comment' | 'track' | 'profile';

interface ModerationReport {
  id: string;
  reporter_id: string;
  entity_type: EntityType;
  entity_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  resolution_note: string | null;
  reporter: {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
  };
}

interface ReportCommentData {
  commentId: string;
  reason: ReportReason;
  description?: string;
}

/**
 * Hook to fetch moderation reports (admin only)
 */
export function useModerationReports(status?: ReportStatus) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['moderation-reports', status],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('moderation_reports')
        .select(`
          *,
          reporter:reporter_id (
            first_name,
            last_name,
            photo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as unknown as ModerationReport[]) || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute for admins
  });
}

/**
 * Hook to report a comment
 */
export function useReportComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, reason, description }: ReportCommentData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('moderation_reports')
        .insert({
          reporter_id: user.id,
          entity_type: 'comment',
          entity_id: commentId,
          reason,
          description,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already reported this comment');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      toast.success('Жалоба отправлена администраторам');
    },
    onError: (error: Error) => {
      console.error('Report comment error:', error);
      if (error.message.includes('already reported')) {
        toast.error('Вы уже пожаловались на этот комментарий');
      } else {
        toast.error('Не удалось отправить жалобу');
      }
    },
  });
}

/**
 * Hook to hide a comment (admin action)
 */
export function useHideComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .update({ is_moderated: true })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Комментарий скрыт');
    },
    onError: (error: Error) => {
      console.error('Hide comment error:', error);
      toast.error('Не удалось скрыть комментарий');
    },
  });
}

/**
 * Hook to resolve a moderation report
 */
export function useResolveReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
      resolutionNote,
    }: {
      reportId: string;
      status: 'reviewed' | 'dismissed';
      resolutionNote?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('moderation_reports')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          resolution_note: resolutionNote || null,
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      toast.success('Жалоба обработана');
    },
    onError: (error: Error) => {
      console.error('Resolve report error:', error);
      toast.error('Не удалось обработать жалобу');
    },
  });
}

/**
 * Hook to warn a user (increment strike count)
 */
export function useWarnUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) => {
      // Get current moderation status
      const { data: profile } = await supabase
        .from('profiles')
        .select('moderation_status')
        .eq('id', userId)
        .single();

      const currentStatus = (profile?.moderation_status as any) || {
        strike_count: 0,
        warnings: [],
      };

      const newStrikeCount = (currentStatus.strike_count || 0) + 1;
      const warnings = currentStatus.warnings || [];
      warnings.push({
        reason,
        timestamp: new Date().toISOString(),
      });

      // Calculate ban if 3 strikes
      const bannedUntil = newStrikeCount >= 3
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        : null;

      const { error } = await supabase
        .from('profiles')
        .update({
          moderation_status: {
            strike_count: newStrikeCount,
            warnings,
            banned_until: bannedUntil,
            ban_reason: bannedUntil ? '3 strikes: temporary ban' : null,
          },
        })
        .eq('id', userId);

      if (error) throw error;

      return { strikeCount: newStrikeCount, bannedUntil };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (data.bannedUntil) {
        toast.success('Пользователь предупреждён и временно забанен (3 страйка)');
      } else {
        toast.success(`Пользователь предупреждён (страйков: ${data.strikeCount}/3)`);
      }
    },
    onError: (error: Error) => {
      console.error('Warn user error:', error);
      toast.error('Не удалось предупредить пользователя');
    },
  });
}
