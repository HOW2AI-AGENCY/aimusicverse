/**
 * Admin Service Layer
 * Business logic for admin operations
 */

import * as adminApi from '@/api/admin.api';
import type { UserBalanceSummary, BotMetrics, UserWithBalance } from '@/api/admin.api';

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
  value: '1h' | '24h' | '7d' | '30d';
  interval: string;
}

// ==========================================
// Time Range Helpers
// ==========================================

export const TIME_RANGES: TimeRange[] = [
  { label: '1 час', value: '1h', interval: '1 hour' },
  { label: '24 часа', value: '24h', interval: '24 hours' },
  { label: '7 дней', value: '7d', interval: '7 days' },
  { label: '30 дней', value: '30d', interval: '30 days' },
];

export function getIntervalFromTimeRange(timeRange: string): string {
  switch (timeRange) {
    case '1h': return '1 hour';
    case '24h': return '24 hours';
    case '7d': return '7 days';
    case '30d': return '30 days';
    default: return '24 hours';
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
    adminApi.fetchBotMetrics('24 hours'),
    adminApi.fetchUsersWithBalances({ limit: 10, orderBy: 'balance' }),
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
// User Management
// ==========================================

/**
 * Get users with low balance for potential campaigns
 */
export async function getLowBalanceUsers(threshold: number = 10): Promise<UserWithBalance[]> {
  const users = await adminApi.fetchUsersWithBalances({ limit: 500, orderBy: 'balance' });
  return users.filter(u => u.balance > 0 && u.balance < threshold);
}

/**
 * Get users with zero balance
 */
export async function getZeroBalanceUsers(): Promise<UserWithBalance[]> {
  const users = await adminApi.fetchUsersWithBalances({ limit: 500, orderBy: 'balance' });
  return users.filter(u => u.balance === 0);
}

/**
 * Calculate user churn risk based on activity
 */
export function calculateChurnRisk(user: UserWithBalance): 'low' | 'medium' | 'high' {
  // Low balance and no streak = high risk
  if (user.balance <= 5 && user.current_streak === 0) {
    return 'high';
  }
  
  // Low balance but has streak = medium risk
  if (user.balance <= 10) {
    return 'medium';
  }
  
  return 'low';
}

// ==========================================
// Bot Metrics Analysis
// ==========================================

/**
 * Analyze bot health from metrics
 */
export function analyzeBotHealth(metrics: BotMetrics): {
  status: 'healthy' | 'degraded' | 'critical';
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
    issues.push('High failure rate detected');
  }
  
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (issues.length > 0) status = 'degraded';
  if (issues.length > 2 || metrics.success_rate < 80) status = 'critical';
  
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
} from '@/api/admin.api';
