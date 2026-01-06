import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { notifyProjectChange } from '@/services/notificationManager';
import { useAuditLog } from './useAuditLog';
import { useEffect, useCallback } from 'react';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Use database type directly for consistency
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
  const { logProjectCreated, logAction } = useAuditLog();

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

  // Realtime subscription with debounced cache updates
  useEffect(() => {
    if (!user?.id) return;

    let debounceTimeout: NodeJS.Timeout | null = null;

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
        (payload) => {
          // Debounce to prevent rapid consecutive updates
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          debounceTimeout = setTimeout(() => {
            // Update cache directly for better UX instead of full refetch
            if (payload.eventType === 'INSERT' && payload.new) {
              queryClient.setQueryData(['projects', user.id], (old: Project[] | undefined) => {
                if (!old) return [payload.new as Project];
                // Prevent duplicates
                if (old.some(p => p.id === (payload.new as Project).id)) return old;
                return [payload.new as Project, ...old];
              });
            } else if (payload.eventType === 'DELETE' && payload.old) {
              queryClient.setQueryData(['projects', user.id], (old: Project[] | undefined) => {
                if (!old) return [];
                return old.filter(p => p.id !== (payload.old as Project).id);
              });
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              queryClient.setQueryData(['projects', user.id], (old: Project[] | undefined) => {
                if (!old) return [];
                return old.map(p => p.id === (payload.new as Project).id ? payload.new as Project : p);
              });
            }
          }, 100);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Check if user can create more projects
  const checkProjectLimit = useCallback(async (): Promise<{
    allowed: boolean;
    currentCount: number;
    limit: number | null;
    remaining?: number;
    reason?: string;
  }> => {
    if (!user?.id) {
      return { allowed: false, currentCount: 0, limit: 3, reason: 'Требуется авторизация' };
    }

    const { data, error } = await supabase.rpc('can_create_project', {
      _user_id: user.id
    });

    if (error) {
      logger.error('Error checking project limit', error);
      return { allowed: true, currentCount: 0, limit: null }; // Allow on error
    }

    // Cast to proper type since RPC returns Json
    const result = data as { 
      allowed?: boolean; 
      current_count?: number; 
      limit?: number; 
      remaining?: number; 
      reason?: string; 
    } | null;

    return {
      allowed: result?.allowed ?? true,
      currentCount: result?.current_count ?? 0,
      limit: result?.limit ?? null,
      remaining: result?.remaining,
      reason: result?.reason,
    };
  }, [user?.id]);

  const createProject = useMutation({
    mutationFn: async (projectData: Partial<Project> & { title: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      return retryWithBackoff(async () => {
        // Check project limit for free users
        const limitCheck = await checkProjectLimit();
        if (!limitCheck.allowed) {
          throw new Error(limitCheck.reason || 'Достигнут лимит проектов');
        }

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
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      toast.success('Проект создан успешно');
      // Send notification
      if (user?.id) {
        notifyProjectChange(user.id, data.title, 'created', data.id);
        // Log to audit
        logProjectCreated(data.id, data.title, {
          projectType: data.project_type,
          genre: data.genre,
          mood: data.mood,
        });
      }
    },
    onError: (error: any) => {
      logger.error('Error creating project', error);
      const errorMessage = error?.message?.includes('лимит') 
        ? error.message 
        : 'Ошибка создания проекта';
      toast.error(errorMessage);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      return retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('music_projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      toast.success('Проект обновлен');
      // Send notification
      if (user?.id) {
        notifyProjectChange(user.id, data.title, 'updated', data.id);
        // Log to audit
        logAction({
          entityType: 'project',
          entityId: data.id,
          actionType: 'updated',
          actorType: 'user',
          outputMetadata: { title: data.title },
        });
      }
    },
    onError: (error: any) => {
      logger.error('Error updating project', error);
      toast.error('Ошибка обновления проекта');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      return retryWithBackoff(async () => {
        // Get project title before deletion
        const { data: project } = await supabase
          .from('music_projects')
          .select('title')
          .eq('id', projectId)
          .single();
        
        const { error } = await supabase
          .from('music_projects')
          .delete()
          .eq('id', projectId);

        if (error) throw error;
        return { title: project?.title || 'Проект' };
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      toast.success('Проект удален');
      // Send notification
      if (user?.id) {
        notifyProjectChange(user.id, data.title, 'deleted');
      }
    },
    onError: (error: any) => {
      logger.error('Error deleting project', error);
      toast.error('Ошибка удаления проекта');
    },
  });

  const generateProjectConcept = useMutation({
    mutationFn: async (params: {
      projectType?: string;
      description?: string;
      genre?: string;
      mood?: string;
      targetAudience?: string;
      theme?: string;
      artistPersona?: string;
    }) => {
      return retryWithBackoff(async () => {
        const { data, error } = await supabase.functions.invoke('project-ai', {
          body: {
            action: 'concept',
            ...params,
          },
        });

        if (error) throw error;
        return data;
      });
    },
    onSuccess: () => {
      toast.success('Концепция проекта создана');
    },
    onError: (error: any) => {
      logger.error('Error generating concept', error);
      toast.error('Ошибка генерации концепции');
    },
  });

  return {
    projects,
    isLoading,
    error,
    // Expose mutate functions directly to allow options (onSuccess, onError)
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    deleteProject: deleteProject.mutate,
    generateProjectConcept: generateProjectConcept.mutate,
    // Async versions for await usage
    createProjectAsync: createProject.mutateAsync,
    updateProjectAsync: updateProject.mutateAsync,
    deleteProjectAsync: deleteProject.mutateAsync,
    generateProjectConceptAsync: generateProjectConcept.mutateAsync,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,
    isGenerating: generateProjectConcept.isPending,
    // Project limit check for UI
    checkProjectLimit,
  };
};
