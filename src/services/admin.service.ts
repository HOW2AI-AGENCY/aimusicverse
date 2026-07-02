/**
 * Admin Service Layer
 * Business logic for admin operations
 */

import * as adminApi from "@/api/admin.api";
import type { UserBalanceSummary, BotMetrics, UserWithBalance } from "@/api/admin.api";

// ==========================================
// Types
// ==========================================

export interface AdminDashboardData {
  userStats: UserBalanceSummary | null;
  botMetrics: BotMetrics | null;
  topUsers: UserWithBalance[];
}

export interface TimeRange {
  label: string;
  value: "1h" | "24h" | "7d" | "30d";
  interval: string;
}

// ==========================================
// Time Range Helpers
// ==========================================

export const TIME_RANGES: TimeRange[] = [
  { label: "1 час", value: "1h", interval: "1 hour" },
  { label: "24 часа", value: "24h", interval: "24 hours" },
  { label: "7 дней", value: "7d", interval: "7 days" },
  { label: "30 дней", value: "30d", interval: "30 days" },
];

export function getIntervalFromTimeRange(timeRange: string): string {
  switch (timeRange) {
    case "1h":
      return "1 hour";
    case "24h":
      return "24 hours";
    case "7d":
      return "7 days";
    case "30d":
      return "30 days";
    default:
      return "24 hours";
  }
}

// ==========================================
// Admin Dashboard
// ==========================================

/**
 * Get complete admin dashboard data
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [userStats, botMetrics, topUsers] = await Promise.all([
    adminApi.fetchUserBalanceSummary(),
    adminApi.fetchBotMetrics("24 hours"),
    adminApi.fetchUsersWithBalances({ limit: 10, orderBy: "balance" }),
  ]);

  return {
    userStats,
    botMetrics,
    topUsers,
  };
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { isAdmin } = await adminApi.getCurrentUserAdminStatus();
  return isAdmin;
}

// ==========================================
// Admin messaging
// ==========================================

/**
 * Send an admin-authored message to a list of selected users.
 *
 * Returns the number of recipients the server reported as sent. When the
 * server omits the count we fall back to the request size so the caller can
 * still display a meaningful toast.
 */
export async function sendAdminMessageToUsers(payload: {
  userIds: string[];
  title?: string;
  message: string;
}): Promise<{ sent: number }> {
  const data = await adminApi.invokeSendAdminMessage({
    userIds: payload.userIds,
    title: payload.title,
    message: payload.message,
  });
  const sent = (data as { sent?: number }).sent ?? payload.userIds.length;
  return { sent };
}

// ==========================================
// Subscription management (admin)
// ==========================================

import { updateUserProfile } from "@/api/profiles.api";
import { insertCreditTransaction } from "@/api/payments.api";

/**
 * Change a user's subscription tier (admin operation).
 *
 * Updates `subscription_tier` and `subscription_expires_at` on the user's
 * profile, then records a `credit_transactions` row describing the change
 * so the action is visible in audit logs.
 */
export async function changeUserSubscriptionTier(payload: {
  userId: string;
  tier: string;
  expiresAt: string | null;
  currentTier?: string;
  reason?: string;
}): Promise<void> {
  const updates: {
    subscription_tier: string;
    updated_at: string;
    subscription_expires_at?: string | null;
  } = {
    subscription_tier: payload.tier,
    updated_at: new Date().toISOString(),
  };

  if (payload.tier !== "free" && payload.expiresAt) {
    updates.subscription_expires_at = new Date(payload.expiresAt).toISOString();
  } else if (payload.tier === "free") {
    updates.subscription_expires_at = null;
  }

  await updateUserProfile(payload.userId, updates);

  await insertCreditTransaction({
    user_id: payload.userId,
    amount: 0,
    transaction_type: "admin_action",
    action_type: "subscription_change",
    description: `Подписка изменена на ${payload.tier}${payload.reason ? `: ${payload.reason}` : ""}`,
    metadata: {
      old_tier: payload.currentTier ?? null,
      new_tier: payload.tier,
      expires_at: payload.expiresAt ?? null,
      reason: payload.reason ?? null,
    },
  });
}

