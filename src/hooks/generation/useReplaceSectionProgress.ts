/**
 * useReplaceSectionProgress - Track section replacement task status with realtime updates
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';

export type ReplaceSectionStatus = 
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'error';

export interface SectionVariant {
  label: string;
  audioUrl: string;
  duration?: number;
}

export interface ReplaceSectionProgressState {
  status: ReplaceSectionStatus;
  taskId: string | null;
  trackId: string | null;
  versionId: string | null;
  error: string | null;
  progress: number;
  message: string;
  section: { start: number; end: number } | null;
  variants: SectionVariant[];
}

const STATUS_MESSAGES: Record<ReplaceSectionStatus, string> = {
  idle: '',
  submitting: 'Отправляем запрос...',
  pending: 'В очереди на обработку...',
  processing: 'AI заменяет секцию...',
  completed: 'Секция заменена!',
  error: 'Ошибка при замене секции',
};

const STATUS_PROGRESS: Record<ReplaceSectionStatus, number> = {
  idle: 0,
  submitting: 10,
  pending: 25,
  processing: 60,
  completed: 100,
  error: 0,
};

export function useReplaceSectionProgress() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ReplaceSectionProgressState>({
    status: 'idle',
    taskId: null,
    trackId: null,
    versionId: null,
    error: null,
    progress: 0,
    message: '',
    section: null,
    variants: [],
  });

  // Start tracking a task
  const startTracking = useCallback((
    taskId: string, 
    trackId: string, 
    section: { start: number; end: number }
  ) => {
    logger.info('Start tracking section replacement', { taskId, trackId, section });
    setState({
      status: 'pending',
      taskId,
      trackId,
      versionId: null,
      error: null,
      progress: STATUS_PROGRESS.pending,
      message: STATUS_MESSAGES.pending,
      section,
      variants: [],
    });
  }, []);

  // Set submitting state
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
      versionId: null,
      error: null,
      progress: 0,
      message: '',
      section: null,
      variants: [],
    });
  }, []);

  // Select variant and apply
  const selectVariant = useCallback(async (variantIndex: number) => {
    if (!state.trackId || !state.variants[variantIndex]) return;

    const variant = state.variants[variantIndex];
    logger.info('Applying section variant', { trackId: state.trackId, variant: variant.label });

    // Here you would update the track version or merge the audio
    // This depends on your backend implementation
    
    queryClient.invalidateQueries({ queryKey: ['track', state.trackId] });
    queryClient.invalidateQueries({ queryKey: ['track-versions', state.trackId] });
  }, [state.trackId, state.variants, queryClient]);

  // Subscribe to task updates
  useEffect(() => {
    if (!state.taskId || state.status === 'completed' || state.status === 'error') {
      return;
    }

    const channel = supabase
      .channel(`replace-section-task-${state.taskId}`)
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
            audio_clips?: string | unknown[];
          };
          
          logger.debug('Replace section task update', { taskId: state.taskId, status: task.status });

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
            // Parse audio clips for A/B variants
            try {
              const clips = typeof task.audio_clips === 'string' 
                ? JSON.parse(task.audio_clips) 
                : task.audio_clips;
              
              if (Array.isArray(clips) && clips.length > 0) {
                const variants: SectionVariant[] = clips.map((clip: any, idx: number) => ({
                  label: String.fromCharCode(65 + idx), // A, B, C...
                  audioUrl: clip.audio_url || clip.audioUrl,
                  duration: clip.duration_seconds || clip.duration,
                }));

                setState(prev => ({
                  ...prev,
                  status: 'completed',
                  progress: 100,
                  message: STATUS_MESSAGES.completed,
                  variants,
                }));

                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: ['replaced-sections', state.trackId] });
                queryClient.invalidateQueries({ queryKey: ['track-versions', state.trackId] });
              }
            } catch (err) {
              logger.error('Failed to parse audio clips', err);
              setState(prev => ({
                ...prev,
                status: 'completed',
                progress: 100,
                message: 'Секция заменена (без вариантов)',
                variants: [],
              }));
            }
            return;
          }

          // Map status to our state
          if (task.status === 'processing') {
            setState(prev => ({
              ...prev,
              status: 'processing',
              progress: STATUS_PROGRESS.processing,
              message: STATUS_MESSAGES.processing,
            }));
          }
        }
      )
      .subscribe();

    // Poll for status
    const pollInterval = setInterval(async () => {
      if (!state.taskId) return;

      const { data: task } = await supabase
        .from('generation_tasks')
        .select('status, error_message, audio_clips')
        .eq('id', state.taskId)
        .single();

      if (!task) return;

      if (task.status === 'completed' && state.status !== 'completed') {
        try {
          const clips = typeof task.audio_clips === 'string' 
            ? JSON.parse(task.audio_clips) 
            : task.audio_clips;
          
          if (Array.isArray(clips) && clips.length > 0) {
            const variants: SectionVariant[] = clips.map((clip: any, idx: number) => ({
              label: String.fromCharCode(65 + idx),
              audioUrl: clip.audio_url || clip.audioUrl,
              duration: clip.duration_seconds || clip.duration,
            }));

            setState(prev => ({
              ...prev,
              status: 'completed',
              progress: 100,
              message: STATUS_MESSAGES.completed,
              variants,
            }));

            queryClient.invalidateQueries({ queryKey: ['replaced-sections', state.trackId] });
          }
        } catch (err) {
          logger.error('Failed to parse audio clips on poll', err);
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
    selectVariant,
    isActive: state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error',
    isCompleted: state.status === 'completed',
    isError: state.status === 'error',
    hasVariants: state.variants.length > 0,
  };
}
