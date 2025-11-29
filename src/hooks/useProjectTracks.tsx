import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ProjectTrack {
  id: string;
  project_id: string;
  track_id: string | null;
  position: number;
  title: string;
  style_prompt: string | null;
  notes: string | null;
  recommended_tags: string[] | null;
  recommended_structure: string | null;
  duration_target: number | null;
  collab_artist_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useProjectTracks = (projectId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ['project-tracks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_tracks')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as ProjectTrack[];
    },
    enabled: !!projectId && !!user?.id,
  });

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
      console.error('Error adding track:', error);
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      toast.success('Трек обновлен');
    },
    onError: (error: any) => {
      console.error('Error updating track:', error);
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
      console.error('Error deleting track:', error);
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
      console.error('Error reordering tracks:', error);
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
          ...params,
        },
      });

      if (error) throw error;

      // Insert generated tracks into database
      const generatedTracks = data?.data?.tracks || [];
      if (generatedTracks.length > 0) {
        const tracksToInsert = generatedTracks.map((track: any) => ({
          project_id: projectId,
          position: track.position,
          title: track.title,
          style_prompt: track.styleTags?.join(', ') || null,
          notes: track.description || null,
          recommended_tags: track.styleTags || null,
          recommended_structure: track.structure || null,
          duration_target: track.bpm ? Math.round((60 / track.bpm) * 240) : 120,
          status: 'draft',
        }));

        const { error: insertError } = await supabase
          .from('project_tracks')
          .insert(tracksToInsert);

        if (insertError) throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      toast.success('Трек-лист создан с помощью AI');
    },
    onError: (error: any) => {
      console.error('Error generating tracklist:', error);
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
