/**
 * Structured error types for better error handling
 * Use these instead of generic Error for better type safety and user messages
 */

import { captureError as sentryCaptureError } from './sentry';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      metadata: this.metadata,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      'Проверьте введённые данные',
      { field }
    );
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      'NETWORK_ERROR',
      503,
      'Проблема с подключением. Проверьте интернет и попробуйте ещё раз.',
      { originalError: originalError?.message }
    );
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(
      message,
      'AUTH_ERROR',
      401,
      'Требуется авторизация. Пожалуйста, войдите снова.'
    );
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(
      `${resource} not found`,
      'NOT_FOUND',
      404,
      `${resource} не найден`
    );
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(action: string) {
    super(
      `Permission denied for ${action}`,
      'PERMISSION_DENIED',
      403,
      `Недостаточно прав для выполнения действия`
    );
    this.name = 'PermissionError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded',
      'RATE_LIMIT',
      429,
      'Слишком много запросов. Пожалуйста, подождите немного.',
      { retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(
      `${service} is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      `Сервис временно недоступен. Попробуйте позже.`,
      { service }
    );
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Helper to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get user-friendly error message from any error
 */
export function getUserErrorMessage(error: unknown): string {
  if (isAppError(error) && error.userMessage) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    // Map common error messages to user-friendly ones
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Проблема с подключением. Проверьте интернет.';
    }
    
    if (message.includes('timeout')) {
      return 'Превышено время ожидания. Попробуйте ещё раз.';
    }
    
    if (message.includes('unauthorized') || message.includes('auth')) {
      return 'Требуется авторизация. Пожалуйста, войдите снова.';
    }
    
    if (message.includes('not found')) {
      return 'Запрашиваемый ресурс не найден.';
    }
    
    return 'Произошла ошибка. Попробуйте позже.';
  }

  return 'Неизвестная ошибка. Попробуйте позже.';
}

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
) {
  const errorInfo = isAppError(error) ? error.toJSON() : {
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
  };

  console.error('[Error]', {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send to Sentry if configured
  try {
    sentryCaptureError(error, context);
  } catch {
    // Sentry not available or failed, silent fail
  }
}
