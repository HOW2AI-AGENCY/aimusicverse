/**
 * useTrackVersionSwitcher Hook
 *
 * Per contracts/useTrackVersionSwitcher.contract.ts:
 * - A/B version switching
 * - Atomic updates (is_primary AND active_version_id)
 * - Version history tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { UseTrackVersionSwitcherParams, UseTrackVersionSwitcherReturn } from '@/hooks/types/track';
import type { TrackVersion } from '@/types/track';

/**
 * Fetch all track versions
 */
async function fetchTrackVersions(trackId: string): Promise<TrackVersion[]> {
  const { data, error } = await supabase
    .from('track_versions')
    .select('*')
    .eq('track_id', trackId)
    .order('clip_index', { ascending: true });

  if (error) {
    logger.error('Failed to fetch track versions', { error, trackId });
    throw error;
  }

  return data as TrackVersion[];
}

/**
 * Switch active version (atomic update)
 *
 * Per database schema: Must update BOTH is_primary AND active_version_id
 */
async function switchVersion(trackId: string, versionId: string): Promise<void> {
  // Atomic update using RPC to ensure both fields are updated together
  const { error } = await supabase.rpc('switch_track_version', {
    p_track_id: trackId,
    p_version_id: versionId,
  });

  if (error) {
    logger.error('Failed to switch track version', { error, trackId, versionId });
    throw error;
  }

  // Log the change
  await supabase.from('track_change_log').insert({
    track_id: trackId,
    change_type: 'version_switch',
    old_value: null, // Will be filled by trigger
    new_value: versionId,
  });
}

/**
 * Hook for track version switching
 *
 * @example
 * ```tsx
 * const { activeVersion, allVersions, switchVersion, isPending } = useTrackVersionSwitcher({
 *   trackId: track.id,
 * });
 *
 * return (
 *   <div>
 *     {allVersions.map((version) => (
 *       <button
 *         key={version.id}
 *         onClick={() => switchVersion(version.id)}
 *         disabled={isPending}
 *       >
 *         {version.version_label}
 *       </button>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useTrackVersionSwitcher(
  params: UseTrackVersionSwitcherParams
): UseTrackVersionSwitcherReturn {
  const queryClient = useQueryClient();
  const { trackId, enableRefetch = true } = params;

  // Fetch all versions
  const {
    data: versions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['track-versions', trackId],
    queryFn: () => fetchTrackVersions(trackId),
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Find active version
  const activeVersion = versions.find((v) => v.is_primary) || null;

  // Switch version mutation
  const mutation = useMutation({
    mutationFn: async (versionId: string) => {
      await switchVersion(trackId, versionId);
    },
    onMutate: async (newVersionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['track-versions', trackId] });

      // Snapshot previous value
      const previousVersions = queryClient.getQueryData<TrackVersion[]>([
        'track-versions',
        trackId,
      ]);

      // Optimistically update
      if (previousVersions) {
        queryClient.setQueryData<TrackVersion[]>(
          ['track-versions', trackId],
          (old = []) =>
            old.map((v) => ({
              ...v,
              is_primary: v.id === newVersionId,
            }))
        );
      }

      return { previousVersions };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousVersions) {
        queryClient.setQueryData(
          ['track-versions', trackId],
          context.previousVersions
        );
      }
      logger.error('Version switch failed', { error, trackId });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      queryClient.invalidateQueries({ queryKey: ['track', trackId] });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
  });

  return {
    activeVersion,
    allVersions: versions,
    switchVersion: (versionId: string) => mutation.mutate(versionId),
    isPending: mutation.isPending,
    error: error as Error | null,
  };
}
