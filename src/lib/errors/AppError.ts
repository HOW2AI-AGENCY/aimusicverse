/**
 * Application Error Hierarchy
 * Standardized error handling for typed error catching (IMP039)
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  
  // Audio errors
  AUDIO_CONTEXT_ERROR = 'AUDIO_CONTEXT_ERROR',
  AUDIO_LOADING_ERROR = 'AUDIO_LOADING_ERROR',
  AUDIO_PLAYBACK_ERROR = 'AUDIO_PLAYBACK_ERROR',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Generation errors
  GENERATION_ERROR = 'GENERATION_ERROR',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

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
    return 'Ошибка сохранения данных';
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
    
    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError(error.message, { originalError: error });
    }
    
    if (message.includes('timeout')) {
      return new AppError(error.message, ErrorCode.TIMEOUT_ERROR);
    }
    
    if (message.includes('credits') || message.includes('кредит')) {
      return new GenerationError(error.message);
    }
    
    if (message.includes('audiocontext')) {
      return new AudioError(error.message, ErrorCode.AUDIO_CONTEXT_ERROR);
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
