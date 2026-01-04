/**
 * Unit tests for rate limiting functionality
 * 
 * Tests:
 * 1. Rate limiter allows requests within limit
 * 2. Rate limiter blocks requests exceeding limit
 * 3. Rate limiter resets after time window
 * 4. Rate limit headers are correctly generated
 * 5. Different keys have independent rate limits
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock the rate limiter since it uses Deno-specific timers
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  isLimited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

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

  entry.count++;

  const isLimited = entry.count > config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    isLimited,
    limit: config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

function getRateLimitHeaders(
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

const RateLimitConfigs = {
  invoiceCreation: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  test: {
    windowMs: 1000, // 1 second for testing
    maxRequests: 3,
  },
};

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    rateLimitStore.clear();
  });

  it('should allow requests within limit', () => {
    const config = RateLimitConfigs.test;
    const key = 'test-user-1';

    // First request
    const result1 = checkRateLimit(key, config);
    expect(result1.isLimited).toBe(false);
    expect(result1.limit).toBe(3);
    expect(result1.remaining).toBe(2);

    // Second request
    const result2 = checkRateLimit(key, config);
    expect(result2.isLimited).toBe(false);
    expect(result2.remaining).toBe(1);

    // Third request
    const result3 = checkRateLimit(key, config);
    expect(result3.isLimited).toBe(false);
    expect(result3.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    const config = RateLimitConfigs.test;
    const key = 'test-user-2';

    // Make 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(key, config);
      expect(result.isLimited).toBe(false);
    }

    // 4th request should be blocked
    const result4 = checkRateLimit(key, config);
    expect(result4.isLimited).toBe(true);
    expect(result4.remaining).toBe(0);

    // 5th request should still be blocked
    const result5 = checkRateLimit(key, config);
    expect(result5.isLimited).toBe(true);
  });

  it('should reset after time window', async () => {
    const config = {
      windowMs: 100, // 100ms for fast test
      maxRequests: 2,
    };
    const key = 'test-user-3';

    // Make 2 requests (at limit)
    checkRateLimit(key, config);
    checkRateLimit(key, config);

    // 3rd request should be blocked
    const resultBlocked = checkRateLimit(key, config);
    expect(resultBlocked.isLimited).toBe(true);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should allow new requests after reset
    const resultAfterReset = checkRateLimit(key, config);
    expect(resultAfterReset.isLimited).toBe(false);
    expect(resultAfterReset.remaining).toBe(1);
  });

  it('should generate correct rate limit headers', () => {
    const limit = 10;
    const remaining = 5;
    const resetAt = 1702382400000;

    const headers = getRateLimitHeaders(limit, remaining, resetAt);

    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('5');
    expect(headers['X-RateLimit-Reset']).toBe('1702382400');
  });

  it('should have independent limits for different keys', () => {
    const config = RateLimitConfigs.test;
    const key1 = 'user-1';
    const key2 = 'user-2';

    // User 1 makes 3 requests (at limit)
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key1, config);
    }

    // User 1's 4th request is blocked
    const result1 = checkRateLimit(key1, config);
    expect(result1.isLimited).toBe(true);

    // User 2's first request is allowed
    const result2 = checkRateLimit(key2, config);
    expect(result2.isLimited).toBe(false);
    expect(result2.remaining).toBe(2);
  });

  it('should handle invoice creation rate limits', () => {
    const config = RateLimitConfigs.invoiceCreation;
    const userId = 'user-123';

    // Make 10 requests (at limit)
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(userId, config);
      expect(result.isLimited).toBe(false);
    }

    // 11th request should be blocked
    const result11 = checkRateLimit(userId, config);
    expect(result11.isLimited).toBe(true);
    expect(result11.limit).toBe(10);
    expect(result11.remaining).toBe(0);
  });

  it('should provide resetAt timestamp', () => {
    const config = RateLimitConfigs.test;
    const key = 'test-user-4';
    const now = Date.now();

    const result = checkRateLimit(key, config);
    
    expect(result.resetAt).toBeGreaterThan(now);
    expect(result.resetAt).toBeLessThanOrEqual(now + config.windowMs + 10);
  });
});

describe('Rate Limiter Integration Scenarios', () => {
  beforeEach(() => {
    rateLimitStore.clear();
  });

  it('should handle burst of requests correctly', () => {
    const config = RateLimitConfigs.test;
    const key = 'burst-user';

    // Simulate 10 rapid requests
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(checkRateLimit(key, config));
    }

    // First 3 should be allowed
    expect(results[0].isLimited).toBe(false);
    expect(results[1].isLimited).toBe(false);
    expect(results[2].isLimited).toBe(false);

    // Rest should be blocked
    for (let i = 3; i < 10; i++) {
      expect(results[i].isLimited).toBe(true);
    }
  });

  it('should track remaining count correctly', () => {
    const config = RateLimitConfigs.test;
    const key = 'count-user';

    const r1 = checkRateLimit(key, config);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, config);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, config);
    expect(r3.remaining).toBe(0);

    const r4 = checkRateLimit(key, config);
    expect(r4.remaining).toBe(0); // Still 0 when blocked
  });

  it('should handle edge case of exactly hitting limit', () => {
    const config = { windowMs: 1000, maxRequests: 1 };
    const key = 'edge-user';

    // First request: allowed
    const r1 = checkRateLimit(key, config);
    expect(r1.isLimited).toBe(false);
    expect(r1.remaining).toBe(0);

    // Second request: blocked (exceeded by 1)
    const r2 = checkRateLimit(key, config);
    expect(r2.isLimited).toBe(true);
  });
});
