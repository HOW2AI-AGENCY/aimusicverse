/**
 * Analytics Provider Hook
 * 
 * Centralized analytics context for app-wide tracking.
 * Combines deeplink tracking, conversion tracking, and event tracking.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTelegram } from '@/contexts/TelegramContext';
import { 
  initializeDeeplinkTracker, 
  trackConversionStage,
  hasReachedStage,
  getDeeplinkContext,
  type ConversionStage,
} from '@/lib/analytics/deeplink-tracker';
import { getOrCreateSessionId } from '@/services/analytics';

/**
 * Main analytics provider hook
 * Should be used once at app root level
 */
export function useAnalyticsProvider() {
  const location = useLocation();
  const { user } = useAuth();
  const { webApp, platform, isInitialized } = useTelegram();
  const initialized = useRef(false);

  const isTelegram = isInitialized && !!webApp;
  const telegramId = webApp?.initDataUnsafe?.user?.id;

  // Initialize on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Get Telegram start param if available
    const startParam = webApp?.initDataUnsafe?.start_param;
    
    // Initialize deeplink tracker
    initializeDeeplinkTracker({
      startParam,
      referrer: document.referrer,
      isTelegram,
      telegramId,
      pathname: location.pathname,
      search: location.search,
    });
  }, [isTelegram, telegramId, webApp, location]);

  // Track registration on user auth
  useEffect(() => {
    if (user?.id && !hasReachedStage('registered')) {
      trackConversionStage('registered', {
        method: isTelegram ? 'telegram' : 'web',
        telegram_id: telegramId,
      }).catch(() => {});
    }
  }, [user?.id, isTelegram, telegramId]);

  // Auto-track engagement after 30 seconds
  useEffect(() => {
    if (hasReachedStage('engaged')) return;

    const timer = setTimeout(() => {
      trackConversionStage('engaged', {
        time_on_site: 30,
        page: location.pathname,
      }).catch(() => {});
    }, 30000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Track conversions
  const trackConversion = useCallback(async (
    stage: ConversionStage,
    metadata?: Record<string, unknown>
  ) => {
    if (!hasReachedStage(stage)) {
      await trackConversionStage(stage, metadata);
    }
  }, []);

  return {
    sessionId: getOrCreateSessionId(),
    deeplinkContext: getDeeplinkContext(),
    trackConversion,
    hasReachedStage,
  };
}

/**
 * Lightweight hook for components that need conversion tracking
 */
export function useConversion() {
  const track = useCallback(async (
    stage: ConversionStage, 
    metadata?: Record<string, unknown>
  ) => {
    if (!hasReachedStage(stage)) {
      await trackConversionStage(stage, metadata);
    }
  }, []);

  return {
    trackEngagement: () => track('engaged'),
    trackRegistration: () => track('registered'),
    trackFirstAction: (action: string) => track('first_action', { action }),
    trackGeneration: (mode: string) => track('generation', { mode }),
    trackCompleted: (trackId?: string) => track('completed', { track_id: trackId }),
    trackPayment: (amount: number, type: string) => track('payment', { amount, type }),
    trackRetained: () => track('retained'),
  };
}
