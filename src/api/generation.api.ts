/**
 * Generation API Layer
 * Raw Supabase operations for generation tasks
 */

import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Types
// ==========================================

export interface GenerationLog {
  id: string;
  user_id: string;
  prompt: string;
  status: string;
  model_used: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
  track_id: string | null;
  suno_task_id: string | null;
  expected_clips: number | null;
  received_clips: number | null;
  // Joined from profiles
  username?: string;
  photo_url?: string;
}

export interface GenerationStats {
  total_generations: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  success_rate: number;
  avg_duration_seconds: number;
}

export interface GenerationLogsFilter {
  limit?: number;
  status?: string;
  userId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

// ==========================================
// Helpers
// ==========================================

function getTimeFilter(timeRange: string): string {
  const now = new Date();
  switch (timeRange) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

function getInterval(timeRange: string): string {
  switch (timeRange) {
    case '1h': return '1 hour';
    case '24h': return '24 hours';
    case '7d': return '7 days';
    case '30d': return '30 days';
    default: return '24 hours';
  }
}

// ==========================================
// Generation Logs
// ==========================================

/**
 * Fetch generation task logs
 */
export async function fetchGenerationLogs(
  filters: GenerationLogsFilter = {}
): Promise<GenerationLog[]> {
  const { limit = 50, status, userId, timeRange = '24h' } = filters;

  let query = supabase
    .from('generation_tasks')
    .select('*')
    .gte('created_at', getTimeFilter(timeRange))
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as GenerationLog[];
}

/**
 * Get generation statistics
 */
export async function fetchGenerationStats(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<GenerationStats | null> {
  const { data, error } = await supabase.rpc('get_generation_stats', {
    _time_period: getInterval(timeRange),
  });
  if (error) throw new Error(error.message);
  return data?.[0] as GenerationStats | null;
}

/**
 * Subscribe to generation logs realtime updates
 */
export function subscribeToGenerationLogs(
  callback: (payload: { eventType: string; new: GenerationLog }) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel('generation-logs-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'generation_tasks',
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as GenerationLog,
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Retry a failed generation task
 */
export async function retryGenerationTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('generation_tasks')
    .update({ 
      status: 'pending',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
}
