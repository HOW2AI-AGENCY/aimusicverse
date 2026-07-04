/**
 * Analytics API Layer
 * Raw Supabase operations for analytics tracking
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// ==========================================
// Types
// ==========================================

export type EventType =
  | "page_view"
  | "generation_started"
  | "generation_completed"
  | "generation_failed"
  | "generation_metrics"
  | "track_played"
  | "track_liked"
  | "track_shared"
  | "feature_used"
  | "button_clicked"
  | "session_started"
  | "session_ended"
  | "onboarding_step"
  | "error_logged"
  // Paywall events
  | "paywall_view"
  | "paywall_trial_click"
  | "paywall_subscribe_click"
  | "paywall_dismiss";

export interface AnalyticsEvent {
  eventType: EventType;
  eventName?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
  sessionId: string;
  userId?: string;
}

export interface UserBehaviorStats {
  total_events: number;
  unique_sessions: number;
  unique_users: number;
  events_by_type: Record<string, number>;
  top_pages: Array<{ page_path: string; views: number }>;
  hourly_distribution: Record<string, number>;
}

export interface DeeplinkStats {
  total_clicks: number;
  unique_users: number;
  conversions: number;
  conversion_rate: number;
  top_sources: Array<{ source: string; count: number }>;
  top_types: Array<{ deeplink_type: string; count: number }>;
}

export interface DeeplinkEvent {
  id: string;
  user_id: string | null;
  session_id: string | null;
  deeplink_type: string;
  deeplink_value: string | null;
  source: string | null;
  campaign: string | null;
  referrer: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  converted: boolean;
  conversion_type: string | null;
}

export interface FunnelDropoffData {
  step_name: string;
  step_index: number;
  users_reached: number;
  users_dropped: number;
  conversion_rate: number;
  avg_duration_ms: number;
}

// ==========================================
// Analytics Events
// ==========================================

/**
 * Track an analytics event
 */
export async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const { error } = await supabase.from("user_analytics_events").insert([
    {
      user_id: event.userId || null,
      session_id: event.sessionId,
      event_type: event.eventType,
      event_name: event.eventName || null,
      page_path: event.pagePath || null,
      metadata: (event.metadata || {}) as Record<string, string | number | boolean | null>,
    },
  ]);

  if (error) throw new Error(error.message);
}

/**
 * Get user behavior statistics
 */
export async function fetchUserBehaviorStats(timePeriod: string = "7 days"): Promise<UserBehaviorStats | null> {
  const { data, error } = await supabase.rpc("get_user_behavior_stats", {
    _time_period: timePeriod,
  });
  if (error) throw new Error(error.message);
  return data?.[0] as UserBehaviorStats | null;
}

// ==========================================
// Deeplink Analytics
// ==========================================

/**
 * Track a deeplink visit
 */
