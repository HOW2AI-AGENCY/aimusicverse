import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BlockedUser {
  blocked_id: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    username: string | null;
  };
}

/**
 * Hook to fetch list of blocked users
 */
export function useBlockedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked-users', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          created_at,
          profiles:blocked_id (
            id,
            first_name,
            last_name,
            photo_url,
            username
          )
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as BlockedUser[]) || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to check if a specific user is blocked
 */
export function useIsBlocked(userId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-blocked', user?.id, userId],
    queryFn: async () => {
      if (!user?.id || !userId) return false;

      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to block a user
 */
export function useBlockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (user.id === blockedUserId) throw new Error('Cannot block yourself');

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: blockedUserId,
        });

      if (error) throw error;
    },
    onSuccess: (_, blockedUserId) => {
      // Invalidate blocked users list
      queryClient.invalidateQueries({ queryKey: ['blocked-users', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-blocked', user?.id, blockedUserId] });
      
      // Invalidate follows queries (they should unfollow automatically)
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      
      toast.success('Пользователь заблокирован');
    },
    onError: (error: Error) => {
      console.error('Block user error:', error);
      toast.error('Не удалось заблокировать пользователя');
    },
  });
}

/**
 * Hook to unblock a user
 */
export function useUnblockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedUserId);

      if (error) throw error;
    },
    onSuccess: (_, blockedUserId) => {
      // Invalidate blocked users list
      queryClient.invalidateQueries({ queryKey: ['blocked-users', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-blocked', user?.id, blockedUserId] });
      
      toast.success('Пользователь разблокирован');
    },
    onError: (error: Error) => {
      console.error('Unblock user error:', error);
      toast.error('Не удалось разблокировать пользователя');
    },
  });
}
