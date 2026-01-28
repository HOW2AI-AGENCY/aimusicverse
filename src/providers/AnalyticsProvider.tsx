/**
 * Analytics Provider
 * 
 * Centralized analytics initialization and context for the app.
 * Handles deeplink tracking, session management, and conversion tracking.
 */

import { ReactNode, memo, useEffect } from 'react';
import { useAnalyticsProvider } from '@/hooks/analytics/useAnalyticsProvider';
import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';
import { logger } from '@/lib/logger';

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Internal component that initializes analytics hooks
 * Separated to ensure hooks are called inside the provider tree
 */
function AnalyticsInitializer() {
  // Initialize main analytics provider (deeplinks, conversions)
  const { sessionId, deeplinkContext } = useAnalyticsProvider();
  
  // Initialize event tracking (page views, sessions)
  useAnalyticsTracking();

  // Log analytics initialization in dev
  useEffect(() => {
    logger.debug('Analytics initialized', {
      sessionId,
      hasDeeplinkContext: !!deeplinkContext,
      source: deeplinkContext?.source,
    });
  }, [sessionId, deeplinkContext]);

  return null;
}

/**
 * Analytics Provider Component
 * 
 * Wraps the app to provide analytics context and initialization.
 * Should be placed after AuthProvider and TelegramProvider but before feature providers.
 */
export const AnalyticsProvider = memo(function AnalyticsProvider({ 
  children 
}: AnalyticsProviderProps) {
  return (
    <>
      <AnalyticsInitializer />
      {children}
    </>
  );
});
