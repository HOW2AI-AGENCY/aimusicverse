/**
 * Navigation Analytics Hook
 * 
 * Automatically tracks page views and navigation events.
 * Integrates with the telemetry system.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationAnalytics } from '@/lib/telemetry';
import { logger } from '@/lib/logger';

export function useNavigationAnalytics() {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousPathRef.current;

    // Track page view
    navigationAnalytics.trackPageView(currentPath, previousPath || undefined);

    // Track navigation (not on first render)
    if (!isFirstRenderRef.current && previousPath && previousPath !== currentPath) {
      navigationAnalytics.trackNavigation(previousPath, currentPath, 'router');
      logger.debug('Navigation tracked', { from: previousPath, to: currentPath });
    }

    // Update refs
    previousPathRef.current = currentPath;
    isFirstRenderRef.current = false;
  }, [location.pathname]);

  return {
    currentPath: location.pathname,
  };
}
