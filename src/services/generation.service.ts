/**
 * Generation Service Layer
 * Business logic for music generation
 */

import * as generationApi from '@/api/generation.api';
import type { GenerationLog, GenerationStats, GenerationLogsFilter } from '@/api/generation.api';

// ==========================================
// Types
// ==========================================

export interface GenerationSummary {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  successRate: number;
  avgDurationSeconds: number;
}

export interface GenerationActivity {
  logs: GenerationLog[];
  stats: GenerationSummary | null;
  hasActivity: boolean;
}

// ==========================================
// Generation Activity
// ==========================================

/**
 * Get generation activity with logs and stats
 */
export async function getGenerationActivity(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
): Promise<GenerationActivity> {
  const [logs, rawStats] = await Promise.all([
    generationApi.fetchGenerationLogs({ timeRange, limit: 50 }),
    generationApi.fetchGenerationStats(timeRange),
  ]);

  const stats: GenerationSummary | null = rawStats ? {
    total: rawStats.total_generations,
    completed: rawStats.completed,
    failed: rawStats.failed,
    pending: rawStats.pending + rawStats.processing,
    successRate: rawStats.success_rate,
    avgDurationSeconds: rawStats.avg_duration_seconds,
  } : null;

  return {
    logs,
    stats,
    hasActivity: logs.length > 0,
  };
}

// ==========================================
// Log Filtering & Analysis
// ==========================================

/**
 * Filter logs by status
 */
export function filterLogsByStatus(
  logs: GenerationLog[],
  status: 'completed' | 'failed' | 'pending' | 'processing'
): GenerationLog[] {
  return logs.filter(log => log.status === status);
}

/**
 * Get failed logs with error analysis
 */
export function analyzeFailedLogs(logs: GenerationLog[]): {
  total: number;
  byError: Record<string, number>;
  recentErrors: GenerationLog[];
} {
  const failedLogs = logs.filter(log => log.status === 'failed');
  
  const byError: Record<string, number> = {};
  failedLogs.forEach(log => {
    const errorKey = log.error_message || 'Unknown error';
    byError[errorKey] = (byError[errorKey] || 0) + 1;
  });

  return {
    total: failedLogs.length,
    byError,
    recentErrors: failedLogs.slice(0, 10),
  };
}

/**
 * Calculate generation success rate trend
 */
export function calculateSuccessTrend(
  currentStats: GenerationStats,
  previousStats: GenerationStats
): { trend: 'up' | 'down' | 'stable'; change: number } {
  const currentRate = currentStats.success_rate;
  const previousRate = previousStats.success_rate;
  const change = currentRate - previousRate;
  
  if (Math.abs(change) < 1) {
    return { trend: 'stable', change: 0 };
  }
  
  return {
    trend: change > 0 ? 'up' : 'down',
    change: Math.abs(change),
  };
}

// ==========================================
// Duration Analysis
// ==========================================

/**
 * Analyze generation durations
 */
export function analyzeGenerationDurations(logs: GenerationLog[]): {
  avgSeconds: number;
  minSeconds: number;
  maxSeconds: number;
  p95Seconds: number;
} {
  const completedLogs = logs.filter(log => 
    log.status === 'completed' && 
    log.completed_at && 
    log.created_at
  );

  if (completedLogs.length === 0) {
    return { avgSeconds: 0, minSeconds: 0, maxSeconds: 0, p95Seconds: 0 };
  }

  const durations = completedLogs.map(log => {
    const start = new Date(log.created_at).getTime();
    const end = new Date(log.completed_at!).getTime();
    return (end - start) / 1000;
  }).sort((a, b) => a - b);

  const sum = durations.reduce((a, b) => a + b, 0);
  const p95Index = Math.floor(durations.length * 0.95);

  return {
    avgSeconds: sum / durations.length,
    minSeconds: durations[0],
    maxSeconds: durations[durations.length - 1],
    p95Seconds: durations[p95Index] || durations[durations.length - 1],
  };
}

// ==========================================
// Realtime Updates
// ==========================================

/**
 * Merge realtime updates with existing logs
 */
export function mergeRealtimeLogs(
  existingLogs: GenerationLog[],
  newLog: GenerationLog,
  limit: number = 50
): GenerationLog[] {
  const existingIndex = existingLogs.findIndex(log => log.id === newLog.id);
  
  if (existingIndex >= 0) {
    // Update existing log
    const updated = [...existingLogs];
    updated[existingIndex] = newLog;
    return updated;
  } else {
    // Add new log at the beginning
    return [newLog, ...existingLogs].slice(0, limit);
  }
}

// Re-export API functions for convenience
export {
  fetchGenerationLogs,
  fetchGenerationStats,
  subscribeToGenerationLogs,
  retryGenerationTask,
} from '@/api/generation.api';

export type { GenerationLog, GenerationStats, GenerationLogsFilter };
