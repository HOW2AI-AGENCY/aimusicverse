/**
 * Analytics Tracking Hook
 * 
 * Unified hook for tracking user behavior and analytics events.
 * Uses modular analytics services for better maintainability.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Import from modular services
import {
  getOrCreateSessionId,
  trackEvent as trackAnalyticsEvent,
  trackPageView,
  trackGeneration as trackGenerationEvent,
  trackFeatureUsed as trackFeatureUsedEvent,
  trackButtonClick as trackButtonClickEvent,
  trackTrackPlayed,
  trackTrackShared,
  trackUserReturn,
  trackFirstGeneration,
  fetchUserBehaviorStats,
} from '@/services/analytics';

import type { UserBehaviorStats } from '@/services/analytics';

interface TrackEventParams {
  eventType: 'page_view' | 'generation_started' | 'generation_completed' | 
             'track_played' | 'track_liked' | 'track_shared' | 
             'feature_used' | 'button_clicked' | 'session_started' | 'session_ended';
  eventName?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Main analytics tracking hook
 * Auto-tracks page views and provides convenience methods for event tracking
 */
export function useAnalyticsTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const sessionId = useRef(getOrCreateSessionId());
  const lastPagePath = useRef<string | null>(null);
  const hasTrackedSession = useRef(false);

  // Track event function - unified wrapper
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    try {
      await trackAnalyticsEvent({
        eventType: params.eventType,
        eventName: params.eventName,
        pagePath: params.pagePath || location.pathname,
        metadata: params.metadata,
      }, user?.id);
    } catch (error) {
      // Silent fail - analytics should never break the app
      if (import.meta.env.DEV) {
        console.warn('[Analytics] Tracking error:', error);
      }
    }
  }, [location.pathname, user?.id]);

  // Auto-track page views
  useEffect(() => {
    if (location.pathname !== lastPagePath.current) {
      lastPagePath.current = location.pathname;
      trackPageView(location.pathname, {
        search: location.search,
        hash: location.hash,
        referrer: document.referrer,
      }, user?.id).catch(() => {});
    }
  }, [location, user?.id]);

  // Track session start on mount (once)
  useEffect(() => {
    if (hasTrackedSession.current) return;
    hasTrackedSession.current = true;

    trackEvent({
      eventType: 'session_started',
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });

    // Track user return frequency
    const { isReturning, daysSinceLastVisit } = trackUserReturn();
    
    if (isReturning && daysSinceLastVisit > 0) {
      trackEvent({
        eventType: 'session_started',
        eventName: 'user_returned',
        metadata: {
          daysSinceLastVisit,
          isReturningUser: true,
        },
      });
    }

    // Track session end on unmount via beacon
    return () => {
      const payload = JSON.stringify({
        session_id: sessionId.current,
        event_type: 'session_ended',
        page_path: window.location.pathname,
        created_at: new Date().toISOString(),
      });
      
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_analytics_events`,
        payload
      );
    };
  }, [trackEvent]);

  // Convenience methods
  const trackGeneration = useCallback((
    status: 'started' | 'completed', 
    metadata?: Record<string, unknown>
  ) => {
    const eventMetadata = { ...metadata };
    
    if (status === 'completed') {
      const isFirst = trackFirstGeneration();
      if (isFirst) {
        eventMetadata.isFirstGeneration = true;
      }
    }
    
    trackGenerationEvent(status, eventMetadata, user?.id).catch(() => {});
  }, [user?.id]);

  const trackPlay = useCallback((trackId: string, metadata?: Record<string, unknown>) => {
    trackTrackPlayed(trackId, metadata, user?.id).catch(() => {});
  }, [user?.id]);

  const trackLike = useCallback((trackId: string, liked: boolean) => {
    trackEvent({
      eventType: 'track_liked',
      metadata: { trackId, liked },
    });
  }, [trackEvent]);

  const trackShare = useCallback((trackId: string, platform: string) => {
    trackTrackShared(trackId, platform, undefined, user?.id).catch(() => {});
  }, [user?.id]);

  const trackFeatureUsed = useCallback((featureName: string, metadata?: Record<string, unknown>) => {
    trackFeatureUsedEvent(featureName, metadata, user?.id).catch(() => {});
  }, [user?.id]);

  const trackButtonClick = useCallback((buttonName: string, metadata?: Record<string, unknown>) => {
    trackButtonClickEvent(buttonName, metadata, user?.id).catch(() => {});
  }, [user?.id]);

  return {
    trackEvent,
    trackGeneration,
    trackPlay,
    trackLike,
    trackShare,
    trackFeatureUsed,
    trackButtonClick,
    sessionId: sessionId.current,
  };
}

/**
 * Hook for admin to view user behavior stats
 */
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
    queryFn: () => fetchUserBehaviorStats(getInterval()),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export type { UserBehaviorStats };
