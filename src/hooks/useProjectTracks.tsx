import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
      if (!projectId) {
        console.log('⚠️ useProjectTracks: No projectId provided');
        return [];
      }

      console.log('🔍 Fetching project tracks for project:', projectId);

      const { data, error } = await supabase
        .from('project_tracks')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Error fetching project tracks:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} project tracks`);
      return data as ProjectTrack[];
    },
    enabled: !!projectId && !!user?.id,
    retry: 2,
    staleTime: 300000, // Consider data fresh for 5 minutes (project tracks don't change frequently)
  });

  // Realtime subscription for project tracks updates
  useEffect(() => {
    if (!projectId) return;

    console.log('🔄 Setting up realtime subscription for project tracks:', projectId);

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
          console.log('📊 Project tracks change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from project tracks realtime');
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
