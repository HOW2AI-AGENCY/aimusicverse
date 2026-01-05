/**
 * Sentry Error Tracking Integration
 * Conditionally initializes Sentry if DSN is configured
 * 
 * Extended with specialized capture functions for:
 * - Audio errors (playback, streaming, decoding)
 * - Studio errors (stems, mixing, effects)
 * - Payment errors (Stars, Tinkoff, crypto)
 * - Reference generation errors
 * - Custom breadcrumbs for detailed tracking
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const isSentryEnabled = !!SENTRY_DSN;

// ==========================================
// Initialization
// ==========================================

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
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
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
      // Filter out startup audio errors (expected behavior)
      if (event.exception?.values?.[0]?.value?.includes('NotAllowedError')) {
        return null;
      }
      return event;
    },
  });

  console.info('[Sentry] Error tracking initialized');
}

// ==========================================
// Platform Detection
// ==========================================

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/Telegram/i.test(ua)) return 'telegram';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'web';
}

function getAudioStateString(element?: HTMLAudioElement): string {
  if (!element) return 'no_element';
  return `ready:${element.readyState},paused:${element.paused},ended:${element.ended}`;
}

// ==========================================
// Core Capture Functions
// ==========================================

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

// ==========================================
// Specialized Audio Capture
// ==========================================

export type AudioAction = 'play' | 'pause' | 'seek' | 'load' | 'decode' | 'stream' | 'error';

/**
 * Capture audio-related errors with detailed context
 */
export function captureAudioError(
  error: Error,
  context: {
    trackId?: string;
    action: AudioAction;
    audioState?: string;
    audioSrc?: string;
    platform?: string;
    readyState?: number;
    networkState?: number;
    duration?: number;
    currentTime?: number;
  }
): void {
  if (!isSentryEnabled) return;
  
  // Don't capture expected browser restrictions
  if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
    return;
  }
  
  Sentry.captureException(error, {
    tags: { 
      type: 'audio',
      action: context.action,
      platform: context.platform || detectPlatform(),
    },
    extra: {
      trackId: context.trackId,
      audioState: context.audioState,
      audioSrc: context.audioSrc?.slice(0, 150),
      readyState: context.readyState,
      networkState: context.networkState,
      duration: context.duration,
      currentTime: context.currentTime,
    },
    level: 'warning',
  });
}

// ==========================================
// Specialized Studio Capture
// ==========================================

export type StudioOperation = 'load' | 'process' | 'export' | 'save' | 'effect' | 'mix' | 'separate';
export type StemType = 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other' | 'all';

/**
 * Capture studio/DAW-related errors
 */
export function captureStudioError(
  error: Error,
  context: {
    projectId?: string;
    trackId?: string;
    stemType?: StemType;
    operation: StudioOperation;
    stemsCount?: number;
    effectName?: string;
    processingTime?: number;
  }
): void {
  if (!isSentryEnabled) return;
  
  Sentry.captureException(error, {
    tags: { 
      type: 'studio',
      operation: context.operation,
      stemType: context.stemType || 'unknown',
    },
    extra: {
      projectId: context.projectId,
      trackId: context.trackId,
      stemsCount: context.stemsCount,
      effectName: context.effectName,
      processingTime: context.processingTime,
    },
    level: 'error',
  });
}

// ==========================================
// Specialized Payment Capture
// ==========================================

export type PaymentProvider = 'stars' | 'tinkoff' | 'crypto' | 'stripe' | 'other';
export type PaymentOperation = 'init' | 'process' | 'confirm' | 'refund' | 'webhook' | 'invoice';

/**
 * Capture payment-related errors (high priority)
 */
