import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Project = Tables<'music_projects'>;

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  attempts = RETRY_ATTEMPTS
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (attempts <= 1) throw error;
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (RETRY_ATTEMPTS - attempts + 1)));
    return retryWithBackoff(fn, attempts - 1);
  }
};

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      return retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('music_projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      });
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`projects-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'music_projects',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const createProject = useMutation({
    mutationFn: async (project: TablesInsert<'music_projects'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      return retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('music_projects')
          .insert({ ...project, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Проект создан');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка создания проекта');
    },
  });

  const updateProject = useMutation({
    mutationFn: async (updates: TablesUpdate<'music_projects'> & { id: string }) => {
      const { id, ...rest } = updates;
      return retryWithBackoff(async () => {
        const { error } = await supabase
          .from('music_projects')
          .update(rest)
          .eq('id', id);

        if (error) throw error;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Проект обновлен');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка обновления проекта');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      return retryWithBackoff(async () => {
        const { error } = await supabase
          .from('music_projects')
          .delete()
          .eq('id', id);

        if (error) throw error;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Проект удален');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка удаления проекта');
    },
  });

  const generateProjectConcept = useMutation({
    mutationFn: async (params: {
      description: string;
      genre?: string;
      mood?: string;
      targetAudience?: string;
    }) => {
      return retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('project-ai', {
          body: {
            action: 'generate_concept',
            ...params,
          },
        });

        if (error) throw error;
        return data;
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка генерации концепции');
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: useCallback((project: TablesInsert<'music_projects'>) => 
      createProject.mutate(project), [createProject]
    ),
    isCreating: createProject.isPending,
    updateProject: useCallback((project: TablesUpdate<'music_projects'> & { id: string }) => 
      updateProject.mutate(project), [updateProject]
    ),
    isUpdating: updateProject.isPending,
    deleteProject: useCallback((id: string) => deleteProject.mutate(id), [deleteProject]),
    isDeleting: deleteProject.isPending,
    generateProjectConcept: useCallback((params: any) => 
      generateProjectConcept.mutate(params), [generateProjectConcept]
    ),
    isGenerating: generateProjectConcept.isPending,
  };
};
