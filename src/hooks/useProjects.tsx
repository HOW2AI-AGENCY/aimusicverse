import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  project_type: 'single' | 'ep' | 'album' | 'ost' | 'background_music' | 'jingle' | 'compilation' | 'mixtape';
  genre: string | null;
  mood: string | null;
  status: string | null;
  description: string | null;
  concept: string | null;
  release_date: string | null;
  target_audience: string | null;
  reference_artists: string[] | null;
  reference_tracks: string[] | null;
  bpm_range: any | null;
  key_signature: string | null;
  primary_artist_id: string | null;
  label_name: string | null;
  copyright_info: string | null;
  is_commercial: boolean | null;
  is_public: boolean | null;
  language: string | null;
  ai_context: any | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('music_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });

  const createProject = useMutation({
    mutationFn: async (projectData: Partial<Project> & { title: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if user is premium or admin to set default is_public
      const { data: isPremium } = await supabase.rpc('is_premium_or_admin', {
        _user_id: user.id
      });

      const { data, error } = await supabase
        .from('music_projects')
        .insert([{
          user_id: user.id,
          is_public: isPremium ? false : true, // Free users create public by default
          ...projectData,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      toast.success('Проект создан успешно');
    },
    onError: (error: any) => {
      console.error('Error creating project:', error);
      toast.error('Ошибка создания проекта');
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { data, error } = await supabase
        .from('music_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      toast.success('Проект обновлен');
    },
    onError: (error: any) => {
      console.error('Error updating project:', error);
      toast.error('Ошибка обновления проекта');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('music_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      toast.success('Проект удален');
    },
    onError: (error: any) => {
      console.error('Error deleting project:', error);
      toast.error('Ошибка удаления проекта');
    },
  });

  const generateProjectConcept = useMutation({
    mutationFn: async (params: {
      projectType: string;
      genre?: string;
      mood?: string;
      targetAudience?: string;
      theme?: string;
      artistPersona?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('project-ai', {
        body: {
          action: 'concept',
          ...params,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Концепция проекта создана');
    },
    onError: (error: any) => {
      console.error('Error generating concept:', error);
      toast.error('Ошибка генерации концепции');
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    deleteProject: deleteProject.mutate,
    generateProjectConcept: generateProjectConcept.mutate,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,
    isGenerating: generateProjectConcept.isPending,
  };
};
