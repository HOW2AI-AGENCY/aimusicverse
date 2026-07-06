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

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  STORAGE_KEYS,
  type UTMParams,
  type DeeplinkContext,
  type DeviceInfo,
  type DeeplinkSource,
  type ConversionEvent,
  type ConversionStage,
  type InitializeOptions,
} from "./deeplinkTypes";

// Re-export for backward compatibility
export type {
  UTMParams,
  DeeplinkContext,
  DeviceInfo,
  DeeplinkSource,
  ConversionEvent,
  ConversionStage,
  InitializeOptions,
};

const deeplinkLogger = logger.child({ module: "DeeplinkTracker" });

// ==========================================
// Session Management (Enhanced with persistence)
// ==========================================

/**
 * Get or create a session ID with localStorage fallback for conversion tracking
 * This ensures conversions can be tracked even after tab close
 */
export function getOrCreateSessionId(): string {
  // Try sessionStorage first (for current session tracking)
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);

  if (!sessionId) {
    // Check localStorage for persistent session (for returning users)
    const persistentId = localStorage.getItem(STORAGE_KEYS.PERSISTENT_SESSION_ID);

    if (persistentId) {
      // Reuse persistent session for conversion continuity
      sessionId = persistentId;
    } else {
      // Create new session
      sessionId = `sess_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      // Store in localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.PERSISTENT_SESSION_ID, sessionId);
    }

    // Always store in sessionStorage for fast access
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }

  return sessionId;
}

/**
 * Get the persistent session ID (from localStorage)
 * Used for conversion tracking across browser sessions
 */
export function getPersistentSessionId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.PERSISTENT_SESSION_ID);
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
  const params =
    typeof urlOrParams === "string"
      ? new URLSearchParams(urlOrParams)
      : urlOrParams || new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_term: params.get("utm_term") || undefined,
    utm_content: params.get("utm_content") || undefined,
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
    if (source.includes("telegram")) return "telegram_bot";
    if (source.includes("email")) return "email";
    if (
      source.includes("social") ||
      source.includes("facebook") ||
      source.includes("twitter") ||
      source.includes("instagram")
    ) {
      return "social_media";
    }
    if (source.includes("qr")) return "qr_code";
    if (source.includes("push")) return "push_notification";
    if (source.includes("referral") || source.includes("ref")) return "referral";
  }

  // Check UTM medium
  if (utmParams?.utm_medium) {
    const medium = utmParams.utm_medium.toLowerCase();
    if (medium === "email") return "email";
    if (medium === "social") return "social_media";
    if (medium === "referral") return "referral";
  }

  // Check referrer
  if (referrer) {
    if (referrer.includes("t.me") || referrer.includes("telegram")) {
      return "telegram_channel";
    }
    if (referrer.includes("facebook") || referrer.includes("twitter") || referrer.includes("instagram")) {
      return "social_media";
    }
  }

  // Check if in Telegram Mini App
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Telegram WebApp SDK not yet in window type
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initData) {
    return "telegram_miniapp";
  }

  return "unknown";
}

// ==========================================
// Device Info Collection
// ==========================================

export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      platform: "server",
      userAgent: "",
      language: "en",
      timezone: "UTC",
      screenWidth: 0,
      screenHeight: 0,
      isTouchDevice: false,
    };
  }

  return {
    platform: navigator.platform || "unknown",
    userAgent: navigator.userAgent,
    language: navigator.language || "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
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
    deeplinkLogger.warn("Failed to update referral chain", { error: String(e) });
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

/**
 * Get conversion stages from both sessionStorage and localStorage
 * Merges both to ensure persistence across sessions
 */
export function getConversionStages(): ConversionStage[] {
  try {
    // Get from sessionStorage (current session)
    const sessionStages = sessionStorage.getItem(STORAGE_KEYS.CONVERSION_STAGES);
    const sessionList: ConversionStage[] = sessionStages ? JSON.parse(sessionStages) : [];

    // Get from localStorage (persistent across sessions)
    const persistentStages = localStorage.getItem(STORAGE_KEYS.PERSISTENT_CONVERSION_STAGES);
    const persistentList: ConversionStage[] = persistentStages ? JSON.parse(persistentStages) : [];

    // Merge unique stages
    const merged = [...new Set([...persistentList, ...sessionList])];
    return merged;
  } catch {
    return [];
  }
}

export function hasReachedStage(stage: ConversionStage): boolean {
  return getConversionStages().includes(stage);
}

/**
 * Track conversion stage with enhanced persistence
 * - Uses localStorage for persistence across browser sessions
 * - Uses user_id when available for cross-device tracking
 * - Falls back to session_id for anonymous users
 */
export async function trackConversionStage(stage: ConversionStage, metadata?: Record<string, unknown>): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const persistentSessionId = getPersistentSessionId();
  const stages = getConversionStages();

  // Already tracked this stage
  if (stages.includes(stage)) {
    deeplinkLogger.debug("Stage already tracked", { stage });
    return;
  }

  // Add to local stages (both storages for redundancy)
  stages.push(stage);
  sessionStorage.setItem(STORAGE_KEYS.CONVERSION_STAGES, JSON.stringify(stages));
  localStorage.setItem(STORAGE_KEYS.PERSISTENT_CONVERSION_STAGES, JSON.stringify(stages));

  // Track to database
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updatePayload = {
      conversion_type: stage,
      converted: true, // FIX: Always set converted to true for any non-visit stage
      user_id: user?.id || null, // Link conversion to user if authenticated
      metadata: {
        ...(metadata || {}),
        stages_reached: stages,
        stage_timestamp: new Date().toISOString(),
      },
    };

    // Try to update by user_id first (for returning authenticated users)
    if (user?.id) {
      // First find the most recent record
      const { data: existingRecord } = await supabase
        .from("deeplink_analytics")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRecord?.id) {
        const { error: updateError } = await supabase
          .from("deeplink_analytics")
          .update(updatePayload)
          .eq("id", existingRecord.id);

        if (!updateError) {
          deeplinkLogger.info("Conversion tracked via user_id", { stage, userId: user.id });
          return;
        }
        deeplinkLogger.debug("User-based update failed, trying session fallback", { error: String(updateError) });
      }
    }

    // Fallback: Update by persistent session ID
    const sessionToUse = persistentSessionId || sessionId;

    // First find the most recent record by session
    const { data: sessionRecord } = await supabase
      .from("deeplink_analytics")
      .select("id")
      .eq("session_id", sessionToUse)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionRecord?.id) {
      const { error } = await supabase.from("deeplink_analytics").update(updatePayload).eq("id", sessionRecord.id);

      if (!error) {
        deeplinkLogger.info("Conversion stage tracked via session", { stage, sessionId: sessionToUse });
        return;
      }
    }

    // If no existing record found, create new one for this conversion
    if (!sessionRecord?.id) {
      deeplinkLogger.info("No existing session found, creating new analytics entry for conversion", { stage });
      await supabase.from("deeplink_analytics").insert([
        {
          user_id: user?.id || null,
          session_id: sessionId,
          deeplink_type: "conversion_event",
          conversion_type: stage,
          converted: true, // FIX: Mark as converted
          source: "organic",
          metadata: {
            ...(metadata || {}),
            stages_reached: stages,
            stage_timestamp: new Date().toISOString(),
            is_conversion_only: true,
          },
        },
      ]);
      deeplinkLogger.info("New conversion entry created", { stage, sessionId });
    }
  } catch (error) {
    deeplinkLogger.warn("Failed to track conversion stage", { error: String(error) });
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

export function assignToExperiment(experimentId: string, variants: string[], weights?: number[]): string {
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

  deeplinkLogger.debug("Experiment assigned", { experimentId, variantId });
  return variantId;
}

// ==========================================
// Main Tracking Function
// ==========================================

/**
 * Track deeplink visit with graceful error handling
 * - Works for both anonymous and authenticated users
 * - Falls back to localStorage buffer on failure for retry after auth
 */
export async function trackDeeplinkVisit(context: DeeplinkContext): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const BUFFER_KEY = "deeplink_pending_tracks";

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        referral_chain: getReferralChain().join(","),
      } as Record<string, string | number | boolean | null>,
    };

    const { error } = await supabase.from("deeplink_analytics").insert([payload]);

    if (error) {
      // Buffer failed insert for retry after auth (RLS may block if unexpected)
      deeplinkLogger.debug("Deeplink insert failed, buffering for retry", {
        error: error.message,
        code: error.code,
      });

      try {
        const pending = JSON.parse(localStorage.getItem(BUFFER_KEY) || "[]");
        pending.push({ ...payload, buffered_at: new Date().toISOString() });
        // Keep only last 10 buffered entries to prevent storage bloat
        localStorage.setItem(BUFFER_KEY, JSON.stringify(pending.slice(-10)));
      } catch {
        // Silently fail localStorage operations in production
      }
      return;
    }

    // Track initial visit stage
    await trackConversionStage("visit");

    deeplinkLogger.info("Deeplink visit tracked", {
      type: context.type,
      source: context.source,
      sessionId,
    });

    // Clear any pending buffered entries after successful insert
    localStorage.removeItem(BUFFER_KEY);
  } catch (error) {
    // Graceful fallback - don't break app for analytics failures
    if (import.meta.env.DEV) {
      deeplinkLogger.warn("Failed to track deeplink visit", { error: String(error) });
    }
  }
}

/**
 * Flush buffered deeplink tracks after user authentication
 * Call this after successful login/signup
 */
export async function flushBufferedDeeplinkTracks(): Promise<void> {
  const BUFFER_KEY = "deeplink_pending_tracks";

  try {
    const pending = JSON.parse(localStorage.getItem(BUFFER_KEY) || "[]");
    if (pending.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Update buffered entries with user_id and insert
    for (const entry of pending) {
      const { buffered_at, ...payload } = entry;
      await supabase.from("deeplink_analytics").insert([
        {
          ...payload,
          user_id: user.id,
          metadata: {
            ...payload.metadata,
            originally_buffered_at: buffered_at,
            flushed_after_auth: true,
          },
        },
      ]);
    }

    localStorage.removeItem(BUFFER_KEY);
    deeplinkLogger.info("Flushed buffered deeplink tracks", { count: pending.length });
  } catch (error) {
    deeplinkLogger.debug("Failed to flush buffered tracks", { error: String(error) });
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
  timePeriod: string = "7 days",
): Promise<DeeplinkAnalyticsSummary | null> {
  try {
    // Calculate date range
    const now = new Date();
    const days = parseInt(timePeriod) || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch raw data
    const { data: events, error } = await supabase
      .from("deeplink_analytics")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      deeplinkLogger.error("Failed to fetch analytics", { error });
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
    const uniqueUsers = new Set(events.filter((e) => e.user_id).map((e) => e.user_id)).size;

    // Group by source
    const sourceGroups = events.reduce(
      (acc, e) => {
        const source = e.source || "unknown";
        if (!acc[source]) acc[source] = { total: 0, converted: 0 };
        acc[source].total++;
        if (e.converted) acc[source].converted++;
        return acc;
      },
      {} as Record<string, { total: number; converted: number }>,
    );

    const topSources = Object.entries(sourceGroups)
      .map(([source, stats]) => ({
        source,
        count: stats.total,
        conversion_rate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by campaign
    const campaignGroups = events.reduce(
      (acc, e) => {
        const campaign = e.campaign || "direct";
        if (!acc[campaign]) acc[campaign] = { total: 0, converted: 0 };
        acc[campaign].total++;
        if (e.converted) acc[campaign].converted++;
        return acc;
      },
      {} as Record<string, { total: number; converted: number }>,
    );

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
    events.forEach((e) => {
      const hour = new Date(e.created_at!).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // Daily trend
    const dailyGroups = events.reduce(
      (acc, e) => {
        const date = e.created_at!.split("T")[0];
        if (!acc[date]) acc[date] = { visits: 0, conversions: 0 };
        acc[date].visits++;
        if (e.converted) acc[date].conversions++;
        return acc;
      },
      {} as Record<string, { visits: number; conversions: number }>,
    );

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
    deeplinkLogger.error("Error in fetchDeeplinkAnalyticsSummary", { error: String(error) });
    return null;
  }
}

// ==========================================
// Context Management
// ==========================================

let currentContext: DeeplinkContext | null = null;

export function getDeeplinkContext(): DeeplinkContext | null {
  return currentContext;
}

export function setDeeplinkContext(context: DeeplinkContext): void {
  currentContext = context;
}

// ==========================================
// Initialization
// ==========================================


export async function initializeDeeplinkTracker(options: InitializeOptions): Promise<DeeplinkContext> {
  const utmParams = parseUTMParams(options.search);
  const firstVisit = isFirstVisit();
  const deviceInfo = collectDeviceInfo();

  // Determine source
  let source: DeeplinkSource = detectSource(options.referrer, utmParams);
  if (options.isTelegram) {
    source = "telegram_miniapp";
  }

  // Parse start param for type and value
  let type = "direct";
  let value: string | undefined;
  let referralCode: string | undefined;

  if (options.startParam) {
    const parts = options.startParam.split("_");
    type = parts[0] || "direct";
    value = parts.slice(1).join("_") || undefined;

    // Check if it's a referral
    if (type === "ref") {
      referralCode = value;
      addToReferralChain(value!);
    }
  }

  const context: DeeplinkContext = {
    type,
    value,
    source,
    utmParams: hasUTMParams(utmParams) ? utmParams : undefined,
    referrer: options.referrer,
    landingPath: options.pathname,
    referralCode,
    isFirstVisit: firstVisit,
    deviceInfo,
  };

  setDeeplinkContext(context);

  // Track the visit
  await trackDeeplinkVisit(context);

  return context;
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

export function buildDeeplinkUrl(botUsername: string, options: DeeplinkBuildOptions): string {
  const startParam = options.value ? `${options.type}_${options.value}` : options.type;

  const url = `https://t.me/${botUsername}/app?startapp=${startParam}`;

  // Add UTM params to landing page tracking
  const params = new URLSearchParams();
  if (options.utmParams) {
    Object.entries(options.utmParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  if (options.referralCode) {
    params.set("ref", options.referralCode);
  }
  if (options.experimentId && options.variantId) {
    params.set("exp", `${options.experimentId}:${options.variantId}`);
  }

  // Note: UTM params are tracked separately since Telegram doesn't pass URL params
  // We store them in the startParam when needed
  return url;
}