export function capturePaymentError(
  error: Error,
  context: {
    provider: PaymentProvider;
    operation: PaymentOperation;
    amount?: number;
    currency?: string;
    productId?: string;
    transactionId?: string;
    gatewayError?: string;
  }
): void {
  if (!isSentryEnabled) return;
  
  Sentry.captureException(error, {
    tags: { 
      type: 'payment',
      provider: context.provider,
      operation: context.operation,
    },
    extra: {
      amount: context.amount,
      currency: context.currency,
      productId: context.productId,
      transactionId: context.transactionId,
      gatewayError: context.gatewayError,
    },
    level: 'error', // Payment errors are always high priority
  });
}

// ==========================================
// Reference Generation Capture
// ==========================================

export type ReferenceMode = 'cover' | 'extend' | 'stems' | 'analyze' | 'add_vocals';
export type ReferenceStep = 'upload' | 'analyze' | 'generate' | 'callback' | 'save';

/**
 * Capture reference audio generation errors
 */
export function captureReferenceGenerationError(
  error: Error,
  context: {
    referenceId?: string;
    mode: ReferenceMode;
    step: ReferenceStep;
    fileSize?: number;
    duration?: number;
    mimeType?: string;
  }
): void {
  if (!isSentryEnabled) return;
  
  Sentry.captureException(error, {
    tags: { 
      type: 'reference_generation',
      mode: context.mode,
      step: context.step,
    },
    extra: {
      referenceId: context.referenceId,
      fileSize: context.fileSize,
      duration: context.duration,
      mimeType: context.mimeType,
    },
    level: 'error',
  });
}

// ==========================================
// Custom Breadcrumbs
// ==========================================

export type BreadcrumbCategory = 'ui' | 'audio' | 'generation' | 'studio' | 'payment' | 'navigation' | 'api' | 'state';

/**
 * Add user action breadcrumb for tracking user behavior before errors
 */
export function addUserActionBreadcrumb(
  action: string, 
  category: BreadcrumbCategory = 'ui',
  data?: Record<string, unknown>
): void {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category,
    message: action,
    level: 'info',
    data,
  });
}

/**
 * Add API call breadcrumb for tracking network requests
 */
export function addApiCallBreadcrumb(
  endpoint: string,
  method: string,
  status: number,
  durationMs: number,
  errorMessage?: string
): void {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${method} ${endpoint}`,
    level: status >= 400 ? 'error' : 'info',
    data: { 
      status, 
      durationMs,
      error: errorMessage,
    },
  });
}

/**
 * Add state change breadcrumb for tracking Zustand store changes
 */
export function addStateChangeBreadcrumb(
  store: string,
  action: string,
  details?: Record<string, unknown>
): void {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category: 'state',
    message: `[${store}] ${action}`,
    level: 'info',
    data: details,
  });
}

/**
 * Add navigation breadcrumb for route changes
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigate: ${from} → ${to}`,
    level: 'info',
  });
}

/**
 * Add audio event breadcrumb
 */
export function addAudioBreadcrumb(
  action: string,
  trackId?: string,
  details?: Record<string, unknown>
): void {
  if (!isSentryEnabled) return;
  
  Sentry.addBreadcrumb({
    category: 'audio',
    message: action,
    level: 'info',
    data: { trackId, ...details },
  });
}

// ==========================================
// Performance Monitoring
// ==========================================

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

// ==========================================
// User Context
// ==========================================

/**
 * Set user context with extended info
 */
export function setUserContext(
  userId: string | null, 
  extra?: { 
    email?: string; 
    telegramId?: number;
    tier?: string;
    username?: string;
  }
): void {
  if (!isSentryEnabled) return;
  
  if (userId) {
    Sentry.setUser({ 
      id: userId, 
      email: extra?.email,
      username: extra?.username || extra?.telegramId?.toString(),
    });
    if (extra?.tier) {
      Sentry.setTag('user_tier', extra.tier);
    }
    Sentry.setTag('platform', detectPlatform());
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string): void {
  if (!isSentryEnabled) return;
  Sentry.setTag(key, value);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  if (!isSentryEnabled) return;
  Sentry.setExtra(key, value);
}

export { Sentry };
