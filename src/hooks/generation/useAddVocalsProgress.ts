/**
 * useAddVocalsProgress - Track add vocals task status with realtime updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';

export type AddVocalsStatus = 
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'processing'
  | 'streaming_ready'
  | 'completed'
  | 'error';

export interface AddVocalsProgressState {
  status: AddVocalsStatus;
  taskId: string | null;
  trackId: string | null;
  error: string | null;
  progress: number; // 0-100
  message: string;
  completedTrack: {
    id: string;
    title: string;
    audio_url: string;
    cover_url?: string | null;
  } | null;
}

const STATUS_MESSAGES: Record<AddVocalsStatus, string> = {
  idle: '',
  submitting: 'Отправляем запрос...',
  pending: 'В очереди на обработку...',
  processing: 'AI добавляет вокал...',
  streaming_ready: 'Почти готово...',
  completed: 'Вокал добавлен!',
  error: 'Ошибка при добавлении вокала',
};

const STATUS_PROGRESS: Record<AddVocalsStatus, number> = {
  idle: 0,
  submitting: 10,
  pending: 20,
  processing: 50,
  streaming_ready: 80,
  completed: 100,
  error: 0,
};

export function useAddVocalsProgress() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AddVocalsProgressState>({
    status: 'idle',
    taskId: null,
    trackId: null,
    error: null,
    progress: 0,
    message: '',
    completedTrack: null,
  });

  // Start tracking a task
  const startTracking = useCallback((taskId: string, trackId: string) => {
    logger.info('Start tracking add vocals', { taskId, trackId });
    setState({
      status: 'pending',
      taskId,
      trackId,
      error: null,
      progress: STATUS_PROGRESS.pending,
      message: STATUS_MESSAGES.pending,
      completedTrack: null,
    });
  }, []);

  // Set submitting state (before API call)
  const setSubmitting = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'submitting',
      progress: STATUS_PROGRESS.submitting,
      message: STATUS_MESSAGES.submitting,
      error: null,
    }));
  }, []);

  // Set error state
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error,
      progress: 0,
      message: STATUS_MESSAGES.error,
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      taskId: null,
      trackId: null,
      error: null,
      progress: 0,
      message: '',
      completedTrack: null,
    });
  }, []);

  // Subscribe to task updates
  useEffect(() => {
    if (!state.taskId || state.status === 'completed' || state.status === 'error') {
      return;
    }

    const channel = supabase
      .channel(`add-vocals-task-${state.taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_tasks',
          filter: `id=eq.${state.taskId}`,
        },
        async (payload) => {
          const task = payload.new as { 
            status: string; 
            error_message?: string;
            track_id?: string;
          };
          
          logger.debug('Add vocals task update', { taskId: state.taskId, status: task.status });

          if (task.status === 'failed' || task.status === 'error') {
            setState(prev => ({
              ...prev,
              status: 'error',
              error: task.error_message || 'Ошибка генерации',
              progress: 0,
              message: task.error_message || STATUS_MESSAGES.error,
            }));
            return;
          }

          if (task.status === 'completed') {
            // Fetch the completed track
            if (state.trackId) {
              const { data: track } = await supabase
                .from('tracks')
                .select('id, title, audio_url, cover_url')
                .eq('id', state.trackId)
                .single();

              if (track) {
                setState(prev => ({
                  ...prev,
                  status: 'completed',
                  progress: 100,
                  message: STATUS_MESSAGES.completed,
                  completedTrack: {
                    id: track.id,
                    title: track.title || 'Новый трек',
                    audio_url: track.audio_url || '',
                    cover_url: track.cover_url,
                  },
                }));

                // Invalidate library queries to refresh
                queryClient.invalidateQueries({ queryKey: ['user-tracks'] });
                queryClient.invalidateQueries({ queryKey: ['library'] });
              }
            }
            return;
          }

          // Map status to our state
          const newStatus = task.status as AddVocalsStatus;
          if (STATUS_MESSAGES[newStatus]) {
            setState(prev => ({
              ...prev,
              status: newStatus,
              progress: STATUS_PROGRESS[newStatus] || prev.progress,
              message: STATUS_MESSAGES[newStatus],
            }));
          }
        }
      )
      .subscribe();

    // Also poll for status in case realtime misses updates
    const pollInterval = setInterval(async () => {
      if (!state.taskId) return;

      const { data: task } = await supabase
        .from('generation_tasks')
        .select('status, error_message')
        .eq('id', state.taskId)
        .single();

      if (!task) return;

      if (task.status === 'completed' && state.status !== 'completed') {
        // Fetch completed track
        if (state.trackId) {
          const { data: track } = await supabase
            .from('tracks')
            .select('id, title, audio_url, cover_url')
            .eq('id', state.trackId)
            .single();

          if (track) {
            setState(prev => ({
              ...prev,
              status: 'completed',
              progress: 100,
              message: STATUS_MESSAGES.completed,
              completedTrack: {
                id: track.id,
                title: track.title || 'Новый трек',
                audio_url: track.audio_url || '',
                cover_url: track.cover_url,
              },
            }));

            queryClient.invalidateQueries({ queryKey: ['user-tracks'] });
            queryClient.invalidateQueries({ queryKey: ['library'] });
          }
        }
      } else if (task.status === 'failed' || task.status === 'error') {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: task.error_message || 'Ошибка генерации',
          progress: 0,
          message: task.error_message || STATUS_MESSAGES.error,
        }));
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [state.taskId, state.trackId, state.status, queryClient]);

  return {
    ...state,
    setSubmitting,
    startTracking,
    setError,
    reset,
    isActive: state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error',
    isCompleted: state.status === 'completed',
    isError: state.status === 'error',
  };
}
