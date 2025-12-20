/**
 * Version Switcher Hook
 * 
 * Manages switching between track versions and setting primary version
 * Includes optimistic updates for better UX
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TrackVersion = Database['public']['Tables']['track_versions']['Row'];

interface SetPrimaryVersionParams {
  trackId: string;
  versionId: string;
}

interface SwitchVersionParams {
  trackId: string;
  versionId: string;
}

/**
 * Hook for switching primary version with optimistic updates
 */
export function useVersionSwitcher() {
  const queryClient = useQueryClient();

  const setPrimaryVersionMutation = useMutation({
    mutationFn: async ({ trackId, versionId }: SetPrimaryVersionParams) => {
      // Step 1: Get the version data to get audio_url
      const { data: versionData, error: fetchError } = await supabase
        .from('track_versions')
        .select('audio_url, cover_url, duration_seconds')
        .eq('id', versionId)
        .single();

      if (fetchError) throw fetchError;
      if (!versionData?.audio_url) throw new Error('Version has no audio URL');

      // Step 2: Unset is_primary for ALL versions of this track
      const { error: unsetError } = await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);

      if (unsetError) throw unsetError;

      // Step 3: Set the selected version as primary
      const { error: setError } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      if (setError) throw setError;

      // Step 4: Update the track with new audio and reset stems
      // Reset has_stems so stems will be regenerated for new audio
      const { error: trackError } = await supabase
        .from('tracks')
        .update({ 
          active_version_id: versionId,
          audio_url: versionData.audio_url,
          cover_url: versionData.cover_url || undefined,
          duration_seconds: versionData.duration_seconds || undefined,
          has_stems: false, // Reset so user can re-separate stems for new audio
        })
        .eq('id', trackId);

      if (trackError) throw trackError;

      // Step 5: Log the change
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('track_change_log').insert({
          track_id: trackId,
          version_id: versionId,
          change_type: 'master_changed',
          changed_by: 'user',
          user_id: userData.user.id,
          new_value: versionId,
        });
      }

      return { trackId, versionId, audioUrl: versionData.audio_url };
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
          is_primary: version.id === versionId,
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
      toast.error('Failed to set primary version', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
    onSuccess: () => {
      toast.success('Primary version updated successfully');
    },
    onSettled: (data) => {
      // Refetch to sync with server
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['track-versions', data.trackId] });
        queryClient.invalidateQueries({ queryKey: ['tracks'] });
        queryClient.invalidateQueries({ queryKey: ['track-change-log', data.trackId] });
        // Invalidate stems cache since has_stems was reset
        queryClient.invalidateQueries({ queryKey: ['track-stems', data.trackId] });
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
    setPrimaryVersion: setPrimaryVersionMutation.mutate,
    setPrimaryVersionAsync: setPrimaryVersionMutation.mutateAsync,
    switchVersion: switchVersionMutation.mutate,
    switchVersionAsync: switchVersionMutation.mutateAsync,
    isSettingPrimary: setPrimaryVersionMutation.isPending,
    isSwitching: switchVersionMutation.isPending,
  };
}