export async function trackDeeplinkVisit(params: {
  deeplinkType: string;
  deeplinkValue?: string;
  source?: string;
  campaign?: string;
  referrer?: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("deeplink_analytics").insert([
    {
      user_id: params.userId || null,
      session_id: params.sessionId,
      deeplink_type: params.deeplinkType,
      deeplink_value: params.deeplinkValue || null,
      source: params.source || null,
      campaign: params.campaign || null,
      referrer: params.referrer || null,
      metadata: (params.metadata || {}) as Record<string, string | number | boolean | null>,
    },
  ]);

  if (error) throw new Error(error.message);
}

/**
 * Mark a deeplink conversion
 */
export async function markDeeplinkConversion(sessionId: string, conversionType: string): Promise<void> {
  const { error } = await supabase
    .from("deeplink_analytics")
    .update({
      converted: true,
      conversion_type: conversionType,
    })
    .eq("session_id", sessionId);

  if (error) throw new Error(error.message);
}

/**
 * Get deeplink statistics
 */
export async function fetchDeeplinkStats(timePeriod: string = "7 days"): Promise<DeeplinkStats | null> {
  const { data, error } = await supabase.rpc("get_deeplink_stats", {
    _time_period: timePeriod,
  });
  if (error) throw new Error(error.message);
  return data?.[0] as DeeplinkStats | null;
}

/**
 * Get deeplink events
 */
export async function fetchDeeplinkEvents(options: { timeRange?: string; limit?: number }): Promise<DeeplinkEvent[]> {
  const { timeRange = "7d", limit = 100 } = options;

  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case "1h":
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case "24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const { data, error } = await supabase
    .from("deeplink_analytics")
    .select("*")
    .gte("created_at", getTimeFilter())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data as DeeplinkEvent[];
}

// ==========================================
// Journey / Funnel Analytics
// ==========================================

/**
 * Track a journey step
 */
export async function trackJourneyStep(params: {
  userId: string;
  sessionId: string;
  funnelName: string;
  stepName: string;
  stepIndex: number;
  completed: boolean;
  durationFromPrevMs?: number;
  droppedOff?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from("user_journey_events").insert({
    user_id: params.userId,
    session_id: params.sessionId,
    funnel_name: params.funnelName,
    step_name: params.stepName,
    step_index: params.stepIndex,
    completed: params.completed,
    duration_from_prev_ms: params.durationFromPrevMs || null,
    dropped_off: params.droppedOff || false,
    metadata: (params.metadata || {}) as Json,
  });

  if (error) throw new Error(error.message);
}

/**
 * Get funnel dropoff statistics
 */
export async function fetchFunnelDropoffStats(funnelName: string, daysBack: number = 7): Promise<FunnelDropoffData[]> {
  const { data, error } = await supabase.rpc("get_funnel_dropoff_stats", {
    _funnel_name: funnelName,
    _days_back: daysBack,
  });

  if (error) throw new Error(error.message);

  return (data || []).map((row: Record<string, unknown>) => ({
    step_name: row.step_name as string,
    step_index: row.step_index as number,
    users_reached: Number(row.users_reached),
    users_dropped: Number(row.users_dropped),
    conversion_rate: Number(row.conversion_rate),
    avg_duration_ms: Number(row.avg_duration_ms),
  }));
}

// ==========================================
// Period comparison (admin/analytics)
// ==========================================

export interface PeriodMetricsRaw {
  newUsers: number;
  tracks: number;
  generations: Array<{ status: string | null }>;
  revenue: Array<{ stars_amount: number | null }>;
}

export interface PeriodComparisonRaw {
  current: PeriodMetricsRaw;
  previous: PeriodMetricsRaw;
}

/**
 * Aggregate raw metrics for two adjacent time windows.
 *
 * The component is responsible for computing derived KPIs (deltas, success
 * rates, etc.) — this function returns shape-friendly data so the same call
 * can power multiple dashboards.
 */
export async function fetchPeriodComparison(params: {
  currentStart: Date;
  previousStart: Date;
  previousEnd: Date;
}): Promise<PeriodComparisonRaw> {
  const { currentStart, previousStart, previousEnd } = params;

  const [{ count: currentNewUsers }, { count: currentTracks }, { data: currentGenerations }, { data: currentRevenue }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", currentStart.toISOString()),
      supabase.from("tracks").select("*", { count: "exact", head: true }).gte("created_at", currentStart.toISOString()),
      supabase.from("generation_tasks").select("status").gte("created_at", currentStart.toISOString()),
      supabase
        .from("stars_transactions")
        .select("stars_amount")
        .gte("created_at", currentStart.toISOString())
        .eq("status", "completed"),
    ]);

  const [{ count: prevNewUsers }, { count: prevTracks }, { data: prevGenerations }, { data: prevRevenue }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", previousStart.toISOString())
        .lt("created_at", previousEnd.toISOString()),
      supabase
        .from("tracks")
        .select("*", { count: "exact", head: true })
        .gte("created_at", previousStart.toISOString())
        .lt("created_at", previousEnd.toISOString()),
      supabase
        .from("generation_tasks")
        .select("status")
        .gte("created_at", previousStart.toISOString())
        .lt("created_at", previousEnd.toISOString()),
      supabase
        .from("stars_transactions")
        .select("stars_amount")
        .gte("created_at", previousStart.toISOString())
        .lt("created_at", previousEnd.toISOString())
        .eq("status", "completed"),
    ]);

  return {
    current: {
      newUsers: currentNewUsers ?? 0,
      tracks: currentTracks ?? 0,
      generations: (currentGenerations ?? []) as Array<{ status: string | null }>,
      revenue: (currentRevenue ?? []) as Array<{ stars_amount: number | null }>,
    },
    previous: {
      newUsers: prevNewUsers ?? 0,
      tracks: prevTracks ?? 0,
      generations: (prevGenerations ?? []) as Array<{ status: string | null }>,
      revenue: (prevRevenue ?? []) as Array<{ stars_amount: number | null }>,
    },
  };
}

