/**
 * Deeplink Tracker Hook
 * 
 * React hook for tracking deeplink visits and conversions
 * with full UTM, campaign, and experiment support.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import {
  trackDeeplinkVisit,
  trackConversionStage,
  parseUTMParams,
  detectSource,
  collectDeviceInfo,
  isFirstVisit,
  getOrCreateSessionId,
  assignToExperiment,
  addToReferralChain,
  getReferralChain,
  hasReachedStage,
  type DeeplinkContext,
  type ConversionStage,
  type UTMParams,
} from '@/lib/analytics/deeplink-tracker';
import { logger } from '@/lib/logger';

const trackerLogger = logger.child({ module: 'useDeeplinkTracker' });

interface UseDeeplinkTrackerOptions {
  /** Whether to auto-track on mount */
  autoTrack?: boolean;
  /** Experiment configurations for A/B testing */
  experiments?: Array<{
    id: string;
    variants: string[];
    weights?: number[];
  }>;
}

interface UseDeeplinkTrackerReturn {
  /** Current session ID */
  sessionId: string;
  /** Whether this is user's first visit */
  isFirstVisit: boolean;
  /** UTM parameters from URL */
  utmParams: UTMParams;
  /** Referral chain for multi-level referrals */
  referralChain: string[];
  /** Assigned experiment variants */
  experimentVariants: Record<string, string>;
  /** Track a custom conversion stage */
  trackConversion: (stage: ConversionStage, metadata?: Record<string, unknown>) => Promise<void>;
  /** Check if a conversion stage has been reached */
  hasReachedStage: (stage: ConversionStage) => boolean;
  /** Manually track a deeplink visit */
  trackVisit: (type: string, value?: string) => Promise<void>;
}

export function useDeeplinkTracker(
  options: UseDeeplinkTrackerOptions = {}
): UseDeeplinkTrackerReturn {
  const { autoTrack = true, experiments = [] } = options;
  const { webApp, user } = useTelegram();
  
  const sessionIdRef = useRef(getOrCreateSessionId());
  const isFirstVisitRef = useRef(isFirstVisit());
  const hasTrackedRef = useRef(false);
  const utmParamsRef = useRef<UTMParams>(parseUTMParams());
  const experimentVariantsRef = useRef<Record<string, string>>({});

  // Assign to experiments on mount
  useEffect(() => {
    experiments.forEach(exp => {
      const variant = assignToExperiment(exp.id, exp.variants, exp.weights);
      experimentVariantsRef.current[exp.id] = variant;
    });
  }, [experiments]);

  // Auto-track on mount
  useEffect(() => {
    if (!autoTrack || hasTrackedRef.current) return;

    const startParam = webApp?.initDataUnsafe?.start_param;
    if (!startParam) return;

    hasTrackedRef.current = true;

    // Parse the start param
    const [type, ...valueParts] = startParam.split('_');
    const value = valueParts.join('_') || undefined;

    // Check for referral code
    if (type === 'ref' || type === 'invite') {
      if (value) {
        addToReferralChain(value);
      }
    }

    // Build context
    const context: DeeplinkContext = {
      type,
      value,
      source: detectSource(document.referrer, utmParamsRef.current),
      utmParams: utmParamsRef.current,
      referrer: document.referrer || undefined,
      landingPath: window.location.pathname,
      isFirstVisit: isFirstVisitRef.current,
      deviceInfo: collectDeviceInfo(),
      referralCode: type === 'ref' || type === 'invite' ? value : undefined,
    };

    // Add experiment info if assigned
    const experimentIds = Object.keys(experimentVariantsRef.current);
    if (experimentIds.length > 0) {
      context.experimentId = experimentIds[0];
      context.variantId = experimentVariantsRef.current[experimentIds[0]];
    }

    trackDeeplinkVisit(context).catch(err => {
      trackerLogger.error('Failed to track deeplink', { error: String(err) });
    });
  }, [autoTrack, webApp?.initDataUnsafe?.start_param]);

  // Track conversion
  const trackConversion = useCallback(async (
    stage: ConversionStage,
    metadata?: Record<string, unknown>
  ) => {
    await trackConversionStage(stage, {
      ...metadata,
      telegram_id: user?.telegram_id,
      experiment_variants: experimentVariantsRef.current,
    });
  }, [user?.telegram_id]);

  // Manual tracking
  const trackVisit = useCallback(async (type: string, value?: string) => {
    const context: DeeplinkContext = {
      type,
      value,
      source: detectSource(document.referrer, utmParamsRef.current),
      utmParams: utmParamsRef.current,
      referrer: document.referrer || undefined,
      landingPath: window.location.pathname,
      isFirstVisit: isFirstVisitRef.current,
      deviceInfo: collectDeviceInfo(),
    };

    await trackDeeplinkVisit(context);
  }, []);

  return {
    sessionId: sessionIdRef.current,
    isFirstVisit: isFirstVisitRef.current,
    utmParams: utmParamsRef.current,
    referralChain: getReferralChain(),
    experimentVariants: experimentVariantsRef.current,
    trackConversion,
    hasReachedStage,
    trackVisit,
  };
}

/**
 * Hook to track specific conversion events
 */
export function useConversionTracking() {
  const { trackConversion, hasReachedStage: checkStage } = useDeeplinkTracker({ autoTrack: false });

  const trackEngagement = useCallback(() => {
    if (!checkStage('engaged')) {
      trackConversion('engaged');
    }
  }, [trackConversion, checkStage]);

  const trackRegistration = useCallback(() => {
    if (!checkStage('registered')) {
      trackConversion('registered');
    }
  }, [trackConversion, checkStage]);

  const trackFirstAction = useCallback((actionType: string) => {
    if (!checkStage('first_action')) {
      trackConversion('first_action', { action_type: actionType });
    }
  }, [trackConversion, checkStage]);

  const trackGeneration = useCallback((mode: string) => {
    if (!checkStage('generation')) {
      trackConversion('generation', { mode });
    }
  }, [trackConversion, checkStage]);

  const trackCompleted = useCallback((trackId?: string) => {
    if (!checkStage('completed')) {
      trackConversion('completed', { track_id: trackId });
    }
  }, [trackConversion, checkStage]);

  const trackPayment = useCallback((amount: number, productType: string) => {
    if (!checkStage('payment')) {
      trackConversion('payment', { amount, product_type: productType });
    }
  }, [trackConversion, checkStage]);

  const trackRetention = useCallback(() => {
    // Check if last visit was more than 24 hours ago
    const lastVisit = localStorage.getItem('last_deeplink_visit');
    const now = Date.now();
    
    if (lastVisit) {
      const hoursSinceLastVisit = (now - parseInt(lastVisit)) / (1000 * 60 * 60);
      if (hoursSinceLastVisit >= 24 && !checkStage('retained')) {
        trackConversion('retained', { hours_since_last: Math.round(hoursSinceLastVisit) });
      }
    }
    
    localStorage.setItem('last_deeplink_visit', now.toString());
  }, [trackConversion, checkStage]);

  return {
    trackEngagement,
    trackRegistration,
    trackFirstAction,
    trackGeneration,
    trackCompleted,
    trackPayment,
    trackRetention,
  };
}
