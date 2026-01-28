/**
 * Enhanced Deeplink Tracker
 * 
 * Advanced tracking for deep links with:
 * - UTM parameter parsing
 * - Campaign attribution
 * - Referral chain tracking
 * - Conversion funnel stages
 * - A/B experiment tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const deeplinkLogger = logger.child({ module: 'DeeplinkTracker' });

// ==========================================
// Types
// ==========================================

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface DeeplinkContext {
  type: string;
  value?: string;
  source: DeeplinkSource;
  utmParams?: UTMParams;
  referrer?: string;
  landingPath?: string;
  experimentId?: string;
  variantId?: string;
  referralCode?: string;
  isFirstVisit: boolean;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  platform: string;
  userAgent: string;
  language: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  isTouchDevice: boolean;
}

export type DeeplinkSource = 
  | 'telegram_miniapp' 
  | 'telegram_bot' 
  | 'telegram_channel'
  | 'web_share' 
  | 'qr_code' 
  | 'email'
  | 'push_notification'
  | 'social_media'
  | 'referral'
  | 'organic'
  | 'unknown';

export interface ConversionEvent {
  sessionId: string;
  stage: ConversionStage;
  metadata?: Record<string, unknown>;
}

export type ConversionStage = 
  | 'visit'           // Landed on app
  | 'engaged'         // Interacted with content
  | 'registered'      // Created account
  | 'first_action'    // First meaningful action (play, like, etc.)
  | 'generation'      // Started generation
  | 'completed'       // Completed generation
  | 'payment'         // Made payment
  | 'retained';       // Returned after 24h+

// Storage keys
const STORAGE_KEYS = {
  SESSION_ID: 'deeplink_session_id',
  FIRST_VISIT: 'deeplink_first_visit',
  LAST_DEEPLINK: 'deeplink_last_type',
  CONVERSION_STAGES: 'deeplink_conversion_stages',
  REFERRAL_CHAIN: 'deeplink_referral_chain',
  EXPERIMENT_ASSIGNMENTS: 'deeplink_experiments',
} as const;

// ==========================================
// Session Management
// ==========================================

export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

export function isFirstVisit(): boolean {
  const hasVisited = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
  if (!hasVisited) {
    localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, new Date().toISOString());
    return true;
  }
  return false;
}

// ==========================================
// UTM Parsing
// ==========================================

export function parseUTMParams(urlOrParams?: string | URLSearchParams): UTMParams {
  const params = typeof urlOrParams === 'string' 
    ? new URLSearchParams(urlOrParams)
    : urlOrParams || new URLSearchParams(window.location.search);

  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
  };
}

export function hasUTMParams(params: UTMParams): boolean {
  return !!(params.utm_source || params.utm_medium || params.utm_campaign);
}

// ==========================================
// Source Detection
// ==========================================

export function detectSource(referrer?: string, utmParams?: UTMParams): DeeplinkSource {
  // Check UTM source first
  if (utmParams?.utm_source) {
    const source = utmParams.utm_source.toLowerCase();
    if (source.includes('telegram')) return 'telegram_bot';
    if (source.includes('email')) return 'email';
    if (source.includes('social') || source.includes('facebook') || source.includes('twitter') || source.includes('instagram')) {
      return 'social_media';
    }
    if (source.includes('qr')) return 'qr_code';
    if (source.includes('push')) return 'push_notification';
    if (source.includes('referral') || source.includes('ref')) return 'referral';
  }
  
  // Check UTM medium
  if (utmParams?.utm_medium) {
    const medium = utmParams.utm_medium.toLowerCase();
    if (medium === 'email') return 'email';
    if (medium === 'social') return 'social_media';
    if (medium === 'referral') return 'referral';
  }

  // Check referrer
  if (referrer) {
    if (referrer.includes('t.me') || referrer.includes('telegram')) {
      return 'telegram_channel';
    }
    if (referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('instagram')) {
      return 'social_media';
    }
  }

  // Check if in Telegram Mini App
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
    return 'telegram_miniapp';
  }

  return 'unknown';
}

// ==========================================
// Device Info Collection
// ==========================================

export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'server',
      userAgent: '',
      language: 'en',
      timezone: 'UTC',
      screenWidth: 0,
      screenHeight: 0,
      isTouchDevice: false,
    };
  }

  return {
    platform: navigator.platform || 'unknown',
    userAgent: navigator.userAgent,
    language: navigator.language || 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}

// ==========================================
// Referral Chain Tracking
// ==========================================

export function addToReferralChain(referralCode: string): void {
  try {
    const chain = getReferralChain();
    if (!chain.includes(referralCode)) {
      chain.push(referralCode);
      localStorage.setItem(STORAGE_KEYS.REFERRAL_CHAIN, JSON.stringify(chain));
    }
  } catch (e) {
    deeplinkLogger.warn('Failed to update referral chain', { error: String(e) });
  }
}

export function getReferralChain(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REFERRAL_CHAIN);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ==========================================
// Conversion Funnel Tracking
// ==========================================

export function getConversionStages(): ConversionStage[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.CONVERSION_STAGES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function hasReachedStage(stage: ConversionStage): boolean {
  return getConversionStages().includes(stage);
}

export async function trackConversionStage(
  stage: ConversionStage,
  metadata?: Record<string, unknown>
): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const stages = getConversionStages();
  
  // Already tracked this stage
  if (stages.includes(stage)) {
    deeplinkLogger.debug('Stage already tracked', { stage });
    return;
  }

  // Add to local stages
  stages.push(stage);
  sessionStorage.setItem(STORAGE_KEYS.CONVERSION_STAGES, JSON.stringify(stages));

  // Track to database
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('deeplink_analytics').update({
      conversion_type: stage,
      converted: stage !== 'visit',
      metadata: {
        ...(metadata || {}),
        stages_reached: stages,
        stage_timestamp: new Date().toISOString(),
      },
    }).eq('session_id', sessionId);

    deeplinkLogger.info('Conversion stage tracked', { stage, sessionId });
  } catch (error) {
    deeplinkLogger.warn('Failed to track conversion stage', { error: String(error) });
  }
}

// ==========================================
// A/B Experiment Tracking
// ==========================================

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: string;
}

export function getExperimentAssignments(): Record<string, ExperimentAssignment> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function assignToExperiment(
  experimentId: string, 
  variants: string[],
  weights?: number[]
): string {
  const assignments = getExperimentAssignments();
  
  // Already assigned
  if (assignments[experimentId]) {
    return assignments[experimentId].variantId;
  }

  // Weighted random selection
  let variantId: string;
  if (weights && weights.length === variants.length) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    variantId = variants[variants.length - 1]; // Default to last
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        variantId = variants[i];
        break;
      }
    }
  } else {
    // Equal weights
    variantId = variants[Math.floor(Math.random() * variants.length)];
  }

  // Store assignment
  assignments[experimentId] = {
    experimentId,
    variantId,
    assignedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.EXPERIMENT_ASSIGNMENTS, JSON.stringify(assignments));

  deeplinkLogger.debug('Experiment assigned', { experimentId, variantId });
  return variantId;
}

// ==========================================
// Main Tracking Function
// ==========================================

export async function trackDeeplinkVisit(context: DeeplinkContext): Promise<void> {
  const sessionId = getOrCreateSessionId();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id || null,
      session_id: sessionId,
      deeplink_type: context.type,
      deeplink_value: context.value || null,
      source: context.source,
      campaign: context.utmParams?.utm_campaign || null,
      referrer: context.referrer || null,
      converted: false,
      metadata: {
        utm_source: context.utmParams?.utm_source || null,
        utm_medium: context.utmParams?.utm_medium || null,
        utm_campaign: context.utmParams?.utm_campaign || null,
        utm_term: context.utmParams?.utm_term || null,
        utm_content: context.utmParams?.utm_content || null,
        device_platform: context.deviceInfo.platform,
        device_language: context.deviceInfo.language,
        device_timezone: context.deviceInfo.timezone,
        screen_width: context.deviceInfo.screenWidth,
        screen_height: context.deviceInfo.screenHeight,
        is_touch: context.deviceInfo.isTouchDevice,
        landing_path: context.landingPath || null,
        is_first_visit: context.isFirstVisit,
        experiment_id: context.experimentId || null,
        variant_id: context.variantId || null,
        referral_code: context.referralCode || null,
        referral_chain: getReferralChain().join(','),
      } as Record<string, string | number | boolean | null>,
    };

    await supabase.from('deeplink_analytics').insert([payload]);

    // Track initial visit stage
    await trackConversionStage('visit');

    deeplinkLogger.info('Deeplink visit tracked', { 
      type: context.type, 
      source: context.source,
      sessionId 
    });
  } catch (error) {
    deeplinkLogger.error('Failed to track deeplink visit', { error: String(error) });
  }
}

// ==========================================
// Analytics Queries
// ==========================================

export interface DeeplinkAnalyticsSummary {
  totalVisits: number;
  uniqueUsers: number;
  conversionsByStage: Record<ConversionStage, number>;
  topSources: Array<{ source: string; count: number; conversion_rate: number }>;
  topCampaigns: Array<{ campaign: string; count: number; conversion_rate: number }>;
  hourlyDistribution: Record<number, number>;
  dailyTrend: Array<{ date: string; visits: number; conversions: number }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

/**
 * Fetch deeplink analytics summary
 * Uses direct queries since the RPC may not exist
 */
