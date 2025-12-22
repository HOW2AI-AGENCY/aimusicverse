/**
 * useActivityFeed hook - Sprint 011
 * Fetches tracks from followed users and users whose tracks were liked
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FeedTrack {
  id: string;
  title: string;
  style: string | null;
  coverUrl: string | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  createdAt: string;
  likesCount: number;
  playCount: number;
  creator: {
    userId: string;
    displayName: string | null;
    username: string | null;
    photoUrl: string | null;
  };
  source: 'following' | 'liked_creator';
}

interface FeedPage {
  tracks: FeedTrack[];
  nextCursor: number | null;
}

const PAGE_SIZE = 20;

/**
 * Get IDs of users the current user follows
 */
export function useFollowingIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['following-ids', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;
      return data?.map(f => f.following_id) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get IDs of users whose tracks the current user has liked
 */
export function useLikedCreatorIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['liked-creator-ids', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get unique creator IDs from liked tracks
      const { data, error } = await supabase
        .from('track_likes')
        .select('tracks!inner(user_id)')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const creatorIds = new Set<string>();
      data?.forEach((like: any) => {
        if (like.tracks?.user_id && like.tracks.user_id !== user.id) {
          creatorIds.add(like.tracks.user_id);
        }
      });
      
      return Array.from(creatorIds);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Main activity feed hook - tracks from followed users and liked creators
 */
export function useActivityFeed(options?: { 
  filter?: 'all' | 'following' | 'liked_creators';
}) {
  const { user } = useAuth();
  const { data: followingIds = [] } = useFollowingIds();
  const { data: likedCreatorIds = [] } = useLikedCreatorIds();
  const filter = options?.filter || 'all';

  // Combine user IDs based on filter
  const userIds = (() => {
    if (filter === 'following') return followingIds;
    if (filter === 'liked_creators') return likedCreatorIds.filter(id => !followingIds.includes(id));
    // 'all' - combine both, remove duplicates
    return [...new Set([...followingIds, ...likedCreatorIds])];
  })();

  return useInfiniteQuery<FeedPage>({
    queryKey: ['activity-feed', user?.id, filter, userIds.join(',')],
    queryFn: async ({ pageParam }) => {
      const offset = (pageParam as number) || 0;
      
      if (userIds.length === 0) {
        return { tracks: [], nextCursor: null };
      }

      // Fetch tracks from these users
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          style,
          cover_url,
          audio_url,
          telegram_file_id,
          duration_seconds,
          created_at,
          likes_count,
          play_count,
          user_id,
          profiles!inner (
            user_id,
            display_name,
            username,
            photo_url
          )
        `)
        .in('user_id', userIds)
        .eq('is_public', true)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const tracks: FeedTrack[] = (data || []).map((track: any) => ({
        id: track.id,
        title: track.title || 'Без названия',
        style: track.style,
        coverUrl: track.cover_url,
        audioUrl: track.audio_url || track.telegram_file_id,
        durationSeconds: track.duration_seconds,
        createdAt: track.created_at,
        likesCount: track.likes_count || 0,
        playCount: track.play_count || 0,
        creator: {
          userId: track.profiles?.user_id || track.user_id,
          displayName: track.profiles?.display_name,
          username: track.profiles?.username,
          photoUrl: track.profiles?.photo_url,
        },
        source: followingIds.includes(track.user_id) ? 'following' : 'liked_creator',
      }));

      return {
        tracks,
        nextCursor: tracks.length === PAGE_SIZE ? offset + PAGE_SIZE : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.nextCursor;
    },
    enabled: !!user?.id && userIds.length > 0,
  });
}

/**
 * Get feed summary (counts)
 */
export function useFeedSummary() {
  const { data: followingIds = [] } = useFollowingIds();
  const { data: likedCreatorIds = [] } = useLikedCreatorIds();

  return {
    followingCount: followingIds.length,
    likedCreatorsCount: likedCreatorIds.filter(id => !followingIds.includes(id)).length,
    totalCreators: new Set([...followingIds, ...likedCreatorIds]).size,
  };
}
