import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from '@/api/analytics.api';
import * as analyticsService from '@/services/analytics.service';
import type { EventType, UserBehaviorStats } from '@/api/analytics.api';

interface TrackEventParams {
  eventType: EventType;
  eventName?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
}

export function useAnalyticsTracking() {
  const location = useLocation();
  const sessionId = useRef(analyticsService.getOrCreateSessionId());
  const lastPagePath = useRef<string | null>(null);
  const userId = useRef<string | undefined>(undefined);

  // Track event function
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    try {
      await analyticsApi.trackAnalyticsEvent({
        eventType: params.eventType,
        eventName: params.eventName,
        pagePath: params.pagePath || location.pathname,
        metadata: params.metadata,
        sessionId: sessionId.current,
        userId: userId.current,
      });
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

    // Track user return frequency
    const { isReturning, daysSinceLastVisit } = analyticsService.trackUserReturn();
    
    if (isReturning) {
      setTimeout(() => {
        trackEvent({
          eventType: 'session_started',
          eventName: 'user_returned',
          metadata: {
            daysSinceLastVisit,
            isReturningUser: true,
          },
        });
      }, 100);
    }

    // Track session end on unmount
    return () => {
      const currentPath = window.location.pathname;
      const payload = JSON.stringify({
        session_id: sessionId.current,
        event_type: 'session_ended',
        page_path: currentPath,
        created_at: new Date().toISOString(),
      });
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_analytics_events`,
        payload
      );
    };
  }, [trackEvent]);

  // Convenience methods
  const trackGeneration = useCallback((status: 'started' | 'completed', metadata?: Record<string, unknown>) => {
    const eventMetadata = { ...metadata };
    
    if (status === 'completed') {
      const isFirst = analyticsService.trackFirstGeneration();
      if (isFirst) {
        eventMetadata.isFirstGeneration = true;
      }
    }
    
    trackEvent({
      eventType: status === 'started' ? 'generation_started' : 'generation_completed',
      metadata: eventMetadata,
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
    queryFn: () => analyticsApi.fetchUserBehaviorStats(getInterval()),
    refetchInterval: 60000,
  });
}

export type { UserBehaviorStats };
