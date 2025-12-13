// useLikeTrack Hook - Sprint 011 Task T062
// Like/unlike tracks with optimistic updates

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LikeTrackParams {
  trackId: string;
}

/**
 * Hook to like/unlike a track
 * Includes optimistic updates and notification creation
 */
export function useLikeTrack() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId }: LikeTrackParams) => {
      if (!user) {
        throw new Error('Must be logged in to like tracks');
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('track_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .single();

      if (existingLike) {
        // Unlike: remove the like
        const { error } = await supabase
          .from('track_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) {
          console.error('Error unliking track:', error);
          throw error;
        }

        return { liked: false };
      } else {
        // Like: add the like
        const { error } = await supabase
          .from('track_likes')
          .insert({
            user_id: user.id,
            track_id: trackId,
          });

        if (error) {
          // Ignore duplicate errors (ON CONFLICT)
          if (error.code !== '23505') {
            console.error('Error liking track:', error);
            throw error;
          }
        }

        // Create notification for track owner (if not self)
        const { data: track } = await supabase
          .from('tracks')
          .select('user_id')
          .eq('id', trackId)
          .single();

        if (track && track.user_id !== user.id) {
          // Check if notification already exists (prevent duplicates)
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', track.user_id)
            .eq('actor_id', user.id)
            .eq('entity_id', trackId)
            .eq('notification_type', 'like_track')
            .single();

          if (!existingNotif) {
            await supabase.from('notifications').insert({
              user_id: track.user_id,
              actor_id: user.id,
              notification_type: 'like_track',
              entity_type: 'track',
              entity_id: trackId,
              content: 'liked your track',
              is_read: false,
            });
          }
        }

        return { liked: true };
      }
    },
    onMutate: async ({ trackId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['track-liked', trackId] });
      await queryClient.cancelQueries({ queryKey: ['track-stats', trackId] });

      // Snapshot the previous value
      const previousLiked = queryClient.getQueryData(['track-liked', trackId]);
      const previousStats = queryClient.getQueryData(['track-stats', trackId]);

      // Optimistically update
      queryClient.setQueryData(['track-liked', trackId], (old: boolean) => !old);
      
      queryClient.setQueryData(['track-stats', trackId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likesCount: previousLiked ? old.likesCount - 1 : old.likesCount + 1,
        };
      });

      return { previousLiked, previousStats };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(
          ['track-liked', variables.trackId],
          context.previousLiked
        );
      }
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['track-stats', variables.trackId],
          context.previousStats
        );
      }
      console.error('Like track error:', err);
      toast.error('Failed to like track');
    },
    onSuccess: (result, variables) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['track-liked', variables.trackId],
      });
      queryClient.invalidateQueries({
        queryKey: ['track-stats', variables.trackId],
      });
    },
  });
}

/**
 * Hook to check if current user has liked a track
 */
export function useIsTrackLiked(trackId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['track-liked', trackId],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('track_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error checking if track is liked:', error);
        throw error;
      }

      return !!data;
    },
    enabled: !!user && !!trackId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
