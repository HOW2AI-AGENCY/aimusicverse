/**
 * useProgressTracking - Base hook for tracking audio processing task progress
 * Provides realtime subscription + polling fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import type { 
  AudioProcessingOperation, 
  ProcessingStatus, 
  ExtendedProcessingState,
  ProgressTrackingReturn,
  CompletedTrack 
} from './types';
import { 
  STATUS_MESSAGES, 
  STATUS_PROGRESS, 
  DEFAULT_TITLES,
  INVALIDATE_QUERY_KEYS 
} from './constants';

const log = logger.child({ module: 'ProgressTracking' });

const POLL_INTERVAL_MS = 5000;

/**
 * Create initial state for an operation
 */
function createInitialState(operation: AudioProcessingOperation): ExtendedProcessingState {
  return {
    operation,
    status: 'idle',
    taskId: null,
    trackId: null,
    error: null,
    progress: 0,
    message: '',
    completedTrack: null,
    studioProjectId: null,
    sourceTrackId: null,
  };
}

/**
 * Hook for tracking progress of a single audio processing operation
 */
export function useProgressTracking(operation: AudioProcessingOperation): ProgressTrackingReturn {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ExtendedProcessingState>(() => createInitialState(operation));
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const messages = STATUS_MESSAGES[operation];
  const defaultTitle = DEFAULT_TITLES[operation];
  const queryKeys = INVALIDATE_QUERY_KEYS[operation];

  /**
   * Invalidate relevant queries when operation completes
   */
  const invalidateQueries = useCallback(() => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  }, [queryClient, queryKeys]);

  /**
   * Fetch completed track data
   */
  const fetchCompletedTrack = useCallback(async (trackId: string): Promise<CompletedTrack | null> => {
    const { data: track } = await supabase
      .from('tracks')
      .select('id, title, audio_url, cover_url, duration_seconds')
      .eq('id', trackId)
      .maybeSingle();

    if (!track) return null;

    return {
      id: track.id,
      title: track.title || defaultTitle,
      audio_url: track.audio_url || '',
      cover_url: track.cover_url,
      duration_seconds: track.duration_seconds || undefined,
    };
  }, [defaultTitle]);

  /**
   * Handle task status update
   */
  const handleTaskUpdate = useCallback(async (
    taskStatus: string,
    errorMessage?: string,
    taskTrackId?: string
  ) => {
    log.debug(`${operation} task update`, { status: taskStatus });

    // Handle error states
    if (taskStatus === 'failed' || taskStatus === 'error') {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage || 'Ошибка генерации',
        progress: 0,
        message: errorMessage || messages.error,
      }));
      return;
    }

    // Handle completion
    if (taskStatus === 'completed') {
      const trackIdToFetch = taskTrackId || state.trackId;
      if (trackIdToFetch) {
        const completedTrack = await fetchCompletedTrack(trackIdToFetch);
        if (completedTrack) {
          setState(prev => ({
            ...prev,
            status: 'completed',
            progress: 100,
            message: messages.completed,
            completedTrack,
          }));
          invalidateQueries();
        }
      }
      return;
    }

    // Handle intermediate states
    const newStatus = taskStatus as ProcessingStatus;
    if (messages[newStatus]) {
      setState(prev => ({
        ...prev,
        status: newStatus,
        progress: STATUS_PROGRESS[newStatus] || prev.progress,
        message: messages[newStatus],
      }));
    }
  }, [operation, state.trackId, messages, fetchCompletedTrack, invalidateQueries]);

  /**
   * Set submitting state (before API call)
   */
  const setSubmitting = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'submitting',
      progress: STATUS_PROGRESS.submitting,
      message: messages.submitting,
      error: null,
    }));
  }, [messages]);

  /**
   * Start tracking a task
   */
  const startTracking = useCallback((
    taskId: string, 
    trackId: string, 
    extra?: { studioProjectId?: string }
  ) => {
    log.info(`Start tracking ${operation}`, { taskId, trackId, ...extra });
    setState({
      operation,
      status: 'pending',
      taskId,
      trackId,
      error: null,
      progress: STATUS_PROGRESS.pending,
      message: messages.pending,
      completedTrack: null,
      studioProjectId: extra?.studioProjectId || null,
      sourceTrackId: null,
    });
  }, [operation, messages]);

  /**
   * Set error state
   */
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      error,
      progress: 0,
      message: messages.error,
    }));
  }, [messages]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState(createInitialState(operation));
  }, [operation]);

  /**
   * Setup realtime subscription and polling
   */
  useEffect(() => {
    if (!state.taskId || state.status === 'completed' || state.status === 'error') {
      return;
    }

    // Setup realtime subscription
    channelRef.current = supabase
      .channel(`audio-processing-${operation}-${state.taskId}`)
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
          await handleTaskUpdate(task.status, task.error_message, task.track_id);
        }
      )
      .subscribe();

    // Setup polling fallback
    pollIntervalRef.current = setInterval(async () => {
      if (!state.taskId) return;

      const { data: task } = await supabase
        .from('generation_tasks')
        .select('status, error_message, track_id')
        .eq('id', state.taskId)
        .maybeSingle();

      if (!task) return;

      // Only update if status changed
      if (task.status !== state.status) {
        await handleTaskUpdate(task.status, task.error_message || undefined, task.track_id || undefined);
      }
    }, POLL_INTERVAL_MS);

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [state.taskId, state.status, operation, handleTaskUpdate]);

  return {
    state,
    setSubmitting,
    startTracking,
    setError,
    reset,
    isActive: state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error',
    isCompleted: state.status === 'completed',
    isError: state.status === 'error',
  };
}
