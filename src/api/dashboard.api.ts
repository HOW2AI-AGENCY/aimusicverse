/**
 * Dashboard API Layer
 * Raw Supabase operations for dashboard statistics and user metrics
 *
 * @see specs/031-mobile-studio-v2/contracts/api-contracts.md
 */

import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Types
// ==========================================

/**
 * Dashboard statistics response shape
 * Matches the API contract for GET /dashboard/stats
 */
export interface DashboardStats {
  /** Track statistics */
  tracks: {
    total: number;
    published: number;
    drafts: number;
  };
  /** Storage usage statistics */
  storage: {
    used: number; // Bytes
    limit: number; // Bytes
    percentage: number; // 0-100
  };
  /** Recording statistics */
  recordings: {
    total: number;
    totalDuration: number; // Seconds
  };
  /** Preset statistics */
  presets: {
    custom: number;
    favorite: string | null; // Preset ID
  };
}

/**
 * Error response shape
 */
export interface DashboardError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Result wrapper for dashboard operations
 */
export type DashboardResult<T> = {
  data: T | null;
  error: DashboardError | null;
};

// ==========================================
// Dashboard Statistics
// ==========================================

/**
 * Get dashboard statistics for the current user
 *
 * Fetches comprehensive user statistics including:
 * - Track counts (total, published, drafts)
 * - Storage usage (used, limit, percentage)
 * - Recording counts and total duration
 * - Preset counts and favorite
 *
 * @param userId - The user ID to fetch statistics for
 * @returns Dashboard statistics or error
 *
 * @example
 * ```typescript
 * const { data, error } = await getDashboardStats('user-uuid');
 * if (data) {
 *   console.log(`Tracks: ${data.tracks.total}`);
 *   console.log(`Storage: ${data.storage.percentage}%`);
 * }
 * ```
 *
 * @throws When Supabase RPC call fails
 *
 * @see {@link https://api.musicverse.ai/dashboard/stats} API endpoint
 */
export async function getDashboardStats(
  userId: string
): Promise<DashboardResult<DashboardStats>> {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      user_id: userId,
    });

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: error.code,
          details: error.hint,
        },
      };
    }

    // Validate response structure
    if (!data || typeof data !== 'object') {
      return {
        data: null,
        error: {
          message: 'Invalid response structure from dashboard stats',
          code: 'INVALID_RESPONSE',
        },
      };
    }

    return {
      data: data as DashboardStats,
      error: null,
    };
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error('Unknown error fetching dashboard stats');

    return {
      data: null,
      error: {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Format bytes to human-readable size
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 GB")
 *
 * @example
 * ```typescript
 * formatBytes(2048576000); // "1.91 GB"
 * formatBytes(1024); // "1 KB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format seconds to human-readable duration
 *
 * @param seconds - Number of seconds
 * @returns Formatted string (e.g., "5h 12m 30s")
 *
 * @example
 * ```typescript
 * formatDuration(18750); // "5h 12m 30s"
 * formatDuration(125); // "2m 5s"
 * ```
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * Calculate storage percentage safely
 *
 * @param used - Bytes used
 * @param limit - Bytes limit
 * @returns Percentage (0-100)
 *
 * @example
 * ```typescript
 * calculateStoragePercentage(2048576000, 5368709120); // 38
 * ```
 */
export function calculateStoragePercentage(
  used: number,
  limit: number
): number {
  if (!limit || limit === 0) return 0;
  const percentage = (used / limit) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
}

/**
 * Check if storage is near limit
 *
 * @param percentage - Storage percentage (0-100)
 * @param threshold - Warning threshold (default: 90)
 * @returns True if storage is at or above threshold
 *
 * @example
 * ```typescript
 * isStorageNearLimit(95); // true
 * isStorageNearLimit(85, 90); // false
 * ```
 */
export function isStorageNearLimit(
  percentage: number,
  threshold: number = 90
): boolean {
  return percentage >= threshold;
}

// ==========================================
// React Query Integration Helpers
// ==========================================

/**
 * Query key factory for dashboard queries
 * Used for consistent cache keys in React Query
 */
export const dashboardQueryKeys = {
  /**
   * Key for dashboard stats query
   * @param userId - User ID
   */
  stats: (userId: string) => ['dashboard', 'stats', userId] as const,

  /**
   * Key for all dashboard queries
   */
  all: () => ['dashboard'] as const,
} as const;

/**
 * Default stale time for dashboard data (5 minutes)
 * Dashboard stats don't change frequently
 */
export const DASHBOARD_STALE_TIME = 5 * 60 * 1000;

/**
 * Default cache time for dashboard data (10 minutes)
 */
export const DASHBOARD_CACHE_TIME = 10 * 60 * 1000;
