/**
 * useRealtimeSocialCounts Hook
 * 
 * Implementation for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T047 - Real-time like/follow count subscriptions
 * 
 * Provides real-time updates for social interaction counts via Supabase subscriptions
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type EntityType = 'track' | 'playlist' | 'artist';

interface UseRealtimeSocialCountsParams {
  entityType: EntityType;
  entityId: string;
  enabled?: boolean;
}

interface UseRealtimeSocialCountsReturn {
  likesCount: number;
  followersCount?: number; // Only for artists
  isConnected: boolean;
  error: Error | null;
}

/**
 * Hook for subscribing to real-time social interaction counts
 * Updates local state and invalidates React Query cache on changes
 */
export function useRealtimeSocialCounts({
  entityType,
  entityId,
  enabled = true,
}: UseRealtimeSocialCountsParams): UseRealtimeSocialCountsReturn {
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState({
    likesCount: 0,
    followersCount: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !entityId) return;

    let likesChannel: ReturnType<typeof supabase.channel> | null = null;
    let followsChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupLikesSubscription = async () => {
      try {
        const likeTable = entityType === 'track' 
          ? 'track_likes' 
          : entityType === 'playlist' 
          ? 'playlist_likes' 
          : null;

        if (!likeTable) return;

        // Get initial count
        const { count } = await supabase
          .from(likeTable)
          .select('*', { count: 'exact', head: true })
          .eq(`${entityType}_id`, entityId);

        setCounts(prev => ({ ...prev, likesCount: count || 0 }));

        // Subscribe to changes
        likesChannel = supabase
          .channel(`${likeTable}:${entityId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: likeTable,
              filter: `${entityType}_id=eq.${entityId}`,
            },
            async (payload) => {
              logger.info('Likes changed:', payload);

              // Refetch count
              const { count: newCount } = await supabase
                .from(likeTable)
                .select('*', { count: 'exact', head: true })
                .eq(`${entityType}_id`, entityId);

              setCounts(prev => ({ ...prev, likesCount: newCount || 0 }));

              // Invalidate React Query cache
              queryClient.invalidateQueries({
                queryKey: ['like-status', entityType, entityId],
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              logger.info(`Subscribed to ${likeTable} for ${entityId}`);
            } else if (status === 'CLOSED') {
              setIsConnected(false);
            }
          });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Error setting up likes subscription:', error);
        setError(error);
      }
    };

    const setupFollowsSubscription = async () => {
      if (entityType !== 'artist') return;

      try {
        // Get initial count
        const { count } = await supabase
          .from('artist_follows')
          .select('*', { count: 'exact', head: true })
          .eq('artist_id', entityId);

        setCounts(prev => ({ ...prev, followersCount: count || 0 }));

        // Subscribe to changes
        followsChannel = supabase
          .channel(`artist_follows:${entityId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'artist_follows',
              filter: `artist_id=eq.${entityId}`,
            },
            async (payload) => {
              logger.info('Follows changed:', payload);

              // Refetch count
              const { count: newCount } = await supabase
                .from('artist_follows')
                .select('*', { count: 'exact', head: true })
                .eq('artist_id', entityId);

              setCounts(prev => ({ ...prev, followersCount: newCount || 0 }));

              // Invalidate React Query cache
              queryClient.invalidateQueries({
                queryKey: ['follow-status', entityId],
              });
              queryClient.invalidateQueries({
                queryKey: ['artist', entityId],
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.info(`Subscribed to artist_follows for ${entityId}`);
            }
          });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Error setting up follows subscription:', error);
        setError(error);
      }
    };

    // Setup subscriptions
    setupLikesSubscription();
    setupFollowsSubscription();

    // Cleanup
    return () => {
      if (likesChannel) {
        supabase.removeChannel(likesChannel);
        logger.info('Unsubscribed from likes');
      }
      if (followsChannel) {
        supabase.removeChannel(followsChannel);
        logger.info('Unsubscribed from follows');
      }
      setIsConnected(false);
    };
  }, [entityType, entityId, enabled, queryClient]);

  return {
    likesCount: counts.likesCount,
    followersCount: entityType === 'artist' ? counts.followersCount : undefined,
    isConnected,
    error,
  };
}
