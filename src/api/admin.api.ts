/**
 * Admin API Layer
 * Raw Supabase operations for admin functionality
 */

import { supabase } from "@/integrations/supabase/client";

// ==========================================
// Types
// ==========================================

export interface UserBalanceSummary {
  total_users: number;
  total_balance: number;
  total_earned: number;
  total_spent: number;
  avg_balance: number;
  users_with_zero_balance: number;
  users_low_balance: number;
}

export interface BotMetrics {
  total_events: number;
  successful_events: number;
  failed_events: number;
  success_rate: number;
  avg_response_time_ms: number;
  events_by_type: Record<string, number>;
}

export interface UserWithBalance {
  user_id: string;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  level: number;
  experience: number;
  current_streak: number;
}

// ==========================================
// Admin Role Check
// ==========================================

/**
 * Check if user has admin role
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (error) throw new Error(error.message);
  return !!data;
}

/**
 * Get current user admin status
 */
export async function getCurrentUserAdminStatus(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, userId: null };

  const isAdmin = await checkAdminRole(user.id);
  return { isAdmin, userId: user.id };
}

// ==========================================
// User Balance Operations
// ==========================================

/**
 * Fetch user balance summary for admin dashboard
 */
export async function fetchUserBalanceSummary(): Promise<UserBalanceSummary | null> {
  const { data, error } = await supabase.rpc("get_user_balance_summary");
  if (error) throw new Error(error.message);
  return (data?.[0] as UserBalanceSummary) || null;
}

/**
 * Fetch users with their balances
 */
export async function fetchUsersWithBalances(options: {
  limit?: number;
  orderBy?: "balance" | "created_at";
}): Promise<UserWithBalance[]> {
  const { limit = 100, orderBy = "created_at" } = options;

  // First get profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "user_id, username, first_name, last_name, photo_url, subscription_tier, subscription_expires_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (profilesError) throw new Error(profilesError.message);

  // Then get credits for these users
  const userIds = profiles?.map((p) => p.user_id) || [];
  const { data: credits, error: creditsError } = await supabase
    .from("user_credits")
    .select("user_id, balance, total_earned, total_spent, level, experience, current_streak")
    .in("user_id", userIds);

  if (creditsError) throw new Error(creditsError.message);

  // Merge the data
  const mergedData =
    profiles?.map((profile) => {
      const userCredits = credits?.find((c) => c.user_id === profile.user_id);
      return {
        ...profile,
        balance: userCredits?.balance || 0,
        total_earned: userCredits?.total_earned || 0,
        total_spent: userCredits?.total_spent || 0,
        level: userCredits?.level || 1,
        experience: userCredits?.experience || 0,
        current_streak: userCredits?.current_streak || 0,
      };
    }) || [];

  // Sort by balance if needed
  if (orderBy === "balance") {
    mergedData.sort((a, b) => b.balance - a.balance);
  }

  return mergedData;
}

// ==========================================
// Bot Metrics
// ==========================================

/**
 * Fetch Telegram bot metrics
 */
export async function fetchBotMetrics(period: string = "24 hours"): Promise<BotMetrics | null> {
  const { data, error } = await supabase.rpc("get_telegram_bot_metrics", {
    _time_period: period,
  });

  if (error) throw new Error(error.message);
  return (data?.[0] as BotMetrics) || null;
}

/**
 * Fetch recent bot metric events
 */
