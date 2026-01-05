/**
 * Hook to fetch all generated tracks for a project or project track slot
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';

export interface ProjectGeneratedTrack {
  id: string;
  title: string | null;
  style: string | null;
  cover_url: string | null;
  local_cover_url: string | null;
  audio_url: string | null;
  local_audio_url: string | null;
  streaming_url: string | null;
  duration_seconds: number | null;
  status: string | null;
  is_approved: boolean | null;
  is_primary: boolean | null;
  approved_at: string | null;
  project_track_id: string | null;
  project_id: string | null;
  created_at: string | null;
  // Assets info
  stems_count?: number;
  has_midi?: boolean;
  has_notes?: boolean;
}

export function useProjectGeneratedTracks(projectId: string | undefined, projectTrackId?: string) {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  // Always fetch ALL tracks for the project to include orphaned tracks
  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ['project-generated-tracks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectGeneratedTrack[];
    },
    enabled: !!projectId,
  });

  // Mutation to link orphaned track to a project track slot
  const linkTrackToSlot = useMutation({
    mutationFn: async ({ trackId, targetProjectTrackId }: { trackId: string; targetProjectTrackId: string }) => {
      const { error } = await supabase
        .from('tracks')
        .update({ project_track_id: targetProjectTrackId })
        .eq('id', trackId);

      if (error) throw error;
      
      logAction({
        entityType: 'track',
        entityId: trackId,
        actorType: 'user',
        actionType: 'linked_to_slot',
        actionCategory: 'modification',
        inputMetadata: { projectId, projectTrackId: targetProjectTrackId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-generated-tracks', projectId] });
      toast.success('Трек привязан к слоту');
    },
    onError: () => {
      toast.error('Ошибка привязки трека');
    },
  });

  // Approve track for final project
  const approveTrack = useMutation({
    mutationFn: async (trackId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tracks')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', trackId);

      if (error) throw error;
      
      // Log approval for audit
      logAction({
        entityType: 'track',
        entityId: trackId,
        actorType: 'user',
        actionType: 'approved',
        actionCategory: 'approval',
        inputMetadata: { projectId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-generated-tracks', projectId] });
      toast.success('Трек одобрен');
    },
    onError: () => {
      toast.error('Ошибка одобрения трека');
    },
  });

  // Reject/unapprove track
  const rejectTrack = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase
        .from('tracks')
        .update({
          is_approved: false,
          approved_at: null,
          approved_by: null,
          is_primary: false,
        })
        .eq('id', trackId);

      if (error) throw error;
      
      // Log rejection for audit
      logAction({
        entityType: 'track',
        entityId: trackId,
        actorType: 'user',
        actionType: 'rejected',
        actionCategory: 'approval',
        inputMetadata: { projectId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-generated-tracks', projectId] });
      toast.success('Одобрение отменено');
    },
    onError: () => {
      toast.error('Ошибка');
    },
  });

  // Set track as master version
  const setMasterTrack = useMutation({
    mutationFn: async ({ trackId, projectTrackId }: { trackId: string; projectTrackId: string }) => {
      // First, unset any existing master for this project track slot
      await supabase
        .from('tracks')
        .update({ is_primary: false })
        .eq('project_track_id', projectTrackId);

      // Then set the new master
      const { error } = await supabase
        .from('tracks')
        .update({ 
          is_primary: true,
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq('id', trackId);

      if (error) throw error;

      // Also update the project_track link
      await supabase
        .from('project_tracks')
        .update({ 
          track_id: trackId,
          status: 'completed',
        })
        .eq('id', projectTrackId);
      
      // Log master selection for audit
      logAction({
        entityType: 'track',
        entityId: trackId,
        actorType: 'user',
        actionType: 'master_selected',
        actionCategory: 'approval',
        inputMetadata: { projectId, projectTrackId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-generated-tracks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      toast.success('Выбрана мастер-версия');
    },
    onError: () => {
      toast.error('Ошибка выбора версии');
    },
  });

  // Group tracks by project_track_id
  const tracksBySlot = tracks?.reduce((acc, track) => {
    const slotId = track.project_track_id || 'unlinked';
    if (!acc[slotId]) acc[slotId] = [];
    acc[slotId].push(track);
    return acc;
  }, {} as Record<string, ProjectGeneratedTrack[]>) || {};

  // Get unlinked tracks (those without project_track_id)
  const unlinkedTracks = tracksBySlot['unlinked'] || [];

  return {
    tracks,
    tracksBySlot,
    unlinkedTracks,
    isLoading,
    error,
    approveTrack: approveTrack.mutate,
    rejectTrack: rejectTrack.mutate,
    setMasterTrack: setMasterTrack.mutate,
    linkTrackToSlot: linkTrackToSlot.mutate,
    isApproving: approveTrack.isPending,
    isRejecting: rejectTrack.isPending,
    isSettingMaster: setMasterTrack.isPending,
    isLinking: linkTrackToSlot.isPending,
  };
}

// Hook to publish a project
export function usePublishProject() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('music_projects')
        .update({
          status: 'published',
          is_public: true,
          published_at: new Date().toISOString(),
          published_by: user?.id,
        })
        .eq('id', projectId);

      if (error) throw error;
      
      // Log publication for audit
      logAction({
        entityType: 'project',
        entityId: projectId,
        actorType: 'user',
        actionType: 'published',
        actionCategory: 'publication',
      });
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Проект опубликован!');
    },
    onError: () => {
      toast.error('Ошибка публикации');
    },
  });
}
