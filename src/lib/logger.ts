/**
 * Centralized logging utility for MusicVerse AI
 * 
 * Features:
 * - Environment-aware (dev vs production)
 * - Structured logging with context
 * - Error tracking with stack traces
 * - Performance monitoring
 * - Sanitized output (no sensitive data)
 * - Sentry integration for production error tracking
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User logged in', { userId: 123 });
 * logger.error('API call failed', error, { endpoint: '/api/tracks' });
 * 
 * const timer = logger.startTimer('API Call');
 * // ... do work
 * timer(); // logs duration
 * ```
 */

import { captureError, isSentryEnabled, Sentry } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'authorization',
  'telegram_id', 'chat_id', 'api_key', 'apikey'
];

/**
 * Serialize error objects (including Supabase PostgrestError) into a readable format
 * Supabase errors typically have: message, details, hint, code properties
 */
function serializeError(error: unknown): string {
  if (error === null || error === undefined) {
    return String(error);
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle Supabase PostgrestError and other error-like objects
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    // Try to extract common error properties
    const parts: string[] = [];
    
    if (errorObj.message) {
      parts.push(String(errorObj.message));
    }
    
    if (errorObj.code) {
      parts.push(`[Code: ${errorObj.code}]`);
    }
    
    if (errorObj.details) {
      parts.push(`Details: ${errorObj.details}`);
    }
    
    if (errorObj.hint) {
      parts.push(`Hint: ${errorObj.hint}`);
    }
    
    // If we found error properties, return them
    if (parts.length > 0) {
      return parts.join(' | ');
    }
    
    // Fallback: try to stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  // Fallback for primitives
  return String(error);
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private appName = 'MusicVerse';

  /**
   * Redact sensitive data from context
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;
    
    const sanitized: LogContext = {};
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value as LogContext);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.appName}]`;
    const sanitizedContext = this.sanitizeContext(context);
    
    if (sanitizedContext && Object.keys(sanitizedContext).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(sanitizedContext)}`;
    }
    
    return `${prefix} ${message}`;
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }

    // Send to Sentry in production
    if (!this.isDevelopment && isSentryEnabled) {
      Sentry.logger.debug(message, this.sanitizeContext(context));
    }
  }

  /**
   * Log info messages (development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }

    // Send to Sentry in production
    if (!this.isDevelopment && isSentryEnabled) {
      Sentry.logger.info(message, this.sanitizeContext(context));
    }
  }

  /**
   * Log warning messages (always shown)
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));

    // Send to Sentry in production
    if (isSentryEnabled) {
      Sentry.logger.warn(message, this.sanitizeContext(context));
    }
  }

  /**
   * Log error messages with full context (always shown)
   * Sends to Sentry in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      // Only include stack in development
      if (this.isDevelopment) {
        errorContext.errorStack = error.stack;
      }

      // Send to Sentry in production
      if (isSentryEnabled) {
        captureError(error, { message, ...this.sanitizeContext(context) });

        // Also send as structured log
        Sentry.logger.error(message, {
          ...this.sanitizeContext(context),
          errorName: error.name,
          errorMessage: error.message,
        });
      }
    } else if (error !== undefined) {
      // Use serializeError to properly extract error information
      const serializedError = serializeError(error);
      errorContext.errorValue = serializedError;

      // Create an error object for Sentry
      if (isSentryEnabled) {
        captureError(new Error(message), { errorValue: serializedError, ...this.sanitizeContext(context) });

        // Also send as structured log
        Sentry.logger.error(message, {
          ...this.sanitizeContext(context),
          errorValue: serializedError,
        });
      }
    }

    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Start a performance timer
   * Returns a function that when called, logs the elapsed time
   * 
   * @param label - Label for the timer
   * @returns Function to stop the timer and log duration
   */
  startTimer(label: string): () => number {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.debug(`⏱️ ${label}`, { durationMs: Math.round(duration * 100) / 100 });
      return duration;
    };
  }

  /**
   * Log a group of related messages (development only)
   */
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(`[${this.appName}] ${label}`);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Log tabular data (development only)
   */
  table(data: unknown): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Create a child logger with predefined context
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }
}

export const logger = new Logger();
