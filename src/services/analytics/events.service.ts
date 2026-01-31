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
 * Track generation event with detailed metrics
 * Phase 5.1: Enhanced telemetry for success rate tracking
 */
export async function trackGeneration(
  status: 'started' | 'completed' | 'failed',
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  const eventType = status === 'started' 
    ? 'generation_started' 
    : status === 'completed' 
      ? 'generation_completed' 
      : 'generation_failed';
  
  await trackEvent({
    eventType,
    metadata: {
      ...metadata,
      timestamp: Date.now(),
    },
  }, userId);
}

/**
 * Track generation with full metrics for success rate analysis
 */
export async function trackGenerationMetrics(
  data: {
    mode: 'simple' | 'custom' | 'wizard';
    status: 'success' | 'error';
    duration_ms?: number;
    error_type?: string;
    error_message?: string;
    has_reference?: boolean;
    has_lyrics?: boolean;
    has_vocals?: boolean;
    model?: string;
  },
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'generation_metrics',
    metadata: {
      ...data,
      timestamp: Date.now(),
    },
  }, userId);
}

/**
 * Track onboarding funnel metrics
 */
export async function trackOnboardingStep(
  step: string,
  completed: boolean,
  metadata?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'onboarding_step',
    eventName: step,
    metadata: {
      completed,
      ...metadata,
    },
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
