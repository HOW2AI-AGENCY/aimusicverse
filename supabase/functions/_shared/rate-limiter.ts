/**
 * Simple in-memory rate limiter for Edge Functions
 * 
 * NOTE: This is per-instance rate limiting. For distributed rate limiting,
 * consider using Redis or database-based solutions.
 * 
 * For production, consider using Upstash Rate Limiting or similar services.
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries inline (avoid setInterval in serverless)
function cleanupStaleEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * 
 * @param key - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and rate limit info
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  isLimited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  
  // Cleanup stale entries periodically (every 100th call)
  if (Math.random() < 0.01) {
    cleanupStaleEntries();
  }
  
  const entry = rateLimitStore.get(key);

  // If no entry exists or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      isLimited: false,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  const isLimited = entry.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    isLimited,
    limit: config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // 10 requests per minute for invoice creation
  invoiceCreation: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  
  // 100 requests per hour for general API
  generalApi: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  },
  
  // 5 requests per minute for sensitive operations
  sensitiveOps: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  
  // 15 callbacks per task for Suno API webhooks
  // Prevents abuse and duplicate processing
  sunoCallback: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 15,
  },
  
  // 10 callbacks per separation task
  vocalCallback: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
};
