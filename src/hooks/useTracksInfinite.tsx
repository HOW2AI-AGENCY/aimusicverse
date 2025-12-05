import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Track } from './useTracksOptimized';

const PAGE_SIZE = 20;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  attempts = RETRY_ATTEMPTS
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (RETRY_ATTEMPTS - attempts + 1)));
    return retryWithBackoff(fn, attempts - 1);
  }
};

interface UseTracksInfiniteParams {
  projectId?: string;
  searchQuery?: string;
  sortBy?: 'recent' | 'popular' | 'liked';
  pageSize?: number;
}

export const useTracksInfinite = ({ 
  projectId, 
  searchQuery, 
  sortBy = 'recent',
  pageSize = PAGE_SIZE 
}: UseTracksInfiniteParams = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tracks with infinite scroll pagination
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) {
        console.warn('⚠️ useTracksInfinite: No user ID available');
        return { tracks: [], nextPage: null, totalCount: 0 };
      }

      console.log(`🔄 Fetching tracks page ${pageParam} for user: ${user.id}, sortBy: ${sortBy}`);

      return retryWithBackoff(async () => {
        const from = pageParam * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('tracks')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .in('status', ['completed', 'streaming_ready']) // Only show ready tracks
          .range(from, to);

        // Server-side search
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,prompt.ilike.%${searchQuery}%,style.ilike.%${searchQuery}%`);
        }

        // Server-side sorting
        switch (sortBy) {
          case 'popular':
            query = query.order('play_count', { ascending: false, nullsFirst: false });
            break;
          case 'liked':
            query = query.order('likes_count', { ascending: false, nullsFirst: false });
            break;
          case 'recent':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error, count } = await query;

        if (error) {
          console.error('❌ Error fetching tracks:', error);
          throw error;
        }

        console.log(`✅ Fetched ${data?.length || 0} tracks (page ${pageParam})`);

        const trackIds = data?.map(t => t.id) || [];

        if (trackIds.length === 0) {
          return {
            tracks: [],
            nextPage: null,
            totalCount: count || 0,
          };
        }

        // Fetch likes count and user likes in parallel
        const [likesData, userLikesData] = await Promise.all([
          supabase
            .from('track_likes')
            .select('track_id')
            .in('track_id', trackIds),
          supabase
            .from('track_likes')
            .select('track_id')
            .eq('user_id', user.id)
            .in('track_id', trackIds),
        ]);

        const likesCounts = likesData.data?.reduce((acc, like) => {
          acc[like.track_id] = (acc[like.track_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const userLikes = new Set(userLikesData.data?.map(l => l.track_id) || []);

        // Use DB likes_count but override with computed count for accuracy + add is_liked
        const enrichedTracks = data?.map(track => ({
          ...track,
          likes_count: likesCounts[track.id] ?? track.likes_count ?? 0,
          is_liked: userLikes.has(track.id),
        })) || [];

        const hasMore = count ? (pageParam + 1) * pageSize < count : false;

        return {
          tracks: enrichedTracks,
          nextPage: hasMore ? pageParam + 1 : null,
          totalCount: count || 0,
        };
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds - reduced refetching
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    initialPageParam: 0,
    refetchOnWindowFocus: false, // Prevent refetch on tab switch
  });

  // Flatten pages into single array of tracks
  const tracks = data?.pages.flatMap((page) => page.tracks) || [];
  const totalCount = data?.pages[0] && 'totalCount' in data.pages[0] ? data.pages[0].totalCount : 0;

  // Delete track mutation with optimistic update
  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      return retryWithBackoff(async () => {
        const { error } = await supabase
          .from('tracks')
          .delete()
          .eq('id', trackId);

        if (error) throw error;
      });
    },
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ 
        queryKey: ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize] 
      });
      
      const previousData = queryClient.getQueryData(['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize]);
      
      queryClient.setQueryData(
        ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              tracks: page.tracks.filter((t: Track) => t.id !== trackId),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (error: Error, _, context) => {
      queryClient.setQueryData(
        ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize],
        context?.previousData
      );
      toast.error(error.message || 'Ошибка удаления трека');
    },
    onSuccess: () => {
      toast.success('Трек удален');
      queryClient.invalidateQueries({ 
        queryKey: ['tracks-infinite', user?.id] 
      });
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ trackId, isLiked }: { trackId: string; isLiked: boolean }) => {
      return retryWithBackoff(async () => {
        if (isLiked) {
          const { error } = await supabase
            .from('track_likes')
            .delete()
            .eq('track_id', trackId)
            .eq('user_id', user!.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('track_likes')
            .insert({ track_id: trackId, user_id: user!.id });

          if (error) throw error;
        }
      });
    },
    onMutate: async ({ trackId, isLiked }) => {
      await queryClient.cancelQueries({ 
        queryKey: ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize] 
      });
      
      const previousData = queryClient.getQueryData(['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize]);
      
      queryClient.setQueryData(
        ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              tracks: page.tracks.map((t: Track) =>
                t.id === trackId
                  ? {
                      ...t,
                      is_liked: !isLiked,
                      likes_count: isLiked ? t.likes_count - 1 : t.likes_count + 1,
                    }
                  : t
              ),
            })),
          };
        }
      );

      return { previousData };
    },
    onError: (error: Error, _, context) => {
      queryClient.setQueryData(
        ['tracks-infinite', user?.id, projectId, searchQuery, sortBy, pageSize],
        context?.previousData
      );
      toast.error(error.message || 'Ошибка при добавлении в избранное');
    },
  });

  // Log play mutation
  const logPlayMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase.rpc('increment_track_play_count', {
        track_id_param: trackId,
      });

      if (error) throw error;
    },
  });

  return {
    tracks,
    totalCount,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    deleteTrack: (trackId: string) => deleteTrackMutation.mutate(trackId),
    toggleLike: (params: { trackId: string; isLiked: boolean }) =>
      toggleLikeMutation.mutate(params),
    logPlay: (trackId: string) => logPlayMutation.mutate(trackId),
    downloadTrack: (_params: { trackId: string; audioUrl: string; coverUrl?: string }) => {
      // Download is handled by the browser
    },
  };
};
