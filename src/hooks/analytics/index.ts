/**
 * Unified Analytics Hooks
 * 
 * Consolidated exports for all analytics-related hooks.
 */

// Main analytics hooks
export { 
  useAnalyticsTracking, 
  useUserBehaviorStats,
} from '../useAnalyticsTracking';

// Analytics provider (app-level)
export { 
  useAnalyticsProvider, 
  useConversion,
} from './useAnalyticsProvider';

// Deeplink tracking hooks
export { 
  useDeeplinkTracker, 
  useConversionTracking,
} from './useDeeplinkTracker';

// Utility hook for quick conversion events
export { useQuickConversions } from './useQuickConversions';

// Feature usage tracking
export { 
  useFeatureUsageTracking,
  FeatureEvents,
  type FeatureCategory,
  type FeatureUsageEvent,
} from './useFeatureUsageTracking';

// Performance tracking
export {
  usePerformanceTracking,
  useWebVitalsReporter,
  type PerformanceMetric,
} from './usePerformanceTracking';

// Deeplink analytics data hooks
export { 
  useDeeplinkAnalytics,
  useDeeplinkStats,
  useDeeplinkEvents,
  useTrackDeeplink,
} from '../useDeeplinkAnalytics';

// Re-export types
export type { 
  ConversionStage,
  UTMParams,
  DeeplinkContext,
} from '@/lib/analytics/deeplink-tracker';

export type { UserBehaviorStats } from '@/services/analytics';
