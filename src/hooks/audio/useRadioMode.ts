/**
 * Radio Mode Hook
 * 
 * Auto-queues similar tracks when the current queue is about to end.
 * Uses the current track's style/tags to find similar tracks.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from './usePlayerState';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Track } from '@/types/track';
import { toast } from 'sonner';

const log = logger.child({ module: 'RadioMode' });

const RADIO_FETCH_LIMIT = 5; // Number of tracks to fetch at a time
const TRACKS_THRESHOLD = 2; // When remaining tracks <= this, fetch more

interface UseRadioModeOptions {
  /** Whether radio mode is enabled */
  enabled?: boolean;
  /** Show toast when adding tracks */
  showToast?: boolean;
}

interface RadioModeState {
  isEnabled: boolean;
  isFetching: boolean;
  autoAddedCount: number;
}

/**
 * Hook for Radio Mode functionality
 * Automatically adds similar tracks when queue is running low
 */
export function useRadioMode(options: UseRadioModeOptions = {}) {
  const { showToast = true } = options;
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [autoAddedCount, setAutoAddedCount] = useState(0);
  
  const fetchedTrackIds = useRef<Set<string>>(new Set());
  const lastFetchRef = useRef<number>(0);
  
  const queue = usePlayerStore(s => s.queue);
  const currentIndex = usePlayerStore(s => s.currentIndex);
  const activeTrack = usePlayerStore(s => s.activeTrack);
  const repeat = usePlayerStore(s => s.repeat);
  const addToQueue = usePlayerStore(s => s.addToQueue);

  /**
   * Fetch similar tracks based on current track's style/tags
   */
  const fetchSimilarTracks = useCallback(async (track: Track): Promise<Track[]> => {
    try {
      // Build query for similar tracks
      let query = supabase
        .from('tracks')
        .select('*')
        .eq('status', 'completed')
        .neq('id', track.id)
        .limit(RADIO_FETCH_LIMIT * 2); // Fetch extra to filter duplicates

      // Match by style if available
      if (track.style) {
        query = query.ilike('style', `%${track.style.split(' ')[0]}%`);
      }

      // Exclude already queued and fetched tracks
      const excludeIds = [
        ...queue.map(t => t.id),
        ...Array.from(fetchedTrackIds.current),
      ];
      
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // Order by random for variety
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        log.error('Failed to fetch similar tracks', { error });
        return [];
      }

      // Filter and limit results
      const filteredTracks = (data || [])
        .filter(t => t.audio_url || t.streaming_url)
        .slice(0, RADIO_FETCH_LIMIT);

      // Mark as fetched to avoid duplicates
      filteredTracks.forEach(t => fetchedTrackIds.current.add(t.id));

      return filteredTracks as Track[];
    } catch (error) {
      log.error('Error fetching similar tracks', { error });
      return [];
    }
  }, [queue]);

  /**
   * Check if we need to fetch more tracks
   */
  const checkAndFetchMore = useCallback(async () => {
    if (!isEnabled || isFetching || !activeTrack || repeat === 'one') {
      return;
    }

    // Calculate remaining tracks
    const remainingTracks = queue.length - currentIndex - 1;
    
    // If we're at "repeat all", don't auto-add
    if (repeat === 'all' && remainingTracks <= 0) {
      return;
    }

    // Check if we need more tracks
    if (remainingTracks > TRACKS_THRESHOLD) {
      return;
    }

    // Debounce fetching
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;

    log.info('Radio mode: fetching more tracks', { remainingTracks });
    setIsFetching(true);

    try {
      const newTracks = await fetchSimilarTracks(activeTrack);
      
      if (newTracks.length > 0) {
        // Add tracks to queue
        newTracks.forEach(track => {
          addToQueue(track);
        });
        
        setAutoAddedCount(prev => prev + newTracks.length);
        
        if (showToast) {
          toast.info('🎵 Радио', {
            description: `Добавлено ${newTracks.length} похожих треков`,
          });
        }
        
        log.info('Radio mode: added tracks', { count: newTracks.length });
      } else {
        log.info('Radio mode: no similar tracks found');
      }
    } finally {
      setIsFetching(false);
    }
  }, [isEnabled, isFetching, activeTrack, queue.length, currentIndex, repeat, fetchSimilarTracks, addToQueue, showToast]);

  /**
   * Toggle radio mode
   */
  const toggleRadioMode = useCallback(() => {
    setIsEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        // Reset counters when enabling
        fetchedTrackIds.current.clear();
        setAutoAddedCount(0);
        toast.success('🎵 Радио включено', {
          description: 'Похожие треки будут добавляться автоматически',
        });
      } else {
        toast.info('Радио выключено');
      }
      
      return newState;
    });
  }, []);

  /**
   * Enable radio mode
   */
  const enableRadioMode = useCallback(() => {
    if (!isEnabled) {
      toggleRadioMode();
    }
  }, [isEnabled, toggleRadioMode]);

  /**
   * Disable radio mode
   */
  const disableRadioMode = useCallback(() => {
    if (isEnabled) {
      toggleRadioMode();
    }
  }, [isEnabled, toggleRadioMode]);

  // Auto-check when queue state changes
  useEffect(() => {
    if (isEnabled) {
      checkAndFetchMore();
    }
  }, [isEnabled, currentIndex, queue.length, checkAndFetchMore]);

  // Clear fetched IDs when track changes significantly
  useEffect(() => {
    if (activeTrack && fetchedTrackIds.current.size > 50) {
      // Reset to prevent memory leak
      fetchedTrackIds.current.clear();
    }
  }, [activeTrack?.id]);

  return {
    // State
    isEnabled,
    isFetching,
    autoAddedCount,
    
    // Actions
    toggleRadioMode,
    enableRadioMode,
    disableRadioMode,
    
    // Manual trigger
    fetchMore: checkAndFetchMore,
  };
}