// ==========================================
// Conversion funnel
// ==========================================

export interface FunnelMetricsRaw {
  totalSessions: number;
  generatingUsers: number;
  perUserTrackCounts: Array<{ user_id: string }>;
  payingUsers: number;
}

export async function fetchFunnelMetricsRaw(): Promise<FunnelMetricsRaw> {
  const { count: generatingUsers } = await supabase.from("tracks").select("user_id", { count: "exact", head: true });

  const { data: activeUsersData } = await supabase.from("tracks").select("user_id").limit(10000);

  const { count: payingUsers } = await supabase
    .from("stars_transactions")
    .select("user_id", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: totalSessions } = await supabase
    .from("telemetry_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "session_started");

  return {
    totalSessions: totalSessions ?? 0,
    generatingUsers: generatingUsers ?? 0,
    perUserTrackCounts: (activeUsersData ?? []) as Array<{ user_id: string }>,
    payingUsers: payingUsers ?? 0,
  };
}

// ==========================================
// Real-time admin metrics
// ==========================================

export interface RealTimeMetricsRaw {
  recentEvents: Array<{ created_at: string | null }>;
  generationsInProgress: number;
  activeSessions: Array<{ session_id: string | null }>;
  newTracksToday: number;
}

export async function fetchRealTimeMetricsRaw(params: {
  oneMinuteAgo: Date;
  fifteenMinutesAgo: Date;
  todayStart: Date;
}): Promise<RealTimeMetricsRaw> {
  const { oneMinuteAgo, fifteenMinutesAgo, todayStart } = params;

  const [recentEventsResult, generationsResult, activeSessionsResult, newTracksResult] = await Promise.all([
    supabase
      .from("user_analytics_events")
      .select("created_at")
      .gte("created_at", oneMinuteAgo.toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("generation_tasks").select("id").in("status", ["pending", "processing"]),
    supabase.from("user_analytics_events").select("session_id").gte("created_at", fifteenMinutesAgo.toISOString()),
    supabase.from("tracks").select("id").gte("created_at", todayStart.toISOString()).eq("status", "completed"),
  ]);

  return {
    recentEvents: (recentEventsResult.data ?? []) as Array<{ created_at: string | null }>,
    generationsInProgress: generationsResult.data?.length ?? 0,
    activeSessions: (activeSessionsResult.data ?? []) as Array<{ session_id: string | null }>,
    newTracksToday: newTracksResult.data?.length ?? 0,
  };
}

/**
 * Subscribe to realtime activity that should refresh admin "live" widgets.
 * Returns an unsubscribe function — consumers MUST call it on cleanup.
 */
export function subscribeToRealtimeAdminMetrics(onChange: () => void): () => void {
  const channel = supabase
    .channel("realtime-metrics")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_analytics_events" }, () => onChange())
    .on("postgres_changes", { event: "*", schema: "public", table: "generation_tasks" }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ==========================================
// Revenue analytics (stars_transactions)
// ==========================================

export interface RevenueAnalyticsRaw {
  current: Array<{
    created_at: string | null;
    stars_amount: number | null;
    user_id: string;
    product_code: string | null;
  }>;
  previousSum: number;
  newUsersInRange: number;
}

export async function fetchRevenueAnalyticsRaw(params: {
  startDate: Date;
  previousStart: Date;
}): Promise<RevenueAnalyticsRaw> {
  const { startDate, previousStart } = params;

  const [transactionsResult, previousResult, usersResult] = await Promise.all([
    supabase
      .from("stars_transactions")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .eq("status", "completed"),
    supabase
      .from("stars_transactions")
      .select("stars_amount")
      .gte("created_at", previousStart.toISOString())
      .lt("created_at", startDate.toISOString())
      .eq("status", "completed"),
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString()),
  ]);

  const previousSum = (previousResult.data ?? []).reduce((sum, t) => sum + (t.stars_amount ?? 0), 0);

  return {
    current: (transactionsResult.data ?? []) as Array<{
      created_at: string | null;
      stars_amount: number | null;
      user_id: string;
      product_code: string | null;
    }>,
    previousSum,
    newUsersInRange: usersResult.count ?? 0,
  };
}
