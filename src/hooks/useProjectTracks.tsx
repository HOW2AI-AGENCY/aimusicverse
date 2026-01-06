import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'ProjectTracks' });

export interface LinkedTrack {
  id: string;
  title: string | null;
  lyrics: string | null;
  audio_url: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  status: string | null;
}

export interface ProjectTrack {
  id: string;
  project_id: string;
  track_id: string | null;
  position: number;
  title: string;
  style_prompt: string | null;
  lyrics: string | null; // Full song lyrics
  notes: string | null; // Production notes
  lyrics_status: 'draft' | 'prompt' | 'generated' | 'approved' | null;
  recommended_tags: string[] | null;
  recommended_structure: string | null;
  duration_target: number | null;
  collab_artist_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Extended generation parameters
  bpm_target: number | null;
  key_signature: string | null;
  energy_level: number | null;
  vocal_style: string | null;
  instrumental_only: boolean | null;
  reference_url: string | null;
  generation_params: Json | null;
  // Linked track data
  linked_track?: LinkedTrack | null;
}

// JSON type from Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export const useProjectTracks = (projectId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ['project-tracks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_tracks')
        .select(`
          *,
          linked_track:tracks!project_tracks_track_id_fkey (
            id,
            title,
            lyrics,
            audio_url,
            cover_url,
            duration_seconds,
            status
          )
        `)
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as ProjectTrack[];
    },
    enabled: !!projectId && !!user?.id,
  });

  // Realtime subscription for project tracks updates
  useEffect(() => {
    if (!projectId) return;

    log.debug('Setting up realtime subscription for project tracks', { projectId });

    const channel = supabase
      .channel(`project-tracks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tracks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          log.debug('Project tracks change received', { event: payload.eventType });
          queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
        }
      )
      .subscribe();

    return () => {
      log.debug('Unsubscribing from project tracks realtime');
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const addTrack = useMutation({
    mutationFn: async (trackData: Partial<ProjectTrack> & { position: number; title: string }) => {
      if (!projectId) throw new Error('Project ID required');

      const { data, error } = await supabase
        .from('project_tracks')
        .insert([{
          project_id: projectId,
          ...trackData,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      toast.success('Трек добавлен');
    },
    onError: (error: any) => {
      log.error('Error adding track', error);
      toast.error('Ошибка добавления трека');
    },
  });

  const updateTrack = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProjectTrack> }) => {
      const { data, error } = await supabase
        .from('project_tracks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, updates };
    },
    onSuccess: ({ updates }) => {
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      // Show specific toast based on what was updated
      if (updates.lyrics !== undefined) {
        const statusLabel = updates.lyrics_status === 'generated' ? 'AI лирика' : 
                           updates.lyrics_status === 'approved' ? 'Лирика одобрена' : 'Лирика сохранена';
        toast.success(statusLabel);
      } else if (updates.notes !== undefined) {
        toast.success('Заметки сохранены');
      } else {
        toast.success('Трек обновлен');
      }
    },
    onError: (error: any) => {
      log.error('Error updating track', error);
      toast.error('Ошибка обновления трека');
    },
  });

  const deleteTrack = useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase
        .from('project_tracks')
        .delete()
        .eq('id', trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      toast.success('Трек удален');
    },
    onError: (error: any) => {
      log.error('Error deleting track', error);
      toast.error('Ошибка удаления трека');
    },
  });

  const reorderTracks = useMutation({
    mutationFn: async (reorderedTracks: { id: string; position: number }[]) => {
      const updates = reorderedTracks.map(({ id, position }) =>
        supabase
          .from('project_tracks')
          .update({ position })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      toast.success('Порядок треков обновлен');
    },
    onError: (error: any) => {
      log.error('Error reordering tracks', error);
      toast.error('Ошибка изменения порядка');
    },
  });

  const generateTracklist = useMutation({
    mutationFn: async (params: {
      projectType: string;
      genre?: string;
      mood?: string;
      theme?: string;
      trackCount?: number;
    }) => {
      if (!projectId) throw new Error('Project ID required');

      const { data, error } = await supabase.functions.invoke('project-ai', {
        body: {
          action: 'tracklist',
          projectId,
          projectType: params.projectType,
          genre: params.genre,
          mood: params.mood,
          theme: params.theme,
          trackCount: params.trackCount,
        },
      });

      if (error) throw error;
      
      // Tracks are now inserted by the edge function using service role
      return data;
    },
    onMutate: () => {
      // Show loading toast
      toast.loading('Генерация трек-листа...', { id: 'tracklist-gen' });
    },
    onSuccess: (data) => {
      toast.dismiss('tracklist-gen');
      // Force immediate refetch
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      const count = data?.data?.insertedCount || data?.data?.tracks?.length || 0;
      toast.success(`Трек-лист создан: ${count} треков`);
    },
    onError: (error: any) => {
      toast.dismiss('tracklist-gen');
      log.error('Error generating tracklist', error);
      toast.error('Ошибка генерации трек-листа');
    },
  });

  return {
    tracks,
    isLoading,
    error,
    addTrack: addTrack.mutate,
    updateTrack: updateTrack.mutate,
    deleteTrack: deleteTrack.mutate,
    reorderTracks: reorderTracks.mutate,
    generateTracklist: generateTracklist.mutate,
    isAdding: addTrack.isPending,
    isUpdating: updateTrack.isPending,
    isDeleting: deleteTrack.isPending,
    isReordering: reorderTracks.isPending,
    isGenerating: generateTracklist.isPending,
  };
};
