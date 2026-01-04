/**
 * Analytics Service Layer
 * Business logic for analytics tracking and reporting
 */

import * as analyticsApi from '@/api/analytics.api';
import type { 
  AnalyticsEvent, 
  UserBehaviorStats, 
  DeeplinkStats,
  FunnelDropoffData 
} from '@/api/analytics.api';

// ==========================================
// Session Management
// ==========================================

const SESSION_KEY = 'analytics_session_id';
const JOURNEY_SESSION_KEY = 'journey_session_id';
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session ID for analytics
 */
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get or create a journey session ID with expiry
 */
export function getOrCreateJourneySessionId(): string {
  const stored = sessionStorage.getItem(JOURNEY_SESSION_KEY);
  if (stored) {
    const { id, timestamp } = JSON.parse(stored);
    if (Date.now() - timestamp < SESSION_EXPIRY) {
      return id;
    }
  }
  
  const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(JOURNEY_SESSION_KEY, JSON.stringify({
    id: newId,
    timestamp: Date.now(),
  }));
  return newId;
}

/**
 * Refresh journey session timestamp
 */
export function refreshJourneySession(): void {
  const stored = sessionStorage.getItem(JOURNEY_SESSION_KEY);
  if (stored) {
    const { id } = JSON.parse(stored);
    sessionStorage.setItem(JOURNEY_SESSION_KEY, JSON.stringify({
      id,
      timestamp: Date.now(),
    }));
  }
}

// ==========================================
// Event Tracking
// ==========================================

/**
 * Track analytics event with session
 */
export async function trackEvent(
  event: Omit<AnalyticsEvent, 'sessionId'>,
  userId?: string
): Promise<void> {
  await analyticsApi.trackAnalyticsEvent({
    ...event,
    sessionId: getOrCreateSessionId(),
    userId,
  });
}

/**
 * Track page view
 */
export async function trackPageView(
  pagePath: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'page_view',
    pagePath,
    metadata,
  }, userId);
}

/**
 * Track generation event
 */
export async function trackGeneration(
  status: 'started' | 'completed',
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: status === 'started' ? 'generation_started' : 'generation_completed',
    metadata,
  }, userId);
}

/**
 * Track feature usage
 */
export async function trackFeatureUsed(
  featureName: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'feature_used',
    eventName: featureName,
    metadata,
  }, userId);
}

// ==========================================
// Deeplink Analytics
// ==========================================

/**
 * Track a deeplink visit
 */
export async function trackDeeplink(params: {
  deeplinkType: string;
  deeplinkValue?: string;
  source?: string;
  campaign?: string;
  metadata?: Record<string, unknown>;
}, userId?: string): Promise<void> {
  await analyticsApi.trackDeeplinkVisit({
    ...params,
    sessionId: getOrCreateSessionId(),
    referrer: document.referrer || undefined,
    userId,
  });
}

/**
 * Mark a conversion from deeplink
 */
export async function markConversion(conversionType: string): Promise<void> {
  const sessionId = sessionStorage.getItem(SESSION_KEY);
  if (sessionId) {
    await analyticsApi.markDeeplinkConversion(sessionId, conversionType);
  }
}

// ==========================================
// Funnel Analytics
// ==========================================

export interface FunnelAnalysis {
  funnel: string;
  steps: FunnelDropoffData[];
  overallConversionRate: number;
  biggestDropoff: { step: string; rate: number } | null;
}

/**
 * Analyze funnel dropoff
 */
export async function analyzeFunnelDropoff(
  funnelName: string,
  daysBack: number = 7
): Promise<FunnelAnalysis | null> {
  const steps = await analyticsApi.fetchFunnelDropoffStats(funnelName, daysBack);
  
  if (!steps || steps.length === 0) {
    return null;
  }
  
  // Find biggest dropoff
  let biggestDropoff: { step: string; rate: number } | null = null;
  let maxDropRate = 0;
  
  for (let i = 0; i < steps.length - 1; i++) {
    const current = steps[i];
    const next = steps[i + 1];
    if (current.users_reached > 0) {
      const dropRate = ((current.users_reached - next.users_reached) / current.users_reached) * 100;
      if (dropRate > maxDropRate) {
        maxDropRate = dropRate;
        biggestDropoff = { step: current.step_name, rate: dropRate };
      }
    }
  }
  
  const firstStep = steps[0];
  const lastStep = steps[steps.length - 1];
  const overallConversionRate = firstStep.users_reached > 0
    ? (lastStep.users_reached / firstStep.users_reached) * 100
    : 0;
  
  return {
    funnel: funnelName,
    steps,
    overallConversionRate,
    biggestDropoff,
  };
}

// ==========================================
// Return Frequency
// ==========================================

/**
 * Track user return and calculate frequency
 */
export function trackUserReturn(): { isReturning: boolean; daysSinceLastVisit: number } {
  const lastVisit = localStorage.getItem('last-visit-date');
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  let isReturning = false;
  let daysSinceLastVisit = 0;
  
  if (lastVisit && lastVisit !== today) {
    const lastVisitDate = new Date(lastVisit);
    daysSinceLastVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    isReturning = true;
  }
  
  localStorage.setItem('last-visit-date', today);
  
  return { isReturning, daysSinceLastVisit };
}

/**
 * Track first generation milestone
 */
export function trackFirstGeneration(): boolean {
  const alreadyTracked = localStorage.getItem('first-generation-tracked');
  if (!alreadyTracked) {
    localStorage.setItem('first-generation-tracked', 'true');
    localStorage.setItem('first-generation-date', new Date().toISOString());
    return true;
  }
  return false;
}

// Re-export API functions for convenience
export {
  fetchUserBehaviorStats,
  fetchDeeplinkStats,
  fetchDeeplinkEvents,
} from '@/api/analytics.api';
