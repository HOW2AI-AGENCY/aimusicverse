import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import * as generationApi from '@/api/generation.api';
import type { GenerationLog, GenerationStats } from '@/api/generation.api';

interface UseGenerationLogsOptions {
  limit?: number;
  status?: string;
  userId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

export function useGenerationLogs(options: UseGenerationLogsOptions = {}) {
  const { limit = 50, status, userId, timeRange = '24h' } = options;
  const [realtimeLogs, setRealtimeLogs] = useState<GenerationLog[]>([]);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['generation-logs', limit, status, userId, timeRange],
    queryFn: () => generationApi.fetchGenerationLogs({ limit, status, userId, timeRange }),
  });

  // Realtime subscription
  useEffect(() => {
    const { unsubscribe } = generationApi.subscribeToGenerationLogs((payload) => {
      if (payload.eventType === 'INSERT') {
        setRealtimeLogs((prev) => [payload.new, ...prev].slice(0, limit));
      } else if (payload.eventType === 'UPDATE') {
        setRealtimeLogs((prev) =>
          prev.map((log: GenerationLog) =>
            log.id === payload.new.id ? payload.new : log
          )
        );
      }
    });

    return () => unsubscribe();
  }, [limit]);

  // Merge initial logs with realtime updates
  const mergedLogs = [...realtimeLogs, ...(logs || [])].reduce((acc: GenerationLog[], log: GenerationLog) => {
    if (!acc.find((l: GenerationLog) => l.id === log.id)) {
      acc.push(log);
    } else {
      const index = acc.findIndex((l: GenerationLog) => l.id === log.id);
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
  return useQuery({
    queryKey: ['generation-stats', timeRange],
    queryFn: () => generationApi.fetchGenerationStats(timeRange),
    refetchInterval: 30000,
  });
}

export type { GenerationLog, GenerationStats };
