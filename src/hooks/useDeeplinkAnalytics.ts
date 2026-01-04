import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '@/api/analytics.api';
import type { DeeplinkStats, DeeplinkEvent } from '@/api/analytics.api';

interface UseDeeplinkAnalyticsOptions {
  timeRange?: '1h' | '24h' | '7d' | '30d';
  limit?: number;
}

export function useDeeplinkAnalytics(options: UseDeeplinkAnalyticsOptions = {}) {
  const { timeRange = '7d', limit = 100 } = options;

  const getInterval = () => {
    switch (timeRange) {
      case '1h': return '1 hour';
      case '24h': return '24 hours';
      case '7d': return '7 days';
      case '30d': return '30 days';
      default: return '7 days';
    }
  };

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['deeplink-stats', timeRange],
    queryFn: () => analyticsApi.fetchDeeplinkStats(getInterval()),
    refetchInterval: 60000,
  });

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['deeplink-events', timeRange, limit],
    queryFn: () => analyticsApi.fetchDeeplinkEvents({ timeRange, limit }),
  });

  return {
    stats,
    events: events || [],
    isLoading: statsLoading || eventsLoading,
    refetchStats,
    refetchEvents,
  };
}

// Separate hooks for individual use
export function useDeeplinkStats(timeRange: '1h' | '24h' | '7d' | '30d' = '7d') {
  const getInterval = () => {
    switch (timeRange) {
      case '1h': return '1 hour';
      case '24h': return '24 hours';
      case '7d': return '7 days';
      case '30d': return '30 days';
      default: return '7 days';
    }
  };

  return useQuery({
    queryKey: ['deeplink-stats', timeRange],
    queryFn: () => analyticsApi.fetchDeeplinkStats(getInterval()),
    refetchInterval: 60000,
  });
}

export function useDeeplinkEvents(options: { limit?: number } = {}) {
  const { limit = 50 } = options;
  
  return useQuery({
    queryKey: ['deeplink-events', limit],
    queryFn: () => analyticsApi.fetchDeeplinkEvents({ limit }),
  });
}

export type { DeeplinkStats, DeeplinkEvent };

// Hook to track deeplink visits
export function useTrackDeeplink() {
  const trackDeeplink = async (params: {
    deeplinkType: string;
    deeplinkValue?: string;
    source?: string;
    campaign?: string;
    referrer?: string;
    metadata?: Record<string, unknown>;
  }) => {
    const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
    sessionStorage.setItem('session_id', sessionId);

    try {
      await analyticsApi.trackDeeplinkVisit({
        ...params,
        sessionId,
        referrer: params.referrer || document.referrer || undefined,
      });
    } catch (error) {
      console.error('Failed to track deeplink:', error);
    }
  };

  const markConversion = async (sessionId: string, conversionType: string) => {
    try {
      await analyticsApi.markDeeplinkConversion(sessionId, conversionType);
    } catch (error) {
      console.error('Failed to mark conversion:', error);
    }
  };

  return { trackDeeplink, markConversion };
}