// ==========================================
// Generation Statistics
// ==========================================

export interface AggregatedGenerationStats {
  total_generations: number;
  total_successful: number;
  total_failed: number;
  total_music: number;
  total_vocals: number;
  total_instrumental: number;
  total_extend: number;
  total_stems: number;
  total_cover: number;
  total_cost: number;
  total_credits_spent: number;
  unique_users: number;
  avg_per_user: number;
}

export interface DailyGenerationStats {
  date: string;
  generations_count: number;
  successful_count: number;
  failed_count: number;
  music_count: number;
  vocals_count: number;
  instrumental_count: number;
  extend_count: number;
  stems_count: number;
  cover_count: number;
  estimated_cost: number;
  credits_spent: number;
}

export interface TopGenerationUser {
  user_id: string;
  first_name: string;
  username: string | null;
  photo_url: string | null;
  total_generations: number;
  total_cost: number;
}

/**
 * Aggregate the raw per-user generation stats rows into a single
 * summary record. Pure function — easy to test in isolation.
 */
export function aggregateGenerationStats(rows: adminApi.UserGenerationStatRow[]): AggregatedGenerationStats {
  const aggregated: AggregatedGenerationStats = {
    total_generations: 0,
    total_successful: 0,
    total_failed: 0,
    total_music: 0,
    total_vocals: 0,
    total_instrumental: 0,
    total_extend: 0,
    total_stems: 0,
    total_cover: 0,
    total_cost: 0,
    total_credits_spent: 0,
    unique_users: new Set(rows.map((r) => r.user_id)).size,
    avg_per_user: 0,
  };

  rows.forEach((row) => {
    aggregated.total_generations += row.generations_count || 0;
    aggregated.total_successful += row.successful_count || 0;
    aggregated.total_failed += row.failed_count || 0;
    aggregated.total_music += row.music_count || 0;
    aggregated.total_vocals += row.vocals_count || 0;
    aggregated.total_instrumental += row.instrumental_count || 0;
    aggregated.total_extend += row.extend_count || 0;
    aggregated.total_stems += row.stems_count || 0;
    aggregated.total_cover += row.cover_count || 0;
    aggregated.total_cost += Number(row.estimated_cost) || 0;
    aggregated.total_credits_spent += row.credits_spent || 0;
  });

  aggregated.avg_per_user = aggregated.unique_users > 0 ? aggregated.total_generations / aggregated.unique_users : 0;

  return aggregated;
}

/**
 * Group raw rows into per-day rolled-up records (sorted desc by date).
 */
export function groupGenerationStatsByDay(rows: adminApi.UserGenerationStatRow[]): DailyGenerationStats[] {
  const byDate = new Map<string, DailyGenerationStats>();

  rows.forEach((row) => {
    const existing = byDate.get(row.date) || {
      date: row.date,
      generations_count: 0,
      successful_count: 0,
      failed_count: 0,
      music_count: 0,
      vocals_count: 0,
      instrumental_count: 0,
      extend_count: 0,
      stems_count: 0,
      cover_count: 0,
      estimated_cost: 0,
      credits_spent: 0,
    };

    existing.generations_count += row.generations_count || 0;
    existing.successful_count += row.successful_count || 0;
    existing.failed_count += row.failed_count || 0;
    existing.music_count += row.music_count || 0;
    existing.vocals_count += row.vocals_count || 0;
    existing.instrumental_count += row.instrumental_count || 0;
    existing.extend_count += row.extend_count || 0;
    existing.stems_count += row.stems_count || 0;
    existing.cover_count += row.cover_count || 0;
    existing.estimated_cost += Number(row.estimated_cost) || 0;
    existing.credits_spent += row.credits_spent || 0;

    byDate.set(row.date, existing);
  });

  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get aggregated generation stats for the last `days` days.
 */
export async function getAggregatedGenerationStats(days: number): Promise<AggregatedGenerationStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const rows = await adminApi.fetchUserGenerationStats({ startDate });
  return aggregateGenerationStats(rows);
}

/**
 * Get daily-rolled-up generation stats for the last `days` days.
 */
