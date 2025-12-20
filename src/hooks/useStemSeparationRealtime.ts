/**
 * useStemSeparationRealtime - Realtime subscription for stem separation progress
 * Listens to stem_separation_tasks and track_stems for live updates
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface SeparationProgress {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  mode: 'simple' | 'detailed';
  completedAt?: string;
  expectedStems: number;
  receivedStems: number;
}

export function useStemSeparationRealtime(trackId: string | null) {
  const queryClient = useQueryClient();
  const { success, error: hapticError } = useHapticFeedback();
  const [activeTask, setActiveTask] = useState<SeparationProgress | null>(null);

  // Clear task on completion
  const clearTask = useCallback(() => {
    setActiveTask(null);
  }, []);

  useEffect(() => {
    if (!trackId) return;

    // Fetch any active separation task on mount
    const fetchActiveTask = async () => {
      const { data } = await supabase
        .from('stem_separation_tasks')
        .select('*')
        .eq('track_id', trackId)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const expectedStems = data.mode === 'detailed' ? 6 : 2;
        
        // Count current stems
        const { count } = await supabase
          .from('track_stems')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', trackId);

        setActiveTask({
          taskId: data.id,
          status: 'processing',
          mode: data.mode as 'simple' | 'detailed',
          expectedStems,
          receivedStems: count || 0,
        });
      }
    };

    fetchActiveTask();

    // Subscribe to stem_separation_tasks updates
    const taskChannel = supabase
      .channel(`stem-separation-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stem_separation_tasks',
          filter: `track_id=eq.${trackId}`,
        },
        async (payload) => {
          const task = payload.new as any;
          
          logger.debug('Stem separation task update', { 
            taskId: task?.id, 
            status: task?.status,
            event: payload.eventType 
          });

          if (payload.eventType === 'INSERT') {
            const expectedStems = task.mode === 'detailed' ? 6 : 2;
            setActiveTask({
              taskId: task.id,
              status: 'processing',
              mode: task.mode,
              expectedStems,
              receivedStems: 0,
            });
          } else if (payload.eventType === 'UPDATE') {
            if (task.status === 'completed') {
              success();
              toast.success('Стемы готовы!', {
                description: task.mode === 'detailed' 
                  ? 'Аудио разделено на 6+ дорожек'
                  : 'Аудио разделено на вокал и инструментал',
              });
              
              // Invalidate queries to refresh stems list
              queryClient.invalidateQueries({ queryKey: ['track-stems', trackId] });
              queryClient.invalidateQueries({ queryKey: ['tracks'] });
              
              setActiveTask(prev => prev ? { ...prev, status: 'completed' } : null);
              
              // Clear after delay
              setTimeout(clearTask, 3000);
            } else if (task.status === 'failed') {
              hapticError();
              toast.error('Ошибка разделения', {
                description: 'Не удалось разделить аудио на стемы',
              });
              
              setActiveTask(prev => prev ? { ...prev, status: 'failed' } : null);
              setTimeout(clearTask, 3000);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to track_stems insertions for progress updates
    const stemsChannel = supabase
      .channel(`track-stems-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'track_stems',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          logger.debug('New stem inserted', { stemId: payload.new.id });
          
          // Increment received stems count
          setActiveTask(prev => {
            if (!prev) return null;
            return {
              ...prev,
              receivedStems: prev.receivedStems + 1,
            };
          });
          
          // Invalidate stems query to get new data
          queryClient.invalidateQueries({ queryKey: ['track-stems', trackId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(stemsChannel);
    };
  }, [trackId, queryClient, success, hapticError, clearTask]);

  // Calculate progress percentage
  const progress = activeTask 
    ? Math.min(100, Math.round((activeTask.receivedStems / activeTask.expectedStems) * 100))
    : 0;

  return {
    activeTask,
    progress,
    isProcessing: activeTask?.status === 'processing',
    isCompleted: activeTask?.status === 'completed',
    isFailed: activeTask?.status === 'failed',
    clearTask,
  };
}
