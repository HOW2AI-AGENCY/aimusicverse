/**
 * Application Error Hierarchy
 * Standardized error handling for typed error catching (IMP039)
 * Phase 4: Enhanced with Result type, error recovery, and better categorization
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  FORMAT_ERROR = 'FORMAT_ERROR',
  
  // Audio errors
  AUDIO_CONTEXT_ERROR = 'AUDIO_CONTEXT_ERROR',
  AUDIO_LOADING_ERROR = 'AUDIO_LOADING_ERROR',
  AUDIO_PLAYBACK_ERROR = 'AUDIO_PLAYBACK_ERROR',
  AUDIO_DECODE_ERROR = 'AUDIO_DECODE_ERROR',
  AUDIO_FORMAT_ERROR = 'AUDIO_FORMAT_ERROR',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  
  // Generation errors
  GENERATION_ERROR = 'GENERATION_ERROR',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  PROMPT_ERROR = 'PROMPT_ERROR',
  CONTENT_BLOCKED = 'CONTENT_BLOCKED',
  
  // User errors
  USER_CANCELLED = 'USER_CANCELLED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error severity levels for logging and UI decisions
 */
export enum ErrorSeverity {
  LOW = 'low',       // Informational, can be ignored
  MEDIUM = 'medium', // User should be notified but can continue
  HIGH = 'high',     // Critical, operation failed
  FATAL = 'fatal',   // App state may be corrupted
}

/**
 * Recovery strategy suggestions
 */
export enum RecoveryStrategy {
  NONE = 'none',         // No recovery possible
  RETRY = 'retry',       // Simple retry might work
  RETRY_BACKOFF = 'retry_backoff', // Retry with exponential backoff
  REFRESH = 'refresh',   // Refresh page/token
  REAUTH = 'reauth',     // Re-authenticate
  MANUAL = 'manual',     // User must take action
}

/**
 * Error metadata for better handling
 */
export interface ErrorMetadata {
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  retryable: boolean;
  retryAfterMs?: number;
  userActionRequired?: string;
}

/**
 * Default metadata by error code
 */
const ERROR_METADATA: Record<ErrorCode, ErrorMetadata> = {
  [ErrorCode.NETWORK_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.TIMEOUT_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY_BACKOFF, retryable: true },
  [ErrorCode.CONNECTION_ERROR]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.CORS_ERROR]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.NONE, retryable: false },
  
  [ErrorCode.API_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.RATE_LIMIT_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY_BACKOFF, retryable: true, retryAfterMs: 60000 },
  [ErrorCode.INSUFFICIENT_CREDITS]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false, userActionRequired: 'Пополните баланс' },
  [ErrorCode.INVALID_REQUEST]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false },
  [ErrorCode.UNAUTHORIZED]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.REAUTH, retryable: false },
  [ErrorCode.FORBIDDEN]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.NONE, retryable: false },
  [ErrorCode.NOT_FOUND]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.NONE, retryable: false },
  [ErrorCode.SERVER_ERROR]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.RETRY_BACKOFF, retryable: true },
  
  [ErrorCode.VALIDATION_ERROR]: { severity: ErrorSeverity.LOW, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false },
  [ErrorCode.INVALID_INPUT]: { severity: ErrorSeverity.LOW, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false },
  [ErrorCode.REQUIRED_FIELD]: { severity: ErrorSeverity.LOW, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false },
  [ErrorCode.FORMAT_ERROR]: { severity: ErrorSeverity.LOW, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false },
  
  [ErrorCode.AUDIO_CONTEXT_ERROR]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.REFRESH, retryable: false },
  [ErrorCode.AUDIO_LOADING_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.AUDIO_PLAYBACK_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.AUDIO_DECODE_ERROR]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.NONE, retryable: false },
  [ErrorCode.AUDIO_FORMAT_ERROR]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.NONE, retryable: false },
  
  [ErrorCode.STORAGE_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.QUOTA_EXCEEDED]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false, userActionRequired: 'Освободите место' },
  [ErrorCode.UPLOAD_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.DOWNLOAD_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  
  [ErrorCode.GENERATION_ERROR]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
  [ErrorCode.MODEL_UNAVAILABLE]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.RETRY_BACKOFF, retryable: true },
  [ErrorCode.PROMPT_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false },
  [ErrorCode.CONTENT_BLOCKED]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.MANUAL, retryable: false },
  
  [ErrorCode.USER_CANCELLED]: { severity: ErrorSeverity.LOW, recoveryStrategy: RecoveryStrategy.NONE, retryable: false },
  [ErrorCode.SESSION_EXPIRED]: { severity: ErrorSeverity.HIGH, recoveryStrategy: RecoveryStrategy.REAUTH, retryable: false },
  
  [ErrorCode.UNKNOWN_ERROR]: { severity: ErrorSeverity.MEDIUM, recoveryStrategy: RecoveryStrategy.RETRY, retryable: true },
};

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly metadata: ErrorMetadata;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date();
    this.metadata = ERROR_METADATA[code] || ERROR_METADATA[ErrorCode.UNKNOWN_ERROR];

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to user-friendly message
   */
  toUserMessage(): string {
    return this.message;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.metadata.retryable;
  }

  /**
   * Get retry delay in milliseconds
   */
  getRetryDelayMs(): number {
    return this.metadata.retryAfterMs || 1000;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.NETWORK_ERROR, undefined, context);
  }

  toUserMessage(): string {
    return 'Ошибка сети. Проверьте подключение к интернету';
  }
}

/**
 * API-related errors
 */