export async function getDailyGenerationStats(days: number): Promise<DailyGenerationStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const rows = await adminApi.fetchUserGenerationStats({ startDate });
  return groupGenerationStatsByDay(rows);
}

/**
 * Get the top-N (default 10) users by generation count for the last `days`.
 * Enriches each user with their public profile fields.
 */
export async function getTopGenerationUsers(days: number, limit: number = 10): Promise<TopGenerationUser[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const rows = await adminApi.fetchUserGenerationStats({ startDate });

  const userTotals = new Map<string, { generations: number; cost: number }>();
  rows.forEach((row) => {
    const existing = userTotals.get(row.user_id) || { generations: 0, cost: 0 };
    existing.generations += row.generations_count || 0;
    existing.cost += Number(row.estimated_cost) || 0;
    userTotals.set(row.user_id, existing);
  });

  const topUserIds = Array.from(userTotals.entries())
    .sort((a, b) => b[1].generations - a[1].generations)
    .slice(0, limit)
    .map(([id]) => id);

  if (topUserIds.length === 0) return [];

  const profiles = await adminApi.fetchProfilesSummary(topUserIds);
  return topUserIds.map((userId) => {
    const profile = profiles.find((p) => p.user_id === userId);
    const totals = userTotals.get(userId)!;
    return {
      user_id: userId,
      first_name: profile?.first_name || "Unknown",
      username: profile?.username ?? null,
      photo_url: profile?.photo_url ?? null,
      total_generations: totals.generations,
      total_cost: totals.cost,
    };
  });
}

// ==========================================
// User Management
// ==========================================

/**
 * Get users filtered by balance criteria
 * Single source of truth for balance-based user queries
 */
export async function getUsersByBalance(
  min: number,
  max: number,
  options?: { excludeZero?: boolean },
): Promise<UserWithBalance[]> {
  const users = await adminApi.fetchUsersWithBalances({ limit: 500, orderBy: "balance" });
  return users.filter((u) => {
    if (options?.excludeZero && u.balance === 0) return false;
    return u.balance >= min && u.balance <= max;
  });
}

/**
 * Get users with low balance for potential campaigns
 * @deprecated Use getUsersByBalance(0, threshold, { excludeZero: true }) instead
 */
export async function getLowBalanceUsers(threshold: number = 10): Promise<UserWithBalance[]> {
  return getUsersByBalance(0, threshold, { excludeZero: true });
}

/**
 * Get users with zero balance
 * @deprecated Use getUsersByBalance(0, 0) instead
 */
export async function getZeroBalanceUsers(): Promise<UserWithBalance[]> {
  return getUsersByBalance(0, 0);
}

/**
 * Calculate user churn risk based on activity
 */
export function calculateChurnRisk(user: UserWithBalance): "low" | "medium" | "high" {
  // Low balance and no streak = high risk
  if (user.balance <= 5 && user.current_streak === 0) {
    return "high";
  }

  // Low balance but has streak = medium risk
  if (user.balance <= 10) {
    return "medium";
  }

  return "low";
}

// ==========================================
// Bot Metrics Analysis
// ==========================================

/**
 * Analyze bot health from metrics
 */
export function analyzeBotHealth(metrics: BotMetrics): {
  status: "healthy" | "degraded" | "critical";
  issues: string[];
} {
  const issues: string[] = [];

  if (metrics.success_rate < 95) {
    issues.push(`Low success rate: ${metrics.success_rate.toFixed(1)}%`);
  }

  if (metrics.avg_response_time_ms > 5000) {
    issues.push(`High response time: ${metrics.avg_response_time_ms}ms`);
  }

  if (metrics.failed_events > metrics.successful_events * 0.1) {
    issues.push("High failure rate detected");
  }

  let status: "healthy" | "degraded" | "critical" = "healthy";
  if (issues.length > 0) status = "degraded";
  if (issues.length > 2 || metrics.success_rate < 80) status = "critical";

  return { status, issues };
}

// Re-export API functions for convenience
export {
  checkAdminRole,
  getCurrentUserAdminStatus,
  fetchUserBalanceSummary,
  fetchUsersWithBalances,
  fetchBotMetrics,
  fetchRecentBotEvents,
} from "@/api/admin.api";
