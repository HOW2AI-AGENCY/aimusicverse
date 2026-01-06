// @ts-nocheck
/**
 * Dashboard API Usage Examples
 *
 * This file demonstrates how to use the dashboard API client
 * in various contexts (components, hooks, services)
 */

import {
  getDashboardStats,
  formatBytes,
  formatDuration,
  calculateStoragePercentage,
  isStorageNearLimit,
  dashboardQueryKeys,
  DASHBOARD_STALE_TIME,
  DASHBOARD_CACHE_TIME,
  type DashboardStats,
} from '@/api/dashboard.api';
import { useQuery } from '@tanstack/react-query';

// ==========================================
// React Hook Example
// ==========================================

/**
 * Custom hook for fetching dashboard stats
 * Integrates with TanStack Query for caching and state management
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const { data, isLoading, error } = useDashboardStats('user-123');
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return <DashboardView stats={data} />;
 * }
 * ```
 */
export function useDashboardStats(userId: string) {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(userId),
    queryFn: () => getDashboardStats(userId),
    select: (response) => response.data,
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_CACHE_TIME * 2,
    enabled: !!userId, // Only run query if userId exists
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// ==========================================
// Component Example
// ==========================================

/**
 * Dashboard statistics display component
 * Shows formatted dashboard metrics
 */
export function DashboardStatsComponent({ userId }: { userId: string }) {
  const { data: stats, isLoading, error } = useDashboardStats(userId);

  if (isLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-error">Error: {error.message}</div>;
  }

  if (!stats) {
    return <div className="text-muted">No dashboard data available</div>;
  }

  const storageWarning = isStorageNearLimit(stats.storage.percentage);

  return (
    <div className="dashboard-stats">
      {/* Track Statistics */}
      <section>
        <h2>Tracks</h2>
        <div>Total: {stats.tracks.total}</div>
        <div>Published: {stats.tracks.published}</div>
        <div>Drafts: {stats.tracks.drafts}</div>
      </section>

      {/* Storage Statistics */}
      <section>
        <h2>Storage</h2>
        <div className={storageWarning ? 'text-warning' : ''}>
          {formatBytes(stats.storage.used)} of {formatBytes(stats.storage.limit)}
          ({stats.storage.percentage}%)
        </div>
        {storageWarning && (
          <div className="warning-badge">
            Storage nearly full! Consider upgrading your plan.
          </div>
        )}
      </section>

      {/* Recording Statistics */}
      <section>
        <h2>Recordings</h2>
        <div>Total: {stats.recordings.total}</div>
        <div>Total Duration: {formatDuration(stats.recordings.totalDuration)}</div>
      </section>

      {/* Preset Statistics */}
      <section>
        <h2>Presets</h2>
        <div>Custom Presets: {stats.presets.custom}</div>
        {stats.presets.favorite && (
          <div>Favorite: {stats.presets.favorite}</div>
        )}
      </section>
    </div>
  );
}

// ==========================================
// Service Layer Example
// ==========================================

/**
 * Dashboard service with business logic
 * Combines raw API calls with additional processing
 */
export class DashboardService {
  /**
   * Get dashboard stats with computed insights
   */
  static async getDashboardWithInsights(userId: string) {
    const response = await getDashboardStats(userId);

    if (response.error || !response.data) {
      return response;
    }

    const stats = response.data;

    // Compute additional insights
    const insights = {
      tracksPublishedPercentage:
        stats.tracks.total > 0
          ? Math.round((stats.tracks.published / stats.tracks.total) * 100)
          : 0,
      averageRecordingDuration:
        stats.recordings.total > 0
          ? stats.recordings.totalDuration / stats.recordings.total
          : 0,
      storageStatus: this.getStorageStatus(stats.storage.percentage),
      hasCustomPresets: stats.presets.custom > 0,
    };

    return {
      data: {
        ...stats,
        insights,
      },
      error: null,
    };
  }

  /**
   * Determine storage status level
   */
  private static getStorageStatus(percentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  }
}

// ==========================================
// Direct Usage Example
// ==========================================

/**
 * Example of using the API directly (without React)
 * Useful in scripts, Edge Functions, or non-React contexts
 */
export async function printDashboardSummary(userId: string) {
  const response = await getDashboardStats(userId);

  if (response.error) {
    console.error('Failed to fetch dashboard stats:', response.error);
    return;
  }

  const stats = response.data!;
  const storageStatus = isStorageNearLimit(stats.storage.percentage, 80)
    ? '⚠️  HIGH'
    : '✅ OK';

  console.log(`
╔═══════════════════════════════════════╗
║       Dashboard Summary                ║
╠═══════════════════════════════════════╣
║ Tracks: ${stats.tracks.total.toString().padStart(3)} (${stats.tracks.published} published, ${stats.tracks.drafts} drafts)
║ Storage: ${storageStatus.padEnd(13)}
║         ${formatBytes(stats.storage.used)} / ${formatBytes(stats.storage.limit)}
║ Recordings: ${stats.recordings.total.toString().padStart(3)} (${formatDuration(stats.recordings.totalDuration)})
║ Custom Presets: ${stats.presets.custom.toString().padStart(3)}
╚═══════════════════════════════════════╝
  `);
}

// ==========================================
// Test Example
// ==========================================

/**
 * Example test case for dashboard API
 */
export async function testDashboardAPI() {
  console.log('Testing Dashboard API...');

  // Test helper functions
  console.assert(formatBytes(1024) === '1 KB', 'formatBytes failed');
  console.assert(formatBytes(2048576000) === '1.91 GB', 'formatBytes failed');
  console.assert(formatDuration(125) === '2m 5s', 'formatDuration failed');
  console.assert(formatDuration(18750) === '5h 12m 30s', 'formatDuration failed');
  console.assert(calculateStoragePercentage(2048576000, 5368709120) === 38, 'calculateStoragePercentage failed');
  console.assert(isStorageNearLimit(95) === true, 'isStorageNearLimit failed');
  console.assert(isStorageNearLimit(85, 90) === false, 'isStorageNearLimit failed');

  console.log('✅ All helper functions passed!');

  // Test query keys
  const key = dashboardQueryKeys.stats('user-123');
  console.assert(Array.isArray(key), 'dashboardQueryKeys.stats should return array');
  console.assert(key.includes('dashboard'), 'Query key should contain "dashboard"');
  console.assert(key.includes('user-123'), 'Query key should contain userId');

  console.log('✅ Query keys test passed!');

  // Test API call (requires valid user ID)
  const testUserId = 'test-user-id';
  const response = await getDashboardStats(testUserId);

  if (response.error) {
    console.log('⚠️  API call returned error (expected if user does not exist):', response.error.message);
  } else if (response.data) {
    console.log('✅ API call successful!');
    console.log('Dashboard stats:', JSON.stringify(response.data, null, 2));
  }

  console.log('Dashboard API test complete!');
}
