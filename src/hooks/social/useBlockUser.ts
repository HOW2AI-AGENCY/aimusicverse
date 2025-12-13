// useBlockUser hook - Sprint 011
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useBlockUser(targetUserId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isBlocked, isLoading: isCheckingBlock } = useQuery({
    queryKey: ['block-status', targetUserId, user?.id],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return false;
      const { data } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetUserId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId,
  });

  const blockMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('Не авторизован');

      const { data: existing } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', userId);
        if (error) throw error;
        return { action: 'unblock' as const };
      } else {
        const { error } = await supabase
          .from('blocked_users')
          .insert({ blocker_id: user.id, blocked_id: userId });
        if (error) throw error;
        return { action: 'block' as const };
      }
    },
    onSuccess: (result, userId) => {
      queryClient.invalidateQueries({ queryKey: ['block-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success(result.action === 'block' ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    },
    onError: (error) => {
      console.error('Error toggling block:', error);
      toast.error('Не удалось выполнить действие');
    },
  });

  return {
    isBlocked: isBlocked ?? false,
    isLoading: isCheckingBlock || blockMutation.isPending,
    toggleBlock: blockMutation.mutate,
  };
}

export function useBlockedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}
