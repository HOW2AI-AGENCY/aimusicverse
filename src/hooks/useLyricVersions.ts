// @ts-nocheck
/**
 * Lyric Versions Hook
 *
 * Hook for fetching and managing lyric versions with optimistic updates.
 * Integrates with TanStack Query for caching and automatic refetching.
 *
 * @example
 * const { data: versions, isLoading } = useLyricVersions(trackId);
 * const { createVersion, isCreating } = useCreateLyricVersion();
 * const { restoreVersion, isRestoring } = useRestoreLyricVersion();
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getLyricVersions,
  createLyricVersion,
  restoreLyricVersion,
  type LyricVersionWithAuthor,
  type CreateLyricVersionRequest,
  type RestoreLyricVersionResponse,
} from '@/api/lyrics.api';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys factory for lyric versions
 * Provides a consistent way to generate query keys for caching and invalidation
 */
export const lyricVersionsKeys = {
  all: ['lyric-versions'] as const,
  forTrack: (trackId: string) => ['lyric-versions', trackId] as const,
  current: (trackId: string) => ['lyric-versions', trackId, 'current'] as const,
} as const;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all lyric versions for a track
 *
 * @param trackId - The track ID to fetch lyric versions for
 * @returns Query result with lyric versions data
 *
 * @example
 * const { data: versions, isLoading, error } = useLyricVersions(trackId);
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * return <LyricVersionList versions={versions?.versions || []} />;
 */