export class APIError extends AppError {
  constructor(
    message: string,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    const code = statusCode === 429 
      ? ErrorCode.RATE_LIMIT_ERROR 
      : statusCode === 401 
      ? ErrorCode.UNAUTHORIZED
      : statusCode === 403
      ? ErrorCode.FORBIDDEN
      : statusCode === 404
      ? ErrorCode.NOT_FOUND
      : statusCode && statusCode >= 500
      ? ErrorCode.SERVER_ERROR
      : ErrorCode.API_ERROR;
    
    super(message, code, statusCode, context);
  }

  toUserMessage(): string {
    if (this.code === ErrorCode.RATE_LIMIT_ERROR) {
      return 'Превышен лимит запросов. Попробуйте позже';
    }
    if (this.code === ErrorCode.UNAUTHORIZED) {
      return 'Требуется авторизация';
    }
    if (this.code === ErrorCode.FORBIDDEN) {
      return 'Доступ запрещён';
    }
    if (this.code === ErrorCode.NOT_FOUND) {
      return 'Ресурс не найден';
    }
    if (this.code === ErrorCode.SERVER_ERROR) {
      return 'Ошибка сервера. Попробуйте позже';
    }
    return `Ошибка API: ${this.message}`;
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly errors: string[];

  constructor(
    message: string,
    errors: string[] = [],
    field?: string,
    context?: Record<string, unknown>
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, undefined, context);
    this.field = field;
    this.errors = errors;
  }

  toUserMessage(): string {
    if (this.errors.length > 0) {
      return this.errors.join('. ');
    }
    return this.message;
  }
}

/**
 * Audio-related errors
 */
export class AudioError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.AUDIO_PLAYBACK_ERROR,
    context?: Record<string, unknown>
  ) {
    super(message, code, undefined, context);
  }

  toUserMessage(): string {
    if (this.code === ErrorCode.AUDIO_CONTEXT_ERROR) {
      return 'Ошибка инициализации аудио. Перезагрузите страницу';
    }
    if (this.code === ErrorCode.AUDIO_LOADING_ERROR) {
      return 'Не удалось загрузить аудио файл';
    }
    if (this.code === ErrorCode.AUDIO_DECODE_ERROR) {
      return 'Формат аудио файла не поддерживается';
    }
    return 'Ошибка воспроизведения аудио';
  }
}

/**
 * Generation-related errors
 */
export class GenerationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.GENERATION_ERROR, undefined, context);
  }

  toUserMessage(): string {
    if (this.message.includes('credits') || this.message.includes('кредит')) {
      return 'Недостаточно кредитов. Пополните баланс SunoAPI';
    }
    return `Ошибка генерации: ${this.message}`;
  }
}

/**
 * Insufficient credits error
 */
export class InsufficientCreditsError extends AppError {
  public readonly required: number;
  public readonly available: number;

  constructor(required: number, available: number) {
    super(
      `Недостаточно кредитов. Требуется: ${required}, доступно: ${available}`,
      ErrorCode.INSUFFICIENT_CREDITS,
      undefined,
      { required, available }
    );
    this.required = required;
    this.available = available;
  }

  toUserMessage(): string {
    return 'Недостаточно кредитов. Пополните баланс SunoAPI для продолжения';
  }
}

/**
 * Storage errors
 */
export class StorageError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.STORAGE_ERROR,
    context?: Record<string, unknown>
  ) {
    super(message, code, undefined, context);
  }

  toUserMessage(): string {
    if (this.code === ErrorCode.QUOTA_EXCEEDED) {
      return 'Превышен лимит хранилища. Очистите данные браузера';
    }
    if (this.code === ErrorCode.UPLOAD_ERROR) {
      return 'Ошибка загрузки файла. Попробуйте снова';
    }
    if (this.code === ErrorCode.DOWNLOAD_ERROR) {
      return 'Ошибка скачивания файла. Попробуйте снова';
    }
    return 'Ошибка сохранения данных';
  }
}

/**
 * Result type for operations that can fail
 * Provides type-safe error handling without try-catch
 */
export type Result<T, E extends AppError = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function err<E extends AppError>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Wrap an async function to return Result instead of throwing
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(toAppError(error));
  }
}

/**
 * Wrap a sync function to return Result instead of throwing
 */
export function tryCatchSync<T>(fn: () => T): Result<T> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    return err(toAppError(error));
  }
}

/**
 * Helper function to convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return new NetworkError(error.message, { originalError: error });
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return new AppError(error.message, ErrorCode.TIMEOUT_ERROR);
    }
    
    if (message.includes('cors')) {
      return new AppError(error.message, ErrorCode.CORS_ERROR);
    }
    
    if (message.includes('credits') || message.includes('кредит') || message.includes('balance')) {
      return new GenerationError(error.message);
    }
    
    if (message.includes('audiocontext') || message.includes('audio context')) {
      return new AudioError(error.message, ErrorCode.AUDIO_CONTEXT_ERROR);
    }
    
    if (message.includes('decode') || message.includes('decoding')) {
      return new AudioError(error.message, ErrorCode.AUDIO_DECODE_ERROR);
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return new APIError(error.message, 401);
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return new APIError(error.message, 403);
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return new APIError(error.message, 404);
    }
    
    return new AppError(error.message, ErrorCode.UNKNOWN_ERROR);
  }

  // Handle non-Error objects
  const errorStr = String(error);
  return new AppError(errorStr, ErrorCode.UNKNOWN_ERROR, undefined, { error });
}

/**
 * Helper function to check if error is a specific type
 */
export function isErrorType(error: unknown, type: typeof AppError): boolean {
  return error instanceof type;
}

/**
 * Helper function to check if error has a specific code
 */
export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof AppError && error.code === code;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: AppError) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    shouldRetry = (e) => e.isRetryable(),
  } = options;

  let lastError: AppError | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = toAppError(error);
      
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }
      
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new AppError('Retry failed', ErrorCode.UNKNOWN_ERROR);
}
