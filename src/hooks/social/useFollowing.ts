// useFollowing hook - Sprint 011 Phase 4
// Infinite scroll query for users being followed

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { FollowingItem } from '@/types/social';

interface UseFollowingParams {
  userId: string;
  searchQuery?: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function useFollowing({ userId, searchQuery = '', pageSize = DEFAULT_PAGE_SIZE }: UseFollowingParams) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['following', userId, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // Build query
      const query = supabase
        .from('user_follows')
        .select(`
          id,
          following_id,
          created_at,
          following:profiles!user_follows_following_id_fkey (
            user_id,
            display_name,
            username,
            avatar_url,
            is_verified,
            bio
          )
        `)
        .eq('follower_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Check if they follow current user back
      let usersFollowingCurrentUser: Set<string> = new Set();
      if (user?.id) {
        const { data: followersData } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', user.id)
          .eq('status', 'active');

        if (followersData) {
          usersFollowingCurrentUser = new Set(followersData.map((f) => f.follower_id));
        }
      }

      const following: FollowingItem[] = (data || [])
        .map((follow: any) => {
          if (!follow.following) return null;

          return {
            id: follow.id,
            userId: follow.following.user_id,
            displayName: follow.following.display_name || undefined,
            username: follow.following.username || undefined,
            avatarUrl: follow.following.avatar_url || undefined,
            isVerified: follow.following.is_verified || false,
            bio: follow.following.bio || undefined,
            followedAt: follow.created_at,
            followsYouBack: usersFollowingCurrentUser.has(follow.following.user_id),
          };
        })
        .filter(Boolean) as FollowingItem[];

      // Apply search filter if provided
      const filteredFollowing = searchQuery
        ? following.filter((item) => {
            const searchLower = searchQuery.toLowerCase();
            return (
              item.displayName?.toLowerCase().includes(searchLower) ||
              item.username?.toLowerCase().includes(searchLower) ||
              item.bio?.toLowerCase().includes(searchLower)
            );
          })
        : following;

      return {
        following: filteredFollowing,
        nextPage: filteredFollowing.length === pageSize ? pageParam + 1 : undefined,
        hasMore: filteredFollowing.length === pageSize,
      };
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.nextPage;
    },
    initialPageParam: 0,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  });
}