export function useLyricVersions(trackId: string | undefined) {
  return useQuery({
    queryKey: lyricVersionsKeys.forTrack(trackId || ''),
    queryFn: () => {
      if (!trackId) throw new Error('Track ID is required');
      return getLyricVersions(trackId);
    },
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
}

/**
 * Fetch the current lyric version for a track
 *
 * @param trackId - The track ID to fetch the current lyric version for
 * @returns Query result with the current lyric version
 *
 * @example
 * const { data: currentVersion, isLoading } = useCurrentLyricVersion(trackId);
 */
export function useCurrentLyricVersion(trackId: string | undefined) {
  const { data: versions } = useLyricVersions(trackId);

  return useQuery({
    queryKey: lyricVersionsKeys.current(trackId || ''),
    queryFn: () => {
      if (!trackId) throw new Error('Track ID is required');
      const current = versions?.versions.find((v) => v.isCurrent);
      if (!current) {
        throw new Error('No current lyric version found');
      }
      return current;
    },
    enabled: !!trackId && !!versions?.versions.length,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

interface CreateLyricVersionParams {
  trackId: string;
  request: CreateLyricVersionRequest;
}

/**
 * Create a new lyric version mutation
 *
 * Includes optimistic updates to immediately show the new version in the list
 *
 * @returns Mutation object with createVersion function and loading state
 *
 * @example
 * const { createVersion, isCreating } = useCreateLyricVersion();
 *
 * const handleCreate = () => {
 *   createVersion(
 *     { trackId, request: { content: 'New lyrics', changeType: 'manual_edit' } },
 *     {
 *       onSuccess: () => {
 *         toast.success('Version created');
 *       },
 *     }
 *   );
 * };
 */
export function useCreateLyricVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ trackId, request }: CreateLyricVersionParams) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create lyric versions');
      }

      return createLyricVersion(trackId, user.id, request);
    },

    // Optimistic update
    onMutate: async ({ trackId, request }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: lyricVersionsKeys.forTrack(trackId),
      });

      // Snapshot previous value
      const previousVersions = queryClient.getQueryData<{
        versions: LyricVersionWithAuthor[];
      }>(lyricVersionsKeys.forTrack(trackId));

      // Optimistically update to the new value
      if (previousVersions && user) {
        const optimisticVersion: LyricVersionWithAuthor = {
          id: `temp-${Date.now()}`,
          versionNumber: (previousVersions.versions[0]?.versionNumber || 0) + 1,
          content: request.content,
          author: {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
          },
          createdAt: new Date().toISOString(),
          isCurrent: true,
          changeSummary: request.changeSummary || null,
          versionName: request.versionName || null,
          changeType: request.changeType,
          sectionsData: request.sectionsData || null,
          tags: request.tags || null,
          aiModelUsed: null,
          aiPromptUsed: null,
        };

        // Mark all existing versions as not current
        const updatedVersions = previousVersions.versions.map((v) => ({
          ...v,
          isCurrent: false,
        }));

        // Add the optimistic version at the beginning
        queryClient.setQueryData(lyricVersionsKeys.forTrack(trackId), {
          versions: [optimisticVersion, ...updatedVersions],
        });
      }

      // Return context with previous value for rollback
      return { previousVersions, trackId };
    },

    // Rollback on error
    onError: (error, { trackId }, context) => {
      if (context?.previousVersions) {
        queryClient.setQueryData(
          lyricVersionsKeys.forTrack(trackId),
          context.previousVersions
        );
      }

      logger.error('Failed to create lyric version', { error, trackId });

      toast.error('Failed to create lyric version', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Refetch on success
    onSuccess: (data, { trackId }) => {
      logger.info('Lyric version created successfully', {
        versionId: data.id,
        trackId,
      });

      toast.success('Lyric version created', {
        description: `Version ${data.versionNumber} has been created`,
      });
    },

    // Always refetch after error or success
    onSettled: (data, error, { trackId }) => {
      queryClient.invalidateQueries({
        queryKey: lyricVersionsKeys.forTrack(trackId),
      });
      queryClient.invalidateQueries({
        queryKey: lyricVersionsKeys.current(trackId),
      });
    },
  });

  return {
    createVersion: mutation.mutate,
    createVersionAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

interface RestoreLyricVersionParams {
  versionId: string;
}

/**
 * Restore a previous lyric version mutation
 *
 * Creates a new version based on the content of a previous version,
 * marking it as the current version. Includes optimistic updates.
 *
 * @returns Mutation object with restoreVersion function and loading state
 *
 * @example
 * const { restoreVersion, isRestoring } = useRestoreLyricVersion();
 *
 * const handleRestore = (versionId: string) => {
 *   restoreVersion(versionId, {
 *     onSuccess: (data) => {
 *       toast.success(`Restored to version ${data.restoredVersion.versionNumber}`);
 *     },
 *   });
 * };
 */
export function useRestoreLyricVersion() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ versionId }: RestoreLyricVersionParams) => {
      return restoreLyricVersion(versionId);
    },

    // Optimistic update
    onMutate: async ({ versionId }) => {
      // Get the current versions to find the track ID
      const queries = queryClient.getQueriesData<{
        versions: LyricVersionWithAuthor[];
      }>(lyricVersionsKeys.all);

      let trackId: string | undefined;
      let previousVersions: { versions: LyricVersionWithAuthor[] } | undefined;

      for (const [queryKey, data] of queries) {
        if (data) {
          const versionToRestore = data.versions.find((v) => v.id === versionId);
          if (versionToRestore) {
            trackId = queryKey[1] as string;
            previousVersions = data;
            break;
          }
        }
      }

      if (!trackId || !previousVersions) {
        return { previousVersions, trackId };
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: lyricVersionsKeys.forTrack(trackId),
      });

      // Find the version being restored
      const versionToRestore = previousVersions.versions.find(
        (v) => v.id === versionId
      );

      if (!versionToRestore) {
        return { previousVersions, trackId };
      }

      // Create optimistic restored version
      const optimisticVersion: LyricVersionWithAuthor = {
        ...versionToRestore,
        id: `temp-restore-${Date.now()}`,
        versionNumber: (previousVersions.versions[0]?.versionNumber || 0) + 1,
        isCurrent: true,
        changeSummary: `Restored from version ${versionToRestore.versionNumber}`,
        versionName: `v${(previousVersions.versions[0]?.versionNumber || 0) + 1} (restored)`,
        changeType: 'restore',
      };

      // Mark all existing versions as not current
      const updatedVersions = previousVersions.versions.map((v) => ({
        ...v,
        isCurrent: false,
      }));

      // Add the optimistic restored version at the beginning
      queryClient.setQueryData(lyricVersionsKeys.forTrack(trackId), {
        versions: [optimisticVersion, ...updatedVersions],
      });

      // Return context with previous value for rollback
      return { previousVersions, trackId };
    },

    // Rollback on error
    onError: (error, { versionId }, context) => {
      if (context?.previousVersions && context?.trackId) {
        queryClient.setQueryData(
          lyricVersionsKeys.forTrack(context.trackId),
          context.previousVersions
        );
      }

      logger.error('Failed to restore lyric version', { error, versionId });

      toast.error('Failed to restore lyric version', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },

    // Show success message
    onSuccess: (data: RestoreLyricVersionResponse, { versionId }) => {
      logger.info('Lyric version restored successfully', {
        versionId,
        restoredVersionId: data.restoredVersion.id,
      });

      toast.success('Lyric version restored', {
        description: `Restored to version ${data.restoredVersion.versionNumber}`,
      });
    },

    // Always refetch after error or success
    onSettled: (data, error, { versionId }) => {
      // Invalidate all lyric version queries since we don't have trackId directly
      queryClient.invalidateQueries({
        queryKey: lyricVersionsKeys.all,
      });
    },
  });

  return {
    restoreVersion: mutation.mutate,
    restoreVersionAsync: mutation.mutateAsync,
    isRestoring: mutation.isPending,
    error: mutation.error,
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Return type for useLyricVersions hook
 */
export type UseLyricVersionsResult = ReturnType<typeof useLyricVersions>;

/**
 * Return type for useCurrentLyricVersion hook
 */
export type UseCurrentLyricVersionResult = ReturnType<typeof useCurrentLyricVersion>;

/**
 * Return type for useCreateLyricVersion hook
 */
export type UseCreateLyricVersionResult = ReturnType<typeof useCreateLyricVersion>;

/**
 * Return type for useRestoreLyricVersion hook
 */
export type UseRestoreLyricVersionResult = ReturnType<typeof useRestoreLyricVersion>;
