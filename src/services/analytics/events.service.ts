/**
 * Analytics Events Service
 * Handles tracking of analytics events
 */

import * as analyticsApi from '@/api/analytics.api';
import type { AnalyticsEvent } from '@/api/analytics.api';
import { getOrCreateSessionId } from './session.service';

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

/**
 * Track button click
 */
export async function trackButtonClick(
  buttonName: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'button_clicked',
    eventName: buttonName,
    metadata,
  }, userId);
}

/**
 * Track track played
 */
export async function trackTrackPlayed(
  trackId: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'track_played',
    metadata: { track_id: trackId, ...metadata },
  }, userId);
}

/**
 * Track track shared
 */
export async function trackTrackShared(
  trackId: string,
  shareMethod: string,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'track_shared',
    metadata: { track_id: trackId, share_method: shareMethod, ...metadata },
  }, userId);
}