export async function fetchRecentBotEvents(limit: number = 50) {
  const { data, error } = await supabase
    .from("telegram_bot_metrics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data;
}

// ==========================================
// User Feedback
// ==========================================

export async function fetchUserFeedback(options: { status?: string; limit?: number } = {}) {
  const { status, limit = 50 } = options;
  let query = supabase.from("user_feedback").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function closeFeedbackItem(id: string) {
  const { error } = await supabase.from("user_feedback").update({ status: "closed" }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ==========================================
// Content Moderation
// ==========================================

export async function reportContent(params: {
  reporterId: string;
  reportedUserId: string;
  entityType: string;
  entityId: string;
  reason: string;
  details?: string;
}) {
  const { data, error } = await supabase
    .from("moderation_reports")
    .insert({
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      reason: params.reason,
      details: params.details ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ==========================================
// Quick Actions (broadcasts, bulk credits)
// ==========================================

/**
 * Invoke the Telegram bot broadcast edge function.
 */
export async function invokeAdminBroadcast(payload: {
  title: string;
  message: string;
  target_type?: "all" | "active" | "premium";
}): Promise<{ sent_count?: number } & Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("telegram-bot", {
    body: {
      action: "broadcast",
      target_type: payload.target_type ?? "all",
      title: payload.title,
      message: payload.message,
    },
  });
  if (error) throw new Error(error.message);
  return (data as { sent_count?: number } & Record<string, unknown>) ?? {};
}

/**
 * Send an admin-authored message to a list of selected users via the
 * send-admin-message edge function. The server resolves telegram_chat_id
 * using its service-role key; the client only passes user_ids.
 */
export async function invokeSendAdminMessage(payload: {
  userIds: string[];
  title?: string;
  message: string;
}): Promise<{ sent?: number } & Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("send-admin-message", {
    body: {
      user_ids: payload.userIds,
      title: payload.title,
      message: payload.message,
    },
  });
  if (error) throw new Error(error.message);
  return (data as { sent?: number } & Record<string, unknown>) ?? {};
}

// ==========================================
// Generation Statistics
// ==========================================

export interface UserGenerationStatRow {
  user_id: string;
  date: string;
  generations_count: number | null;
  successful_count: number | null;
  failed_count: number | null;
  music_count: number | null;
  vocals_count: number | null;
  instrumental_count: number | null;
  extend_count: number | null;
  stems_count: number | null;
  cover_count: number | null;
  estimated_cost: number | string | null;
  credits_spent: number | null;
}

/**
 * Fetch raw per-user generation stats for a window ending today.
 */
export async function fetchUserGenerationStats(params: { startDate: Date }): Promise<UserGenerationStatRow[]> {
  const startDateStr = params.startDate.toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("user_generation_stats")
    .select(
      "user_id, date, generations_count, successful_count, failed_count, music_count, vocals_count, instrumental_count, extend_count, stems_count, cover_count, estimated_cost, credits_spent",
    )
    .gte("date", startDateStr);
  if (error) throw new Error(error.message);
  return (data || []) as UserGenerationStatRow[];
}

/**
 * Fetch profile fragments for a list of user IDs — used to enrich the
 * generation top-users list with names and avatars.
 */
export async function fetchProfilesSummary(
  userIds: string[],
): Promise<Array<{ user_id: string; first_name: string; username: string | null; photo_url: string | null }>> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, first_name, username, photo_url")
    .in("user_id", userIds);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ==========================================
// System health / alerts
// ==========================================

/**
 * Trigger the health-alert edge function. Body can be `{ test: true }` to
 * send a test alert, `{ force: true }` to bypass health gating, or empty
 * to send only when the system is unhealthy.
 */
export async function invokeHealthAlert(payload: {
  test?: boolean;
  force?: boolean;
}): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("health-alert", {
    body: payload,
  });
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>) ?? {};
}

// ==========================================
// Today's generation tasks (monitoring hub)
// ==========================================

export interface TodayGenerationStats {
  total: number;
  completed: number;
  failed: number;
  successRate: number;
}

/**
 * Fetch today's generation_tasks and roll up counts for the monitoring hub.
 */
export async function fetchTodayGenerationStats(todayStart: Date): Promise<TodayGenerationStats> {
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("status")
    .gte("created_at", todayStart.toISOString());
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const total = rows.length;
  const completed = rows.filter((r) => r.status === "completed").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const successRate = total > 0 ? (completed / total) * 100 : 100;
  return { total, completed, failed, successRate };
}

/**
 * Invoke the `health-check` edge function and return the raw payload.
 * The caller decides how to shape the response into UI status fields.
 */
export async function invokeHealthCheck(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("health-check");
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>) ?? {};
}

// ==========================================
// Payment cohort analytics
// ==========================================

export interface CompletedTransactionRow {
  user_id: string;
  created_at: string | null;
  stars_amount: number | null;
}

/**
 * Fetch completed stars_transactions in the given window. Used by the
 * payment-cohort analytics component to bucket paying users by month.
 */
export async function fetchCompletedStarsTransactions(params: { startDate: Date }): Promise<CompletedTransactionRow[]> {
  const { data, error } = await supabase
    .from("stars_transactions")
    .select("user_id, created_at, stars_amount")
    .gte("created_at", params.startDate.toISOString())
    .eq("status", "completed");
  if (error) throw new Error(error.message);
  return (data ?? []) as CompletedTransactionRow[];
}

/**
 * Fetch the list of all users with current credit balances —
 * used by bulk-credit admin actions.
 */
export async function fetchAllUserCreditsList(): Promise<
  Array<{ user_id: string; balance: number; total_earned: number }>
> {
  const { data, error } = await supabase.from("user_credits").select("user_id, balance, total_earned");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Bulk-award credits to every user that has a credits row, recording a
 * matching `credit_transactions` entry per user.
 *
 * NB: this is a thin wrapper around the original direct-update path; a future
 * migration should move the work into a security-definer RPC so it executes
 * server-side in a single transaction.
 */
export async function bulkAwardCredits(params: {
  amount: number;
  reason?: string;
}): Promise<{ amount: number; count: number }> {
  const users = await fetchAllUserCreditsList();

  for (const u of users) {
    const { error: updateError } = await supabase
      .from("user_credits")
      .update({
        balance: u.balance + params.amount,
        total_earned: (u.total_earned ?? 0) + params.amount,
      })
      .eq("user_id", u.user_id);
    if (updateError) throw new Error(updateError.message);

    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id: u.user_id,
      amount: params.amount,
      transaction_type: "earn",
      action_type: "admin_bulk_bonus",
      description: params.reason || "Бонус от администрации",
    });
    if (txError) throw new Error(txError.message);
  }

  return { amount: params.amount, count: users.length };
}

// ==========================================
// Telegram bot config (menu images)
// ==========================================

export type BotMenuImagesConfig = Record<string, string>;

export async function fetchBotMenuImagesConfig(): Promise<BotMenuImagesConfig> {
  const { data, error } = await supabase
    .from("telegram_bot_config")
    .select("*")
    .eq("config_key", "menu_images")
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return ((data?.config_value as BotMenuImagesConfig) || {}) ?? {};
}

export async function upsertBotMenuImagesConfig(params: {
  images: BotMenuImagesConfig;
  updatedBy: string;
}): Promise<void> {
  const { error } = await supabase.from("telegram_bot_config").upsert(
    {
      config_key: "menu_images",
      config_value: params.images,
      description: "Изображения меню бота",
      updated_at: new Date().toISOString(),
      updated_by: params.updatedBy,
    },
    { onConflict: "config_key" },
  );
  if (error) throw new Error(error.message);
}

// ==========================================
// Content analytics (tracks)
// ==========================================

export interface CompletedTrackRow {
  computed_genre: string | null;
  computed_mood: string | null;
  style: string | null;
  tags: string | null;
  lyrics_language: string | null;
  duration_seconds: number | null;
  lyrics: string | null;
  is_public: boolean | null;
  status: string | null;
}

/**
 * Fetch completed tracks for content-analytics roll-ups (genre / mood /
 * language / tags / instrumental ratio).
 */
export async function fetchCompletedTracksForContentAnalytics(params: {
  startDate: Date;
}): Promise<CompletedTrackRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("computed_genre, computed_mood, style, tags, lyrics_language, duration_seconds, lyrics, is_public, status")
    .gte("created_at", params.startDate.toISOString())
    .eq("status", "completed");
  if (error) throw new Error(error.message);
  return (data ?? []) as CompletedTrackRow[];
}

