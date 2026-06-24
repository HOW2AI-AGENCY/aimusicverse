/**
 * Deeplink Analytics Service
 * Handles deeplink tracking and conversion
 */

import * as analyticsApi from '@/api/analytics.api';
import { getOrCreateSessionId, getCurrentSessionId } from './session.service';

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
  const sessionId = getCurrentSessionId();
  if (sessionId) {
    await analyticsApi.markDeeplinkConversion(sessionId, conversionType);
  }
}

/**
 * Fetch deeplink statistics
 */
export async function fetchDeeplinkStats(timePeriod: string = '7 days') {
  return analyticsApi.fetchDeeplinkStats(timePeriod);
}

/**
 * Fetch deeplink events
 */
export async function fetchDeeplinkEvents(options: { timeRange?: string; limit?: number } = {}) {
  return analyticsApi.fetchDeeplinkEvents(options);
}
