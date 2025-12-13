import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'ProjectGenerationTracking' });

interface ActiveGeneration {
  taskId: string;
  projectTrackId: string;
  status: 'pending' | 'processing' | 'streaming_ready' | 'completed' | 'failed';
  progress: number;
  stage: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: { progress: 15, stage: 'В очереди...' },
  processing: { progress: 50, stage: 'Генерация...' },
  streaming_ready: { progress: 80, stage: 'Обработка...' },
  completed: { progress: 100, stage: 'Готово!' },
  failed: { progress: 0, stage: 'Ошибка' },
};

/**
 * Hook to track active generations for project tracks
 * Automatically updates when generation completes
 */
export function useProjectGenerationTracking(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeGenerations, setActiveGenerations] = useState<Map<string, ActiveGeneration>>(new Map());

  // Fetch active generations on mount
  useEffect(() => {
    if (!projectId || !user?.id) return;

    const fetchActive = async () => {
      // Get all project track IDs
      const { data: projectTracks } = await supabase
        .from('project_tracks')
        .select('id, title')
        .eq('project_id', projectId);

      if (!projectTracks?.length) return;

      // Look for active generation tasks with matching prompt/context
      // We store project_track_id in generation_tasks metadata or use title matching
      const { data: tasks } = await supabase
        .from('generation_tasks')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing', 'streaming_ready'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (tasks) {
        const newGenerations = new Map<string, ActiveGeneration>();
        
        tasks.forEach(task => {
          // Check metadata for project_track_id
          const metadata = task.audio_clips as any;
          const projectTrackId = metadata?.project_track_id;
          
          if (projectTrackId && projectTracks.some(pt => pt.id === projectTrackId)) {
            const config = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            newGenerations.set(projectTrackId, {
              taskId: task.id,
              projectTrackId,
              status: task.status as any,
              progress: config.progress,
              stage: config.stage,
              createdAt: task.created_at,
            });
          }
        });

        setActiveGenerations(newGenerations);
      }
    };

    fetchActive();
  }, [projectId, user?.id]);

  // Subscribe to generation task updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`project-generations-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'generation_tasks',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const task = payload.new as any;
        const metadata = task.audio_clips as any;
        const projectTrackId = metadata?.project_track_id;

        if (!projectTrackId) return;

        log.debug('Generation task update for project', { 
          taskId: task.id, 
          status: task.status,
          projectTrackId 
        });

        if (task.status === 'completed') {
          setActiveGenerations(prev => {
            const next = new Map(prev);
            next.delete(projectTrackId);
            return next;
          });

          // Refresh project tracks to get linked track
          queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
          
          toast.success('Трек сгенерирован!', {
            description: 'Результат добавлен в трек-лист',
          });
        } else if (task.status === 'failed') {
          setActiveGenerations(prev => {
            const next = new Map(prev);
            next.delete(projectTrackId);
            return next;
          });

          toast.error('Ошибка генерации', {
            description: task.error_message,
          });
        } else {
          const config = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
          
          setActiveGenerations(prev => {
            const next = new Map(prev);
            next.set(projectTrackId, {
              taskId: task.id,
              projectTrackId,
              status: task.status,
              progress: config.progress,
              stage: config.stage,
              createdAt: task.created_at,
            });
            return next;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, projectId, queryClient]);

  // Also subscribe to tracks table for when track_id is set on project_tracks
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-tracks-linked-${projectId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'project_tracks',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        const newTrack = payload.new as any;
        const oldTrack = payload.old as any;

        // If track_id was just set (linked)
        if (newTrack.track_id && !oldTrack.track_id) {
          log.debug('Project track linked to generated track', {
            projectTrackId: newTrack.id,
            trackId: newTrack.track_id,
          });
          
          // Remove from active generations
          setActiveGenerations(prev => {
            const next = new Map(prev);
            next.delete(newTrack.id);
            return next;
          });

          // Refresh to show linked track
          queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const startTracking = useCallback((projectTrackId: string, taskId: string) => {
    const config = STATUS_CONFIG.pending;
    setActiveGenerations(prev => {
      const next = new Map(prev);
      next.set(projectTrackId, {
        taskId,
        projectTrackId,
        status: 'pending',
        progress: config.progress,
        stage: config.stage,
        createdAt: new Date().toISOString(),
      });
      return next;
    });
  }, []);

  const getGenerationForTrack = useCallback((projectTrackId: string) => {
    return activeGenerations.get(projectTrackId);
  }, [activeGenerations]);

  const isGenerating = useCallback((projectTrackId: string) => {
    return activeGenerations.has(projectTrackId);
  }, [activeGenerations]);

  return {
    activeGenerations,
    startTracking,
    getGenerationForTrack,
    isGenerating,
    hasActiveGenerations: activeGenerations.size > 0,
  };
}
