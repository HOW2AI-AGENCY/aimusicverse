/**
 * useFeatureUsageTracking - Track feature engagement metrics
 * 
 * Provides utilities for tracking how users interact with specific features.
 * Useful for A/B testing, feature adoption analysis, and UX improvements.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackFeatureUsed, trackEvent } from '@/services/analytics';

export type FeatureCategory = 
  | 'generation'
  | 'studio'
  | 'library'
  | 'player'
  | 'social'
  | 'settings'
  | 'onboarding';

export interface FeatureUsageEvent {
  feature: string;
  category: FeatureCategory;
  action: 'view' | 'click' | 'complete' | 'error' | 'abandon';
  metadata?: Record<string, unknown>;
  duration?: number;
}

interface FeatureSession {
  startTime: number;
  feature: string;
  category: FeatureCategory;
}

/**
 * Hook for tracking feature usage with session timing
 */
export function useFeatureUsageTracking() {
  const { user } = useAuth();
  const activeSession = useRef<FeatureSession | null>(null);

  /**
   * Track a feature usage event
   */
  const trackFeature = useCallback(async (event: FeatureUsageEvent) => {
    try {
      await trackFeatureUsed(event.feature, {
        category: event.category,
        action: event.action,
        duration: event.duration,
        ...event.metadata,
      }, user?.id);
    } catch (error) {
      // Silent fail - analytics shouldn't break the app
      if (import.meta.env.DEV) {
        console.warn('[FeatureTracking] Error:', error);
      }
    }
  }, [user?.id]);

  /**
   * Start a feature session (for timing)
   */
  const startFeatureSession = useCallback((feature: string, category: FeatureCategory) => {
    activeSession.current = {
      startTime: Date.now(),
      feature,
      category,
    };
    
    trackFeature({
      feature,
      category,
      action: 'view',
    });
  }, [trackFeature]);

  /**
   * End a feature session and track duration
   */
  const endFeatureSession = useCallback((action: 'complete' | 'abandon' = 'complete', metadata?: Record<string, unknown>) => {
    if (!activeSession.current) return;

    const duration = Date.now() - activeSession.current.startTime;
    
    trackFeature({
      feature: activeSession.current.feature,
      category: activeSession.current.category,
      action,
      duration,
      metadata,
    });

    activeSession.current = null;
  }, [trackFeature]);

  /**
   * Track a quick action (no session needed)
   */
  const trackAction = useCallback((
    feature: string, 
    category: FeatureCategory, 
    action: 'click' | 'complete' | 'error',
    metadata?: Record<string, unknown>
  ) => {
    trackFeature({ feature, category, action, metadata });
  }, [trackFeature]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeSession.current) {
        endFeatureSession('abandon');
      }
    };
  }, [endFeatureSession]);

  return {
    trackFeature,
    trackAction,
    startFeatureSession,
    endFeatureSession,
    hasActiveSession: !!activeSession.current,
  };
}

/**
 * Predefined feature tracking events
 */
export const FeatureEvents = {
  // Generation
  GENERATION_STARTED: (mode: string) => ({
    feature: 'generation',
    category: 'generation' as FeatureCategory,
    action: 'click' as const,
    metadata: { mode },
  }),
  GENERATION_COMPLETED: (duration: number, success: boolean) => ({
    feature: 'generation',
    category: 'generation' as FeatureCategory,
    action: success ? 'complete' as const : 'error' as const,
    duration,
  }),
  PRESET_USED: (presetId: string) => ({
    feature: 'quick_preset',
    category: 'generation' as FeatureCategory,
    action: 'click' as const,
    metadata: { presetId },
  }),

  // Studio
  STUDIO_OPENED: (source: string) => ({
    feature: 'studio',
    category: 'studio' as FeatureCategory,
    action: 'view' as const,
    metadata: { source },
  }),
  STEM_SEPARATION: (mode: 'simple' | 'detailed') => ({
    feature: 'stem_separation',
    category: 'studio' as FeatureCategory,
    action: 'click' as const,
    metadata: { mode },
  }),
  RECORDING_STARTED: (type: string) => ({
    feature: 'recording',
    category: 'studio' as FeatureCategory,
    action: 'click' as const,
    metadata: { type },
  }),

  // Library
  TRACK_PLAYED: (source: string) => ({
    feature: 'playback',
    category: 'library' as FeatureCategory,
    action: 'click' as const,
    metadata: { source },
  }),
  SWIPE_ACTION: (action: string) => ({
    feature: 'swipe_gesture',
    category: 'library' as FeatureCategory,
    action: 'click' as const,
    metadata: { swipeAction: action },
  }),

  // Player
  PLAYER_EXPANDED: () => ({
    feature: 'player_expand',
    category: 'player' as FeatureCategory,
    action: 'click' as const,
  }),
  QUEUE_MODIFIED: (action: 'add' | 'remove' | 'reorder') => ({
    feature: 'queue',
    category: 'player' as FeatureCategory,
    action: 'click' as const,
    metadata: { queueAction: action },
  }),

  // Social
  TRACK_SHARED: (platform: string) => ({
    feature: 'share',
    category: 'social' as FeatureCategory,
    action: 'complete' as const,
    metadata: { platform },
  }),
  TRACK_LIKED: () => ({
    feature: 'like',
    category: 'social' as FeatureCategory,
    action: 'click' as const,
  }),

  // Onboarding
  ONBOARDING_STEP: (step: number, action: 'view' | 'complete' | 'abandon') => ({
    feature: 'onboarding',
    category: 'onboarding' as FeatureCategory,
    action,
    metadata: { step },
  }),
  TIP_SHOWN: (tipId: string) => ({
    feature: 'contextual_tip',
    category: 'onboarding' as FeatureCategory,
    action: 'view' as const,
    metadata: { tipId },
  }),
  TIP_DISMISSED: (tipId: string) => ({
    feature: 'contextual_tip',
    category: 'onboarding' as FeatureCategory,
    action: 'complete' as const,
    metadata: { tipId },
  }),
};

export default useFeatureUsageTracking;
