/**
 * useRealtimeTrackUpdates Hook
 *
 * Per contracts/useRealtimeTrackUpdates.contract.ts:
 * - Real-time Supabase subscriptions
 * - Subscription lifecycle management
 * - Update callbacks
 */

import { useEffect, useState, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { UseRealtimeTrackUpdatesParams, UseRealtimeTrackUpdatesReturn, TrackUpdate } from '@/hooks/types/track';

/**
 * Hook for real-time track updates
 *
 * @example
 * ```tsx
 * const { data, isConnected } = useRealtimeTrackUpdates({
 *   trackId: track.id,
 *   enabled: true,
 *   onUpdate: (update) => {
 *     console.log('Track updated:', update);
 *   },
 * });
 * ```
 */
export function useRealtimeTrackUpdates(
  params: UseRealtimeTrackUpdatesParams
): UseRealtimeTrackUpdatesReturn {
  const { trackId, enabled = true, onUpdate } = params;

  const [data, setData] = useState<TrackUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep track of subscription to cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !trackId) {
      return;
    }

    // Create subscription
    const channel = supabase
      .channel(`track-updates-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks',
          filter: `id=eq.${trackId}`,
        },
        (payload) => {
          const update: TrackUpdate = {
            trackId,
            type: payload.eventType === 'INSERT' ? 'metadata' : 'metadata',
            data: payload.new as any,
            timestamp: Date.now(),
          };

          setData(update);
          onUpdate?.(update);
          logger.info('Track update received', { trackId, update });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'track_likes',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          const update: TrackUpdate = {
            trackId,
            type: 'like',
            data: {
              likes_count: (payload.new as any).likes_count,
            },
            timestamp: Date.now(),
          };

          setData(update);
          onUpdate?.(update);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          logger.info('Track updates subscription active', { trackId });
        } else if (status === 'SUBSCRIPTION_ERROR') {
          setIsConnected(false);
          setError(new Error('Subscription failed'));
          logger.error('Track updates subscription failed', { trackId });
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
        logger.info('Track updates subscription cleaned up', { trackId });
      }
    };
  }, [trackId, enabled, onUpdate]);

  return {
    data,
    isConnected,
    error,
  };
}