export async function fetchDeeplinkAnalyticsSummary(
  timePeriod: string = '7 days'
): Promise<DeeplinkAnalyticsSummary | null> {
  try {
    // Calculate date range
    const now = new Date();
    const days = parseInt(timePeriod) || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch raw data
    const { data: events, error } = await supabase
      .from('deeplink_analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      deeplinkLogger.error('Failed to fetch analytics', { error });
      return null;
    }

    if (!events || events.length === 0) {
      return {
        totalVisits: 0,
        uniqueUsers: 0,
        conversionsByStage: {} as Record<ConversionStage, number>,
        topSources: [],
        topCampaigns: [],
        hourlyDistribution: {},
        dailyTrend: [],
        deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
      };
    }

    // Calculate metrics
    const uniqueUsers = new Set(events.filter(e => e.user_id).map(e => e.user_id)).size;
    
    // Group by source
    const sourceGroups = events.reduce((acc, e) => {
      const source = e.source || 'unknown';
      if (!acc[source]) acc[source] = { total: 0, converted: 0 };
      acc[source].total++;
      if (e.converted) acc[source].converted++;
      return acc;
    }, {} as Record<string, { total: number; converted: number }>);

    const topSources = Object.entries(sourceGroups)
      .map(([source, stats]) => ({
        source,
        count: stats.total,
        conversion_rate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by campaign
    const campaignGroups = events.reduce((acc, e) => {
      const campaign = e.campaign || 'direct';
      if (!acc[campaign]) acc[campaign] = { total: 0, converted: 0 };
      acc[campaign].total++;
      if (e.converted) acc[campaign].converted++;
      return acc;
    }, {} as Record<string, { total: number; converted: number }>);

    const topCampaigns = Object.entries(campaignGroups)
      .map(([campaign, stats]) => ({
        campaign,
        count: stats.total,
        conversion_rate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly distribution
    const hourlyDistribution: Record<number, number> = {};
    events.forEach(e => {
      const hour = new Date(e.created_at!).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // Daily trend
    const dailyGroups = events.reduce((acc, e) => {
      const date = e.created_at!.split('T')[0];
      if (!acc[date]) acc[date] = { visits: 0, conversions: 0 };
      acc[date].visits++;
      if (e.converted) acc[date].conversions++;
      return acc;
    }, {} as Record<string, { visits: number; conversions: number }>);

    const dailyTrend = Object.entries(dailyGroups)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalVisits: events.length,
      uniqueUsers,
      conversionsByStage: {} as Record<ConversionStage, number>,
      topSources,
      topCampaigns,
      hourlyDistribution,
      dailyTrend,
      deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    };
  } catch (error) {
    deeplinkLogger.error('Error in fetchDeeplinkAnalyticsSummary', { error: String(error) });
    return null;
  }
}

// ==========================================
// Utility: Build Deep Link URL
// ==========================================

export interface DeeplinkBuildOptions {
  type: string;
  value?: string;
  utmParams?: UTMParams;
  referralCode?: string;
  experimentId?: string;
  variantId?: string;
}

export function buildDeeplinkUrl(
  botUsername: string,
  options: DeeplinkBuildOptions
): string {
  const startParam = options.value 
    ? `${options.type}_${options.value}` 
    : options.type;

  let url = `https://t.me/${botUsername}/app?startapp=${startParam}`;

  // Add UTM params to landing page tracking
  const params = new URLSearchParams();
  if (options.utmParams) {
    Object.entries(options.utmParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  if (options.referralCode) {
    params.set('ref', options.referralCode);
  }
  if (options.experimentId && options.variantId) {
    params.set('exp', `${options.experimentId}:${options.variantId}`);
  }

  // Note: UTM params are tracked separately since Telegram doesn't pass URL params
  // We store them in the startParam when needed
  return url;
}