// ==========================================
// Forecast panel — daily series for users / revenue / generations / tracks
// ==========================================

export interface ProfileSignupRow {
  created_at: string;
}

export interface StarsTransactionRevenueRow {
  created_at: string;
  stars_amount: number | null;
}

export interface GenerationTaskCreatedRow {
  created_at: string;
}

export interface TrackCreatedRow {
  created_at: string;
}

/**
 * Fetch profile signups within a window (used to forecast new-user growth).
 */
export async function fetchProfileSignupsForForecast(params: { startDate: Date }): Promise<ProfileSignupRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", params.startDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProfileSignupRow[];
}

/**
 * Fetch completed stars_transactions within a window (revenue forecast).
 */
export async function fetchCompletedStarsRevenueForForecast(params: {
  startDate: Date;
}): Promise<StarsTransactionRevenueRow[]> {
  const { data, error } = await supabase
    .from("stars_transactions")
    .select("created_at, stars_amount")
    .gte("created_at", params.startDate.toISOString())
    .eq("status", "completed")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StarsTransactionRevenueRow[];
}

/**
 * Fetch generation_tasks created within a window (generation forecast).
 */
export async function fetchGenerationTaskCreatedForForecast(params: {
  startDate: Date;
}): Promise<GenerationTaskCreatedRow[]> {
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("created_at")
    .gte("created_at", params.startDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as GenerationTaskCreatedRow[];
}

/**
 * Fetch tracks created within a window (track forecast).
 */
export async function fetchTracksCreatedForForecast(params: { startDate: Date }): Promise<TrackCreatedRow[]> {
  const { data, error } = await supabase
    .from("tracks")
    .select("created_at")
    .gte("created_at", params.startDate.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TrackCreatedRow[];
}

// ==========================================
// User activity heatmap
// ==========================================

export interface AnalyticsEventCreatedRow {
  created_at: string | null;
}

/**
 * Fetch analytics event timestamps used by the heatmap component to
 * aggregate activity per (weekday x hour) bucket.
 */
export async function fetchAnalyticsEventsForHeatmap(params: { startDate: Date }): Promise<AnalyticsEventCreatedRow[]> {
  const { data, error } = await supabase
    .from("user_analytics_events")
    .select("created_at")
    .gte("created_at", params.startDate.toISOString());
  if (error) throw new Error(error.message);
  return (data ?? []) as AnalyticsEventCreatedRow[];
}
