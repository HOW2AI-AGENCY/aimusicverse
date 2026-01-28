/**
 * Analytics Service Module
 * 
 * Unified exports for all analytics functionality.
 * Split from monolithic analytics.service.ts for better maintainability.
 */

// Session management
export {
  getOrCreateSessionId,
  getOrCreateJourneySessionId,
  refreshJourneySession,
  getCurrentSessionId,
  clearSession,
} from './session.service';

// Event tracking
export {
  trackEvent,
  trackPageView,
  trackGeneration,
  trackFeatureUsed,
  trackButtonClick,
  trackTrackPlayed,
  trackTrackShared,
} from './events.service';

// Deeplink tracking
export {
  trackDeeplink,
  markConversion,
  fetchDeeplinkStats,
  fetchDeeplinkEvents,
} from './deeplink.service';

// Funnel analytics
export {
  analyzeFunnelDropoff,
  getFunnelDropoffStats,
  type FunnelAnalysis,
} from './funnel.service';

// Retention tracking
export {
  trackUserReturn,
  trackFirstGeneration,
  hasTrackedFirstGeneration,
  getFirstGenerationDate,
  getLastVisitDate,
  calculateRetentionDays,
  type ReturnInfo,
} from './retention.service';

// Re-export API types
export type {
  AnalyticsEvent,
  UserBehaviorStats,
  DeeplinkStats,
  DeeplinkEvent,
  FunnelDropoffData,
} from '@/api/analytics.api';

// Re-export API functions for backward compatibility
export {
  fetchUserBehaviorStats,
} from '@/api/analytics.api';
