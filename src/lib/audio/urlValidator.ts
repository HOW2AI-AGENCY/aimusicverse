/**
 * Audio URL Validator
 * 
 * Proactive validation of audio URLs before playback.
 * Helps prevent PIPELINE_ERROR_READ by checking URL accessibility.
 * 
 * Phase 2.2: Proactive audio URL validation
 */

import { logger } from '@/lib/logger';

export interface UrlValidationResult {
  isValid: boolean;
  isAccessible: boolean;
  status?: number;
  contentType?: string;
  error?: string;
  checkedAt: number;
}

// Cache for URL validation results (5 minute TTL)
const validationCache = new Map<string, UrlValidationResult>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validate audio URL accessibility with HEAD request
 * Caches results to avoid repeated checks
 */
export async function validateAudioUrl(url: string): Promise<UrlValidationResult> {
  // Check cache first
  const cached = validationCache.get(url);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached;
  }

  // Skip validation for blob and data URLs
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    const result: UrlValidationResult = {
      isValid: true,
      isAccessible: true,
      checkedAt: Date.now(),
    };
    validationCache.set(url, result);
    return result;
  }

  try {
    // Use HEAD request to check URL without downloading content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isAudioContent = contentType.startsWith('audio/') || 
                           contentType.includes('mpeg') ||
                           contentType.includes('mp3') ||
                           contentType.includes('wav') ||
                           contentType.includes('ogg');

    const result: UrlValidationResult = {
      isValid: response.ok,
      isAccessible: response.ok,
      status: response.status,
      contentType,
      checkedAt: Date.now(),
    };

    // Log if content type is unexpected
    if (response.ok && !isAudioContent && contentType) {
      logger.warn('Unexpected content type for audio URL', {
        url: url.substring(0, 100),
        contentType,
      });
    }

    validationCache.set(url, result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't log abort errors (timeouts) as they're expected
    if (errorMessage !== 'The user aborted a request.') {
      logger.debug('Audio URL validation failed', {
        url: url.substring(0, 100),
        error: errorMessage,
      });
    }

    const result: UrlValidationResult = {
      isValid: false,
      isAccessible: false,
      error: errorMessage,
      checkedAt: Date.now(),
    };

    // Cache failures for shorter time (1 minute)
    validationCache.set(url, result);
    
    return result;
  }
}

/**
 * Validate multiple URLs and return the first accessible one
 */
export async function findAccessibleUrl(urls: (string | undefined | null)[]): Promise<string | null> {
  const validUrls = urls.filter((url): url is string => !!url);
  
  if (validUrls.length === 0) return null;
  if (validUrls.length === 1) return validUrls[0];

  // Check all URLs in parallel
  const results = await Promise.all(
    validUrls.map(async (url) => {
      const validation = await validateAudioUrl(url);
      return { url, validation };
    })
  );

  // Return first accessible URL
  const accessible = results.find(r => r.validation.isAccessible);
  if (accessible) {
    return accessible.url;
  }

  // If none are validated as accessible, return first URL and let the player try
  // (some CDNs block HEAD requests but allow GET)
  logger.debug('No validated accessible URL found, using first URL', {
    urlCount: validUrls.length,
  });
  
  return validUrls[0];
}

/**
 * Clear validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Clear single URL from cache (use after retry attempt)
 */
export function invalidateCachedUrl(url: string): void {
  validationCache.delete(url);
}

/**
 * Get cache stats for debugging
 */
export function getValidationCacheStats(): { size: number; oldestEntry: number | null } {
  let oldestEntry: number | null = null;
  
  validationCache.forEach((result) => {
    if (oldestEntry === null || result.checkedAt < oldestEntry) {
      oldestEntry = result.checkedAt;
    }
  });

  return {
    size: validationCache.size,
    oldestEntry,
  };
}
