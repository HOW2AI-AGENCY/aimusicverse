/**
 * Analytics Provider
 * 
 * Lightweight analytics wrapper that doesn't depend on Router.
 * Actual tracking initialization happens in MainLayout (inside Router context).
 */

import { ReactNode, memo, useEffect, useRef, lazy, Suspense } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  initializeDeeplinkTracker,
  getDeeplinkContext,
} from '@/lib/analytics/deeplink-tracker';
import { getOrCreateSessionId } from '@/services/analytics';
import { logger } from '@/lib/logger';

// Lazy load WebVitalsReporter - it's not critical for initial render
const WebVitalsReporter = lazy(() => 
  import('@/components/analytics/WebVitalsReporter').then(m => ({ default: m.WebVitalsReporter }))
);

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Analytics Provider Component
 * 
 * Initializes deeplink tracking based on Telegram context.
 * Router-dependent tracking (page views) is handled separately in MainLayout.
 */
export const AnalyticsProvider = memo(function AnalyticsProvider({ 
  children 
}: AnalyticsProviderProps) {
  const { webApp, isInitialized } = useTelegram();
  const { user } = useAuth();
  const initialized = useRef(false);

  const isTelegram = isInitialized && !!webApp;
  const telegramId = webApp?.initDataUnsafe?.user?.id;

  // Initialize deeplink tracker on mount (doesn't need Router)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const startParam = webApp?.initDataUnsafe?.start_param;
    
    // Initialize without pathname/search (those will be tracked in MainLayout)
    initializeDeeplinkTracker({
      startParam,
      referrer: document.referrer,
      isTelegram,
      telegramId,
      pathname: window.location.pathname,
      search: window.location.search,
    });

    logger.debug('Analytics provider initialized', {
      sessionId: getOrCreateSessionId(),
      hasDeeplinkContext: !!getDeeplinkContext(),
      isTelegram,
    });
  }, [isTelegram, telegramId, webApp]);

  return (
    <>
      {children}
      {/* Mount Web Vitals Reporter for performance tracking */}
      <Suspense fallback={null}>
        <WebVitalsReporter debug={import.meta.env.DEV} />
      </Suspense>
    </>
  );
});
