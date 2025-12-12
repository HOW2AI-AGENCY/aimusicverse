import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

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

interface GenerationStats {
  total_generations: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  success_rate: number;
  avg_duration_seconds: number;
}

interface UseGenerationLogsOptions {
  limit?: number;
  status?: string;
  userId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export function useGenerationLogs(options: UseGenerationLogsOptions = {}) {
  const { limit = 50, status, userId, timeRange = '24h' } = options;
  const [realtimeLogs, setRealtimeLogs] = useState<GenerationLog[]>([]);

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['generation-logs', limit, status, userId, timeRange],
    queryFn: async () => {
      let query = supabase
        .from('generation_tasks')
        .select('*')
        .gte('created_at', getTimeFilter())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as GenerationLog[];
    },
  });

  // Realtime subscription
  useEffect(() => {
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
          if (payload.eventType === 'INSERT') {
            setRealtimeLogs((prev) => [payload.new as GenerationLog, ...prev].slice(0, limit));
          } else if (payload.eventType === 'UPDATE') {
            setRealtimeLogs((prev) =>
              prev.map((log) =>
                log.id === (payload.new as GenerationLog).id
                  ? (payload.new as GenerationLog)
                  : log
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  // Merge initial logs with realtime updates
  const mergedLogs = [...realtimeLogs, ...(logs || [])].reduce((acc, log) => {
    if (!acc.find((l) => l.id === log.id)) {
      acc.push(log);
    } else {
      const index = acc.findIndex((l) => l.id === log.id);
      acc[index] = log;
    }
    return acc;
  }, [] as GenerationLog[]).slice(0, limit);

  return {
    logs: mergedLogs,
    isLoading,
    refetch,
  };
}

export function useGenerationStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
  const getInterval = () => {
    switch (timeRange) {
      case '1h': return '1 hour';
      case '24h': return '24 hours';
      case '7d': return '7 days';
      case '30d': return '30 days';
      default: return '24 hours';
    }
  };

  return useQuery({
    queryKey: ['generation-stats', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_generation_stats', {
        _time_period: getInterval(),
      });
      if (error) throw error;
      return data?.[0] as GenerationStats | undefined;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
