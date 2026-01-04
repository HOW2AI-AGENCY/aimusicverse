/**
 * useTrackGuitarAnalysis - Hook to fetch and cache guitar analysis data for a track
 * Checks if guitar analysis exists in storage and fetches it
 * Used to integrate klang.io analysis results into Stem Studio
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GuitarAnalysisResult } from './useGuitarAnalysis';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'TrackGuitarAnalysis' });

interface StoredGuitarAnalysis {
  trackId: string;
  analysis: GuitarAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export function useTrackGuitarAnalysis(trackId: string | null | undefined) {
  return useQuery({
    queryKey: ['track-guitar-analysis', trackId],
    queryFn: async (): Promise<GuitarAnalysisResult | null> => {
      if (!trackId) return null;

      try {
        // Check if guitar analysis exists in storage
        // Analysis is stored as JSON file: {userId}/guitar-analysis/{trackId}.json
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          log.warn('No user authenticated');
          return null;
        }

        const analysisPath = `${user.id}/guitar-analysis/${trackId}.json`;
        
        // Try to download analysis file
        const { data, error } = await supabase.storage
          .from('project-assets')
          .download(analysisPath);

        if (error) {
          // File doesn't exist or error accessing it
          log.info('No guitar analysis found for track', { trackId, error: error.message });
          return null;
        }

        if (!data) {
          return null;
        }

        // Parse JSON
        const text = await data.text();
        const stored: StoredGuitarAnalysis = JSON.parse(text);

        log.info('Loaded guitar analysis for track', { 
          trackId, 
          chordsCount: stored.analysis.chords.length,
          beatsCount: stored.analysis.beats.length,
        });

        return stored.analysis;
      } catch (error) {
        log.error('Error loading guitar analysis', error);
        return null;
      }
    },
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Save guitar analysis to storage for a track
 */
export async function saveGuitarAnalysisForTrack(
  trackId: string,
  analysis: GuitarAnalysisResult
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      log.error('Cannot save analysis: no user');
      return false;
    }

    const stored: StoredGuitarAnalysis = {
      trackId,
      analysis,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analysisPath = `${user.id}/guitar-analysis/${trackId}.json`;
    const blob = new Blob([JSON.stringify(stored, null, 2)], { type: 'application/json' });

    const { error } = await supabase.storage
      .from('project-assets')
      .upload(analysisPath, blob, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      log.error('Error saving guitar analysis', error);
      return false;
    }

    log.info('Saved guitar analysis for track', { trackId });
    return true;
  } catch (error) {
    log.error('Error saving guitar analysis', error);
    return false;
  }
}
