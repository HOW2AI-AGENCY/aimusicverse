// useFollowing Hook - Sprint 011 Task T038
// Query following list with infinite scroll

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const socialLogger = logger.child({ module: 'useFollowing' });

const PAGE_SIZE = 50;

export interface Following {
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

export function useFollowing(userId: string) {
  return useInfiniteQuery({
    queryKey: ['following', userId],
    queryFn: async ({ pageParam = 0 }) => {
      socialLogger.debug('Fetching following', { userId, page: pageParam });

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
          profile:following_id (
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
        .eq('follower_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        socialLogger.error('Error fetching following', { userId, error });
        throw error;
      }

      return {
        following: data || [],
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
