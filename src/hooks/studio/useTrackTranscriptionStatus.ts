/**
 * useTrackTranscriptionStatus
 * Hook to check if tracks have transcription data available
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TranscriptionStatus {
  [trackId: string]: boolean;
}

/**
 * Check transcription status for multiple tracks
 * Returns a map of track IDs to boolean (true if transcription exists)
 */
export function useTrackTranscriptionStatus(trackIds: string[]) {
  return useQuery({
    queryKey: ['track-transcription-status', trackIds.sort().join(',')],
    queryFn: async () => {
      if (trackIds.length === 0) return {};
      
      // Query stem_transcriptions for these tracks
      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('track_id, stem_id')
        .in('track_id', trackIds);
      
      if (error) {
        console.error('Error fetching transcription status:', error);
        return {};
      }
      
      // Build status map
      const status: TranscriptionStatus = {};
      trackIds.forEach(id => {
        status[id] = false;
      });
      
      // Mark tracks that have transcriptions
      data?.forEach(item => {
        if (item.track_id) {
          status[item.track_id] = true;
        }
        // Also check by stem_id if it matches a track
        if (item.stem_id && trackIds.includes(item.stem_id)) {
          status[item.stem_id] = true;
        }
      });
      
      return status;
    },
    enabled: trackIds.length > 0,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}
