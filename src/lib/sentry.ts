/**
 * Sentry Error Tracking Integration
 * Conditionally initializes Sentry if DSN is configured
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const isSentryEnabled = !!SENTRY_DSN;

/**
 * Initialize Sentry error tracking
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.info('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Filter out non-actionable errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }
      return event;
    },
  });

  console.info('[Sentry] Error tracking initialized');
}

/**
 * Capture exception to Sentry
 */
export function captureError(error: Error | unknown, context?: Record<string, unknown>): void {
  if (!isSentryEnabled) return;
  
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(userId: string | null, username?: string): void {
  if (!isSentryEnabled) return;
  
  if (userId) {
    Sentry.setUser({ id: userId, username });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture navigation error with route context
 */
export function captureNavigationError(from: string, to: string, error: Error): void {
  if (!isSentryEnabled) return;
  
  Sentry.captureException(error, {
    tags: { type: 'navigation', from, to },
    extra: { fromRoute: from, toRoute: to },
  });
}

/**
 * Capture generation error with prompt context
 */
export function captureGenerationError(
  error: Error,
  context: {
    prompt?: string;
    mode?: string;
    model?: string;
    action?: string;
  }
): void {
  if (!isSentryEnabled) return;
  
  Sentry.captureException(error, {
    tags: { 
      type: 'generation', 
      mode: context.mode,
      action: context.action,
    },
    extra: {
      prompt: context.prompt?.slice(0, 200), // Truncate long prompts
      model: context.model,
    },
  });
}

/**
 * Start a performance span for monitoring
 */
export function startSpan<T>(
  name: string, 
  op: string, 
  callback: () => T | Promise<T>
): T | Promise<T> {
  if (!isSentryEnabled) {
    return callback();
  }
  
  return Sentry.startSpan({ name, op }, callback);
}

/**
 * Set user context with extended info
 */
export function setUserContext(
  userId: string | null, 
  extra?: { 
    email?: string; 
    telegramId?: number;
    tier?: string;
  }
): void {
  if (!isSentryEnabled) return;
  
  if (userId) {
    Sentry.setUser({ 
      id: userId, 
      email: extra?.email,
      username: extra?.telegramId?.toString(),
    });
    if (extra?.tier) {
      Sentry.setTag('user_tier', extra.tier);
    }
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for navigation tracking
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigate: ${from} → ${to}`,
    level: 'info',
  });
}

export { Sentry };
