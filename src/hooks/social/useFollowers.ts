// useFollowers hook - Sprint 011 Phase 4
// Infinite scroll query for user's followers list

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { FollowerItem } from '@/types/social';

interface UseFollowersParams {
  userId: string;
  searchQuery?: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function useFollowers({ userId, searchQuery = '', pageSize = DEFAULT_PAGE_SIZE }: UseFollowersParams) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['followers', userId, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // Build query
      const query = supabase
        .from('user_follows')
        .select(`
          id,
          follower_id,
          created_at,
          follower:profiles!user_follows_follower_id_fkey (
            user_id,
            display_name,
            username,
            avatar_url,
            is_verified,
            bio
          )
        `)
        .eq('following_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get current user's following list to check isFollowingBack
      let currentUserFollowing: Set<string> = new Set();
      if (user?.id) {
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .eq('status', 'active');

        if (followingData) {
          currentUserFollowing = new Set(followingData.map((f) => f.following_id));
        }
      }

      const followers: FollowerItem[] = (data || [])
        .map((follow: any) => {
          if (!follow.follower) return null;

          return {
            id: follow.id,
            userId: follow.follower.user_id,
            displayName: follow.follower.display_name || undefined,
            username: follow.follower.username || undefined,
            avatarUrl: follow.follower.avatar_url || undefined,
            isVerified: follow.follower.is_verified || false,
            bio: follow.follower.bio || undefined,
            followedAt: follow.created_at,
            isFollowingBack: currentUserFollowing.has(follow.follower.user_id),
          };
        })
        .filter(Boolean) as FollowerItem[];

      // Apply search filter if provided
      const filteredFollowers = searchQuery
        ? followers.filter((follower) => {
            const searchLower = searchQuery.toLowerCase();
            return (
              follower.displayName?.toLowerCase().includes(searchLower) ||
              follower.username?.toLowerCase().includes(searchLower) ||
              follower.bio?.toLowerCase().includes(searchLower)
            );
          })
        : followers;

      return {
        followers: filteredFollowers,
        nextPage: filteredFollowers.length === pageSize ? pageParam + 1 : undefined,
        hasMore: filteredFollowers.length === pageSize,
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
