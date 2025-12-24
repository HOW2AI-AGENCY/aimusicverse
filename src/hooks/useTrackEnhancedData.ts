/**
 * Centralized hook for track-related derived data
 * Consolidates MIDI status, version counts, stem counts
 * 
 * Optimization: Single source of truth to avoid duplicate lookups
 */

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrackMidiStatus {
  hasMidi: boolean;
  hasPdf: boolean;
  hasGp5: boolean;
  hasMusicXml: boolean;
  transcriptionCount: number;
}

export interface TrackCounts {
  versionCount: number;
  stemCount: number;
}

interface TrackEnhancedData {
  midiStatus: TrackMidiStatus;
  counts: TrackCounts;
}

/**
 * Fetch enhanced data for multiple tracks in a single batch
 */
export function useTrackEnhancedData(trackIds: string[]) {
  // Fetch all stem transcriptions for tracks
  const { data: transcriptions } = useQuery({
    queryKey: ['track-transcriptions-batch', trackIds],
    queryFn: async () => {
      if (trackIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('track_id, midi_url, pdf_url, gp5_url, mxml_url')
        .in('track_id', trackIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: trackIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch version counts
  const { data: versions } = useQuery({
    queryKey: ['track-versions-batch', trackIds],
    queryFn: async () => {
      if (trackIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('track_versions')
        .select('track_id')
        .in('track_id', trackIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: trackIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch stem counts
  const { data: stems } = useQuery({
    queryKey: ['track-stems-batch', trackIds],
    queryFn: async () => {
      if (trackIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('track_stems')
        .select('track_id')
        .in('track_id', trackIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: trackIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Build lookup maps for O(1) access
  const midiStatusMap = useMemo(() => {
    const map = new Map<string, TrackMidiStatus>();
    
    if (!transcriptions) return map;
    
    // Group transcriptions by track_id
    const byTrack = new Map<string, typeof transcriptions>();
    for (const t of transcriptions) {
      if (!byTrack.has(t.track_id)) {
        byTrack.set(t.track_id, []);
      }
      byTrack.get(t.track_id)!.push(t);
    }
    
    // Build status for each track
    for (const [trackId, trans] of byTrack) {
      map.set(trackId, {
        hasMidi: trans.some(t => !!t.midi_url),
        hasPdf: trans.some(t => !!t.pdf_url),
        hasGp5: trans.some(t => !!t.gp5_url),
        hasMusicXml: trans.some(t => !!t.mxml_url),
        transcriptionCount: trans.length,
      });
    }
    
    return map;
  }, [transcriptions]);

  const countsMap = useMemo(() => {
    const map = new Map<string, TrackCounts>();
    
    // Count versions per track
    const versionCounts = new Map<string, number>();
    if (versions) {
      for (const v of versions) {
        versionCounts.set(v.track_id, (versionCounts.get(v.track_id) || 0) + 1);
      }
    }
    
    // Count stems per track
    const stemCounts = new Map<string, number>();
    if (stems) {
      for (const s of stems) {
        stemCounts.set(s.track_id, (stemCounts.get(s.track_id) || 0) + 1);
      }
    }
    
    // Build combined counts
    for (const trackId of trackIds) {
      map.set(trackId, {
        versionCount: versionCounts.get(trackId) || 0,
        stemCount: stemCounts.get(trackId) || 0,
      });
    }
    
    return map;
  }, [versions, stems, trackIds]);

  // Getter functions for components
  const getMidiStatus = useCallback((trackId: string): TrackMidiStatus | undefined => {
    return midiStatusMap.get(trackId);
  }, [midiStatusMap]);

  const getCountsForTrack = useCallback((trackId: string): TrackCounts => {
    return countsMap.get(trackId) || { versionCount: 0, stemCount: 0 };
  }, [countsMap]);

  const getEnhancedData = useCallback((trackId: string): TrackEnhancedData => {
    return {
      midiStatus: midiStatusMap.get(trackId) || {
        hasMidi: false,
        hasPdf: false,
        hasGp5: false,
        hasMusicXml: false,
        transcriptionCount: 0,
      },
      counts: countsMap.get(trackId) || { versionCount: 0, stemCount: 0 },
    };
  }, [midiStatusMap, countsMap]);

  return {
    getMidiStatus,
    getCountsForTrack,
    getEnhancedData,
    midiStatusMap,
    countsMap,
  };
}

/**
 * Single track version - for detail views
 */
export function useSingleTrackEnhancedData(trackId: string | undefined) {
  const trackIds = useMemo(() => trackId ? [trackId] : [], [trackId]);
  const { getMidiStatus, getCountsForTrack } = useTrackEnhancedData(trackIds);
  
  return useMemo(() => {
    if (!trackId) return null;
    return {
      midiStatus: getMidiStatus(trackId),
      counts: getCountsForTrack(trackId),
    };
  }, [trackId, getMidiStatus, getCountsForTrack]);
}
