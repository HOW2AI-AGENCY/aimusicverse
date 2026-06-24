/**
 * Analytics Library Module
 * 
 * Core analytics utilities and tracking functionality.
 */

// Enhanced deeplink tracker
export {
  // Session & Context
  getOrCreateSessionId as getDeeplinkSessionId,
  getDeeplinkContext,
  setDeeplinkContext,
  initializeDeeplinkTracker,
  
  // UTM & Source
  parseUTMParams,
  hasUTMParams,
  detectSource,
  
  // Device
  collectDeviceInfo,
  
  // Referral
  addToReferralChain,
  getReferralChain,
  
  // Conversion
  getConversionStages,
  hasReachedStage,
  trackConversionStage,
  
  // Experiments
  getExperimentAssignments,
  assignToExperiment,
  
  // Main tracking
  trackDeeplinkVisit,
  fetchDeeplinkAnalyticsSummary,
  
  // URL Building
  buildDeeplinkUrl,
  
  // Types
  type UTMParams,
  type DeeplinkContext,
  type DeeplinkSource,
  type ConversionStage,
  type ConversionEvent,
  type DeviceInfo,
  type ExperimentAssignment,
  type DeeplinkAnalyticsSummary,
  type DeeplinkBuildOptions,
} from './deeplink-tracker';

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
  useAnalyticsProvider,
  useConversion,
} from '@/hooks/analytics';
