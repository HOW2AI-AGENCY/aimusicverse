import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeeplinkStats {
  total_clicks: number;
  unique_users: number;
  conversions: number;
  conversion_rate: number;
  top_sources: Array<{ source: string; count: number }>;
  top_types: Array<{ deeplink_type: string; count: number }>;
}

interface DeeplinkEvent {
  id: string;
  user_id: string | null;
  session_id: string | null;
  deeplink_type: string;
  deeplink_value: string | null;
  source: string | null;
  campaign: string | null;
  referrer: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  converted: boolean;
  conversion_type: string | null;
}

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

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['deeplink-stats', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_deeplink_stats', {
        _time_period: getInterval(),
      });
      if (error) throw error;
      return data?.[0] as DeeplinkStats | undefined;
    },
    refetchInterval: 60000,
  });

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['deeplink-events', timeRange, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deeplink_analytics')
        .select('*')
        .gte('created_at', getTimeFilter())
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as DeeplinkEvent[];
    },
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
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_deeplink_stats', {
        _time_period: getInterval(),
      });
      if (error) throw error;
      return data?.[0] as DeeplinkStats | undefined;
    },
    refetchInterval: 60000,
  });
}

export function useDeeplinkEvents(options: { limit?: number } = {}) {
  const { limit = 50 } = options;
  
  return useQuery({
    queryKey: ['deeplink-events', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deeplink_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as DeeplinkEvent[];
    },
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

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('deeplink_analytics').insert([{
      user_id: user?.id || null,
      session_id: sessionId,
      deeplink_type: params.deeplinkType,
      deeplink_value: params.deeplinkValue || null,
      source: params.source || null,
      campaign: params.campaign || null,
      referrer: params.referrer || document.referrer || null,
      metadata: (params.metadata || {}) as Record<string, string | number | boolean | null>,
    }]);

    if (error) {
      console.error('Failed to track deeplink:', error);
    }
  };

  const markConversion = async (sessionId: string, conversionType: string) => {
    const { error } = await supabase
      .from('deeplink_analytics')
      .update({
        converted: true,
        conversion_type: conversionType,
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to mark conversion:', error);
    }
  };

  return { trackDeeplink, markConversion };
}
