import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type EventType = 
  | 'page_view'
  | 'generation_started'
  | 'generation_completed'
  | 'track_played'
  | 'track_liked'
  | 'track_shared'
  | 'feature_used'
  | 'button_clicked'
  | 'session_started'
  | 'session_ended';

interface TrackEventParams {
  eventType: EventType;
  eventName?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
}

interface UserBehaviorStats {
  total_events: number;
  unique_sessions: number;
  unique_users: number;
  events_by_type: Record<string, number>;
  top_pages: Array<{ page_path: string; views: number }>;
  hourly_distribution: Record<string, number>;
}

// Session management
const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export function useAnalyticsTracking() {
  const location = useLocation();
  const sessionId = useRef(getOrCreateSessionId());
  const lastPagePath = useRef<string | null>(null);

  // Track event function
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('user_analytics_events').insert([{
        user_id: user?.id || null,
        session_id: sessionId.current,
        event_type: params.eventType,
        event_name: params.eventName || null,
        page_path: params.pagePath || location.pathname,
        metadata: (params.metadata || {}) as Record<string, string | number | boolean | null>,
      }]);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [location.pathname]);

  // Auto-track page views
  useEffect(() => {
    if (location.pathname !== lastPagePath.current) {
      lastPagePath.current = location.pathname;
      trackEvent({
        eventType: 'page_view',
        pagePath: location.pathname,
        metadata: {
          search: location.search,
          hash: location.hash,
        },
      });
    }
  }, [location, trackEvent]);

  // Track session start on mount
  useEffect(() => {
    trackEvent({
      eventType: 'session_started',
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      },
    });

    // Track session end on unmount
    return () => {
      // Use sendBeacon for reliable tracking on page unload
      const payload = JSON.stringify({
        session_id: sessionId.current,
        event_type: 'session_ended',
        page_path: location.pathname,
        created_at: new Date().toISOString(),
      });
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_analytics_events`,
        payload
      );
    };
  }, []);

  // Convenience methods
  const trackGeneration = useCallback((status: 'started' | 'completed', metadata?: Record<string, unknown>) => {
    trackEvent({
      eventType: status === 'started' ? 'generation_started' : 'generation_completed',
      metadata,
    });
  }, [trackEvent]);

  const trackPlay = useCallback((trackId: string, metadata?: Record<string, unknown>) => {
    trackEvent({
      eventType: 'track_played',
      metadata: { trackId, ...metadata },
    });
  }, [trackEvent]);

  const trackLike = useCallback((trackId: string, liked: boolean) => {
    trackEvent({
      eventType: 'track_liked',
      metadata: { trackId, liked },
    });
  }, [trackEvent]);

  const trackShare = useCallback((trackId: string, platform: string) => {
    trackEvent({
      eventType: 'track_shared',
      metadata: { trackId, platform },
    });
  }, [trackEvent]);

  const trackFeatureUsed = useCallback((featureName: string, metadata?: Record<string, unknown>) => {
    trackEvent({
      eventType: 'feature_used',
      eventName: featureName,
      metadata,
    });
  }, [trackEvent]);

  const trackButtonClick = useCallback((buttonName: string, metadata?: Record<string, unknown>) => {
    trackEvent({
      eventType: 'button_clicked',
      eventName: buttonName,
      metadata,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackGeneration,
    trackPlay,
    trackLike,
    trackShare,
    trackFeatureUsed,
    trackButtonClick,
  };
}

// Hook for admin to view user behavior stats
export function useUserBehaviorStats(timeRange: '1h' | '24h' | '7d' | '30d' = '7d') {
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
    queryKey: ['user-behavior-stats', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_behavior_stats', {
        _time_period: getInterval(),
      });
      if (error) throw error;
      return data?.[0] as UserBehaviorStats | undefined;
    },
    refetchInterval: 60000,
  });
}
