/**
 * Batch Track Counts Hook
 * 
 * Fetches version and stem counts for multiple tracks in a single query
 * and subscribes to realtime updates via a single channel.
 * This replaces individual subscriptions per TrackCard to prevent memory leaks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TrackCounts {
  versionCount: number;
  stemCount: number;
}

export type TrackCountsMap = Record<string, TrackCounts>;

export function useTrackCounts(trackIds: string[]) {
  const [countsMap, setCountsMap] = useState<TrackCountsMap>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const trackIdsRef = useRef<string[]>([]);

  // Fetch counts for all tracks in batch
  const fetchCounts = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    try {
      // Batch fetch version counts
      const { data: versions } = await supabase
        .from('track_versions')
        .select('track_id')
        .in('track_id', ids);

      // Batch fetch stem counts
      const { data: stems } = await supabase
        .from('track_stems')
        .select('track_id')
        .in('track_id', ids);

      // Aggregate counts by track_id
      const newCounts: TrackCountsMap = {};
      
      ids.forEach(id => {
        newCounts[id] = {
          versionCount: versions?.filter(v => v.track_id === id).length || 0,
          stemCount: stems?.filter(s => s.track_id === id).length || 0,
        };
      });

      setCountsMap(prev => ({ ...prev, ...newCounts }));
    } catch (error) {
      console.error('Error fetching track counts:', error);
    }
  }, []);

  // Setup realtime subscription for stems and versions
  useEffect(() => {
    if (trackIds.length === 0) return;

    // Only re-subscribe if track IDs changed significantly
    const idsChanged = trackIds.length !== trackIdsRef.current.length ||
      trackIds.some(id => !trackIdsRef.current.includes(id));
    
    if (!idsChanged && channelRef.current) return;

    trackIdsRef.current = trackIds;

    // Initial fetch
    fetchCounts(trackIds);

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create single channel for all track updates
    const channel = supabase
      .channel('track-counts-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_stems',
        },
        (payload) => {
          const trackId = payload.new.track_id;
          if (trackIds.includes(trackId)) {
            console.log('✅ New stem added for track:', trackId);
            setCountsMap(prev => ({
              ...prev,
              [trackId]: {
                ...prev[trackId],
                stemCount: (prev[trackId]?.stemCount || 0) + 1,
              },
            }));
            toast.success('Стемы готовы! 🎵');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_versions',
        },
        (payload) => {
          const trackId = payload.new.track_id;
          if (trackIds.includes(trackId)) {
            console.log('✅ New version added for track:', trackId);
            setCountsMap(prev => ({
              ...prev,
              [trackId]: {
                ...prev[trackId],
                versionCount: (prev[trackId]?.versionCount || 0) + 1,
              },
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [trackIds.join(','), fetchCounts]);

  // Get counts for a specific track
  const getCountsForTrack = useCallback((trackId: string): TrackCounts => {
    return countsMap[trackId] || { versionCount: 0, stemCount: 0 };
  }, [countsMap]);

  return {
    countsMap,
    getCountsForTrack,
    refetchCounts: () => fetchCounts(trackIds),
  };
}
