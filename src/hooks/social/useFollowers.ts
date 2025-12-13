// useFollowers Hook - Sprint 011 Task T037
// Query followers list with infinite scroll

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const socialLogger = logger.child({ module: 'useFollowers' });

const PAGE_SIZE = 50;

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  status: string;
  created_at: string;
  profile: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_verified: boolean;
  };
}

export function useFollowers(userId: string) {
  return useInfiniteQuery({
    queryKey: ['followers', userId],
    queryFn: async ({ pageParam = 0 }) => {
      socialLogger.debug('Fetching followers', { userId, page: pageParam });

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('follows')
        .select(
          `
          id,
          follower_id,
          following_id,
          status,
          created_at,
          profile:follower_id (
            user_id,
            display_name,
            username,
            avatar_url,
            bio,
            is_verified
          )
        `,
          { count: 'exact' }
        )
        .eq('following_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        socialLogger.error('Error fetching followers', { userId, error });
        throw error;
      }

      return {
        followers: data || [],
        nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : null,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to check if current user is following a specific user
export function useIsFollowing(userId: string) {
  return useInfiniteQuery({
    queryKey: ['is-following', userId],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session.session?.user?.id;

      if (!currentUserId || !userId) {
        return { isFollowing: false };
      }

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        socialLogger.error('Error checking follow status', { userId, error });
        throw error;
      }

      return { isFollowing: !!data };
    },
    getNextPageParam: () => null,
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 seconds
  });
}
