/**
 * Centralized logging utility for MusicVerse AI
 * 
 * Features:
 * - Environment-aware (dev vs production)
 * - Structured logging
 * - Error tracking integration ready
 * - Performance monitoring
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

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private appName = 'MusicVerse AI';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.appName}]`;
    
    if (context) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
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
  }

  /**
   * Log info messages (development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  /**
   * Log warning messages (always shown)
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error messages with full context (always shown)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };
    
    console.error(this.formatMessage('error', message, errorContext));
    
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorContext });
    // }
  }

  /**
   * Start a performance timer
   * Returns a function that when called, logs the elapsed time
   * 
   * @param label - Label for the timer
   * @returns Function to stop the timer and log duration
   */
  startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.debug(`⏱️ ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  /**
   * Log a group of related messages
   */
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Log a table (development only)
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}

export const logger = new Logger();
