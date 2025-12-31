/**
 * Enhanced Error Reporting Module
 * 
 * Provides:
 * - Structured error logging with context
 * - Error aggregation and deduplication
 * - Sentry integration
 * - User-friendly error display
 * - Recovery suggestions
 */

import { AppError, ErrorCode, ErrorSeverity, toAppError } from './errors/AppError';
import { logger } from './logger';
import { recordError } from './telemetry';
import { toast } from 'sonner';

// Types
interface ErrorReport {
  id: string;
  error: AppError;
  timestamp: Date;
  context: Record<string, unknown>;
  fingerprint: string;
  reported: boolean;
}

interface ErrorDisplayOptions {
  title?: string;
  showToast?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// Error registry for deduplication
const errorRegistry = new Map<string, ErrorReport>();
const DEDUP_WINDOW_MS = 60000; // 1 minute

/**
 * Generate a fingerprint for error deduplication
 */
function generateFingerprint(error: AppError): string {
  const parts = [
    error.code,
    error.name,
    error.message.substring(0, 100),
  ];
  return parts.join(':');
}

/**
 * Check if error should be reported (deduplication)
 */
function shouldReport(fingerprint: string): boolean {
  const existing = errorRegistry.get(fingerprint);
  if (!existing) return true;
  
  const timeSinceReport = Date.now() - existing.timestamp.getTime();
  return timeSinceReport > DEDUP_WINDOW_MS;
}

/**
 * Report an error with full context
 */
export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ErrorDisplayOptions = {}
): AppError {
  const appError = toAppError(error);
  const fingerprint = generateFingerprint(appError);
  
  // Create report
  const report: ErrorReport = {
    id: crypto.randomUUID(),
    error: appError,
    timestamp: new Date(),
    context: {
      ...context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    },
    fingerprint,
    reported: false,
  };
  
  // Check deduplication
  if (shouldReport(fingerprint)) {
    errorRegistry.set(fingerprint, report);
    
    // Log to console
    logger.error(appError.message, appError, report.context);
    
    // Record in telemetry
    recordError(appError.code, appError.message, report.context);
    
    // Send to Sentry
    sendToSentry(appError, report.context);
    
    report.reported = true;
  }
  
  // Display to user if needed
  if (options.showToast !== false && appError.metadata.severity !== ErrorSeverity.LOW) {
    displayError(appError, options);
  }
  
  // Cleanup old entries
  cleanupRegistry();
  
  return appError;
}

/**
 * Display error to user with recovery options
 */
export function displayError(error: AppError, options: ErrorDisplayOptions = {}) {
  const title = options.title || getErrorTitle(error);
  const message = error.toUserMessage();
  const { onRetry, onDismiss } = options;
  
  // Determine toast variant based on severity
  const severity = error.metadata.severity;
  
  if (severity === ErrorSeverity.FATAL) {
    toast.error(title, {
      description: message,
      duration: 10000,
      action: onRetry ? {
        label: 'Повторить',
        onClick: onRetry,
      } : undefined,
      onDismiss,
    });
  } else if (severity === ErrorSeverity.HIGH) {
    toast.error(title, {
      description: message,
      duration: 7000,
      action: onRetry && error.isRetryable() ? {
        label: 'Попробовать снова',
        onClick: onRetry,
      } : undefined,
      onDismiss,
    });
  } else if (severity === ErrorSeverity.MEDIUM) {
    toast.warning(title, {
      description: message,
      duration: 5000,
      onDismiss,
    });
  } else {
    toast(title, {
      description: message,
      duration: 3000,
    });
  }
}

/**
 * Get localized error title
 */
function getErrorTitle(error: AppError): string {
  switch (error.code) {
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.CONNECTION_ERROR:
      return 'Ошибка сети';
    case ErrorCode.TIMEOUT_ERROR:
      return 'Превышено время ожидания';
    case ErrorCode.RATE_LIMIT_ERROR:
      return 'Превышен лимит';
    case ErrorCode.UNAUTHORIZED:
      return 'Требуется авторизация';
    case ErrorCode.FORBIDDEN:
      return 'Доступ запрещён';
    case ErrorCode.NOT_FOUND:
      return 'Не найдено';
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
      return 'Ошибка валидации';
    case ErrorCode.AUDIO_CONTEXT_ERROR:
    case ErrorCode.AUDIO_PLAYBACK_ERROR:
    case ErrorCode.AUDIO_LOADING_ERROR:
      return 'Ошибка аудио';
    case ErrorCode.GENERATION_ERROR:
      return 'Ошибка генерации';
    case ErrorCode.INSUFFICIENT_CREDITS:
      return 'Недостаточно кредитов';
    case ErrorCode.STORAGE_ERROR:
    case ErrorCode.QUOTA_EXCEEDED:
      return 'Ошибка хранилища';
    default:
      return 'Произошла ошибка';
  }
}

/**
 * Send error to Sentry
 */
async function sendToSentry(error: AppError, context: Record<string, unknown>) {
  try {
    const { captureError } = await import('./sentry');
    captureError(error, context);
  } catch {
    // Sentry not available - silent fail
  }
}

/**
 * Cleanup old error registry entries
 */
function cleanupRegistry() {
  const now = Date.now();
  const maxAge = DEDUP_WINDOW_MS * 5; // 5 minutes
  
  for (const [fingerprint, report] of errorRegistry) {
    if (now - report.timestamp.getTime() > maxAge) {
      errorRegistry.delete(fingerprint);
    }
  }
}

/**
 * Get error statistics for debugging
 */
export function getErrorStats(): { total: number; byCode: Record<string, number> } {
  const stats = {
    total: errorRegistry.size,
    byCode: {} as Record<string, number>,
  };
  
  for (const report of errorRegistry.values()) {
    const code = report.error.code;
    stats.byCode[code] = (stats.byCode[code] || 0) + 1;
  }
  
  return stats;
}

/**
 * Clear error registry (for testing)
 */
export function clearErrorRegistry() {
  errorRegistry.clear();
}

/**
 * Error boundary helper for async operations
 */
export async function withErrorReporting<T>(
  fn: () => Promise<T>,
  context: Record<string, unknown> = {},
  options: ErrorDisplayOptions = {}
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    reportError(error, context, options);
    return null;
  }
}

/**
 * Hook-friendly error handler
 */
export function createErrorHandler(
  context: Record<string, unknown> = {},
  options: ErrorDisplayOptions = {}
) {
  return (error: unknown) => {
    reportError(error, context, options);
  };
}
