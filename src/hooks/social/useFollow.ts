// useFollow Hook - Sprint 011 Task T036
// Mutation to follow/unfollow users with optimistic updates and notifications

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const socialLogger = logger.child({ module: 'useFollow' });

interface FollowAction {
  userId: string;
  action: 'follow' | 'unfollow';
}

// Rate limiting: Track follows per hour
const FOLLOW_RATE_LIMIT = 30; // Max 30 follows per hour
const followTimestamps: number[] = [];

function checkRateLimit(): boolean {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // Remove old timestamps
  while (followTimestamps.length > 0 && followTimestamps[0] < oneHourAgo) {
    followTimestamps.shift();
  }

  if (followTimestamps.length >= FOLLOW_RATE_LIMIT) {
    return false;
  }

  followTimestamps.push(now);
  return true;
}

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action }: FollowAction) => {
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session.session?.user?.id;

      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      if (currentUserId === userId) {
        throw new Error('Cannot follow yourself');
      }

      socialLogger.debug('Follow action', { userId, action, currentUserId });

      if (action === 'follow') {
        // Check rate limit
        if (!checkRateLimit()) {
          throw new Error('RATE_LIMIT');
        }

        // Insert follow record
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: userId,
          status: 'active',
        });

        if (error) {
          socialLogger.error('Error following user', { userId, error });
          throw error;
        }

        // Create notification for followed user
        await supabase.from('notifications').insert({
          user_id: userId,
          actor_id: currentUserId,
          notification_type: 'follow',
          entity_type: 'user',
          entity_id: currentUserId,
          content: 'started following you',
          is_read: false,
        });

        socialLogger.info('User followed successfully', { userId });
      } else {
        // Delete follow record
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

        if (error) {
          socialLogger.error('Error unfollowing user', { userId, error });
          throw error;
        }

        socialLogger.info('User unfollowed successfully', { userId });
      }

      return { userId, action };
    },
    onMutate: async ({ userId, action }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['followers', userId] });
      await queryClient.cancelQueries({ queryKey: ['following'] });
      await queryClient.cancelQueries({ queryKey: ['profile-stats', userId] });

      // Snapshot previous values
      const previousStats = queryClient.getQueryData(['profile-stats', userId]);

      // Optimistically update stats
      if (previousStats) {
        queryClient.setQueryData(['profile-stats', userId], (old: any) => ({
          ...old,
          followers: action === 'follow' ? old.followers + 1 : old.followers - 1,
        }));
      }

      return { previousStats };
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousStats) {
        queryClient.setQueryData(['profile-stats', variables.userId], context.previousStats);
      }

      if (error.message === 'RATE_LIMIT') {
        toast.error('Please wait before following more users. Max 30 follows per hour.');
      } else {
        toast.error(
          variables.action === 'follow'
            ? 'Failed to follow user'
            : 'Failed to unfollow user'
        );
      }

      socialLogger.error('Follow mutation error', { error, variables });
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['followers', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['is-following', data.userId] });

      toast.success(
        data.action === 'follow'
          ? 'Successfully followed user'
          : 'Successfully unfollowed user'
      );
    },
  });
}
