/**
 * Version Switcher Hook
 * 
 * Manages switching between track versions and setting master version
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TrackVersion } from './useTrackVersions';

interface SetMasterVersionParams {
  trackId: string;
  versionId: string;
}

interface SwitchVersionParams {
  trackId: string;
  versionId: string;
}

/**
 * Hook for switching master version with optimistic updates
 */
export function useVersionSwitcher() {
  const queryClient = useQueryClient();

  const setMasterVersionMutation = useMutation({
    mutationFn: async ({ trackId, versionId }: SetMasterVersionParams) => {
      // First, unset current master
      const { error: unsetError } = await supabase
        .from('track_versions')
        .update({ is_master: false })
        .eq('track_id', trackId)
        .eq('is_master', true);

      if (unsetError) throw unsetError;

      // Then set new master
      const { error: setError } = await supabase
        .from('track_versions')
        .update({ is_master: true })
        .eq('id', versionId);

      if (setError) throw setError;

      // Update the track's master_version_id
      const { error: trackError } = await supabase
        .from('tracks')
        .update({ master_version_id: versionId })
        .eq('id', trackId);

      if (trackError) throw trackError;

      // Log the change in changelog
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('track_changelog').insert({
          track_id: trackId,
          version_id: versionId,
          change_type: 'master_changed',
          user_id: userData.user.id,
          change_data: {
            new_value: { version_id: versionId },
          },
        });
      }

      return { trackId, versionId };
    },
    onMutate: async ({ trackId, versionId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['track-versions', trackId] });

      // Snapshot previous value
      const previousVersions = queryClient.getQueryData<TrackVersion[]>([
        'track-versions',
        trackId,
      ]);

      // Optimistically update versions
      if (previousVersions) {
        const updatedVersions = previousVersions.map((version) => ({
          ...version,
          is_master: version.id === versionId,
        }));
        queryClient.setQueryData(['track-versions', trackId], updatedVersions);
      }

      return { previousVersions };
    },
    onError: (error, { trackId }, context) => {
      // Rollback on error
      if (context?.previousVersions) {
        queryClient.setQueryData(['track-versions', trackId], context.previousVersions);
      }
      toast.error('Failed to set master version', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
    onSuccess: () => {
      toast.success('Master version updated successfully');
    },
    onSettled: (data) => {
      // Refetch to sync with server
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['track-versions', data.trackId] });
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        queryClient.invalidateQueries({ queryKey: ['track-changelog', data.trackId] });
      }
    },
  });

  const switchVersionMutation = useMutation({
    mutationFn: async ({ trackId, versionId }: SwitchVersionParams) => {
      // This is primarily a client-side switch
      // The actual version data is already in the versions list
      const { data: version, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (error) throw error;
      return version;
    },
    onError: (error) => {
      toast.error('Failed to switch version', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return {
    setMasterVersion: setMasterVersionMutation.mutate,
    setMasterVersionAsync: setMasterVersionMutation.mutateAsync,
    switchVersion: switchVersionMutation.mutate,
    switchVersionAsync: switchVersionMutation.mutateAsync,
    isSettingMaster: setMasterVersionMutation.isPending,
    isSwitching: switchVersionMutation.isPending,
  };
}
