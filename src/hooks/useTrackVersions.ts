/**
 * Track Versions Hook
 * 
 * Hook for fetching and managing track versions
 * Integrates with TanStack Query for caching and automatic refetching
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchTrackVersions,
  fetchMasterVersion,
  getVersionCount,
} from '@/integrations/supabase/queries/versioning';
import type { Database } from '@/integrations/supabase/types';

export type TrackVersion = Database['public']['Tables']['track_versions']['Row'];

/**
 * Fetch all versions for a track
 */
export function useTrackVersions(trackId: string | undefined) {
  return useQuery({
    queryKey: ['track-versions', trackId],
    queryFn: () => {
      if (!trackId) throw new Error('Track ID is required');
      return fetchTrackVersions(trackId);
    },
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch master version for a track
 */
export function useMasterVersion(trackId: string | undefined) {
  return useQuery({
    queryKey: ['master-version', trackId],
    queryFn: () => {
      if (!trackId) throw new Error('Track ID is required');
      return fetchMasterVersion(trackId);
    },
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get version count for a track
 */
export function useVersionCount(trackId: string | undefined) {
  return useQuery({
    queryKey: ['version-count', trackId],
    queryFn: () => {
      if (!trackId) throw new Error('Track ID is required');
      return getVersionCount(trackId);
    },
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
