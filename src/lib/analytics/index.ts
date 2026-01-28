/**
 * Analytics Library Module
 * 
 * Core analytics utilities and tracking functionality.
 */

// Enhanced deeplink tracker
export * from './deeplink-tracker';

// Re-export services for convenience
export { 
  trackEvent,
  trackPageView,
  trackGeneration,
  trackFeatureUsed,
  trackButtonClick,
  trackDeeplink,
  markConversion,
} from '@/services/analytics';

// Re-export hooks for convenience
export { 
  useDeeplinkTracker, 
  useConversionTracking,
  useQuickConversions,
} from '@/hooks/analytics';
