/**
 * Database-backed rate limiter for Telegram bot
 * Persists rate limits across Edge Function restarts
 */

import { getSupabaseClient } from '../../_shared/supabase-client.ts';

interface RateLimitResult {
  isLimited: boolean;
  currentCount: number;
  remaining: number;
  resetAt: Date;
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

// Default configs for different action types
export const RateLimitConfigs = {
  message: { maxRequests: 30, windowSeconds: 60 },      // 30 msgs/min
  command: { maxRequests: 20, windowSeconds: 60 },       // 20 commands/min
  callback: { maxRequests: 60, windowSeconds: 60 },      // 60 callbacks/min
  upload: { maxRequests: 5, windowSeconds: 60 },         // 5 uploads/min
  generation: { maxRequests: 10, windowSeconds: 300 },   // 10 generations/5min
  payment: { maxRequests: 5, windowSeconds: 60 },        // 5 payment actions/min
} as const;

export type ActionType = keyof typeof RateLimitConfigs;

// In-memory fallback cache (used if DB is unavailable)
const fallbackCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit using database
 * Falls back to in-memory if DB unavailable
 */
export async function checkRateLimitDb(
  userId: number,
  actionType: ActionType = 'message',
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const config = customConfig || RateLimitConfigs[actionType];
  
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('check_telegram_rate_limit', {
      p_user_id: userId,
      p_action_type: actionType,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds
    });

    if (error) {
      console.error('Rate limit DB error, using fallback:', error);
      return checkRateLimitFallback(userId, actionType, config);
    }

    const result = data?.[0];
    if (!result) {
      return checkRateLimitFallback(userId, actionType, config);
    }

    return {
      isLimited: result.is_limited,
      currentCount: result.current_count,
      remaining: result.remaining,
      resetAt: new Date(result.reset_at)
    };
  } catch (error) {
    console.error('Rate limit check failed, using fallback:', error);
    return checkRateLimitFallback(userId, actionType, config);
  }
}

/**
 * Fallback in-memory rate limiter
 * Used when database is unavailable
 */
function checkRateLimitFallback(
  userId: number,
  actionType: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${userId}:${actionType}`;
  const entry = fallbackCache.get(key);
  const windowMs = config.windowSeconds * 1000;

  // Window expired or no entry
  if (!entry || entry.resetAt < now) {
    fallbackCache.set(key, { 
      count: 1, 
      resetAt: now + windowMs 
    });
    return {
      isLimited: false,
      currentCount: 1,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now + windowMs)
    };
  }

  // Increment count
  entry.count++;
  
  return {
    isLimited: entry.count > config.maxRequests,
    currentCount: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: new Date(entry.resetAt)
  };
}

/**
 * Simple check that returns boolean (for backward compatibility)
 */
export async function isRateLimited(
  userId: number,
  actionType: ActionType = 'message'
): Promise<boolean> {
  const result = await checkRateLimitDb(userId, actionType);
  return result.isLimited;
}

/**
 * Get rate limit info without incrementing counter
 * (Note: This still increments - for true peek, would need separate DB function)
 */
export async function getRateLimitInfo(
  userId: number,
  actionType: ActionType = 'message'
): Promise<RateLimitResult> {
  return checkRateLimitDb(userId, actionType);
}

// Cleanup stale in-memory entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fallbackCache.entries()) {
    if (entry.resetAt < now) {
      fallbackCache.delete(key);
    }
  }
}, 60000); // Every minute
