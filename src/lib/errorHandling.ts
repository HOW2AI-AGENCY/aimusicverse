/**
 * Centralized error handling utilities for the application
 * Enhanced with comprehensive error codes and user-friendly messages
 */

import { toast } from 'sonner';
import { logger } from './logger';
import { 
  toAppError, 
  AppError, 
  NetworkError, 
  InsufficientCreditsError,
  GenerationError,
  ErrorCode 
} from './errors/AppError';

/**
 * Error codes from backend with user-friendly messages
 */
const ERROR_CODE_MESSAGES: Record<string, { title: string; description: string; canRetry: boolean }> = {
  RATE_LIMIT: {
    title: 'Слишком много запросов',
    description: 'Подождите минуту и попробуйте снова',
    canRetry: true,
  },
  INSUFFICIENT_CREDITS: {
    title: 'Недостаточно кредитов',
    description: 'Пополните баланс для продолжения генерации',
    canRetry: false,
  },
  ARTIST_NAME_NOT_ALLOWED: {
    title: 'Имя артиста запрещено',
    description: 'Нельзя использовать имена известных артистов. Измените описание.',
    canRetry: false,
  },
  COPYRIGHTED_CONTENT: {
    title: 'Защищённый контент',
    description: 'Текст содержит защищённый материал. Измените слова.',
    canRetry: false,
  },
  MALFORMED_LYRICS: {
    title: 'Проблема с текстом',
    description: 'Проверьте структуру текста (куплеты, припевы). Добавьте метки [Verse], [Chorus].',
    canRetry: false,
  },
  GENERATION_FAILED: {
    title: 'Ошибка генерации',
    description: 'Попробуйте изменить описание или выбрать другую модель',
    canRetry: true,
  },
  MODEL_ERROR: {
    title: 'Ошибка модели AI',
    description: 'Система автоматически попробует другую модель',
    canRetry: true,
  },
  PROMPT_TOO_LONG: {
    title: 'Описание слишком длинное',
    description: 'Сократите описание до 500 символов или используйте режим Custom',
    canRetry: false,
  },
  NETWORK_ERROR: {
    title: 'Ошибка сети',
    description: 'Проверьте подключение к интернету и попробуйте снова',
    canRetry: true,
  },
  UNAUTHORIZED: {
    title: 'Требуется авторизация',
    description: 'Войдите в аккаунт для продолжения',
    canRetry: false,
  },
  TIMEOUT: {
    title: 'Превышено время ожидания',
    description: 'Сервер не ответил вовремя. Попробуйте ещё раз.',
    canRetry: true,
  },
  API_ERROR: {
    title: 'Ошибка сервиса',
    description: 'Сервис генерации временно недоступен. Попробуйте позже.',
    canRetry: true,
  },
};

/**
 * Parse API error response
 */
export interface GenerationErrorResponse {
  success: boolean;
  error: string;
  errorCode?: string;
  originalError?: string;
  canRetry?: boolean;
  retryAfter?: number;
  balance?: number;
  required?: number;
}

/**
 * Display a standardized error toast for generation failures
 * Enhanced with structured error codes from backend
 */
export function showGenerationError(error: unknown): void {
  const appError = toAppError(error);
  logger.error('Generation error', appError.toJSON());

  // Check if error contains structured error code
  const errorContext = appError.context as GenerationErrorResponse | undefined;
  const errorCode = errorContext?.errorCode;
  
  // Check for error code in message as fallback
  const errorMessage = appError.message?.toLowerCase() || '';
  
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    const { title, description } = ERROR_CODE_MESSAGES[errorCode];
    toast.error(title, { description });
    return;
  }

  // Pattern matching for common errors
  if (errorMessage.includes('prompt too long') || errorMessage.includes('слишком длинн')) {
    toast.error(ERROR_CODE_MESSAGES.PROMPT_TOO_LONG.title, {
      description: ERROR_CODE_MESSAGES.PROMPT_TOO_LONG.description,
    });
    return;
  }

  if (errorMessage.includes('model error')) {
    toast.error(ERROR_CODE_MESSAGES.MODEL_ERROR.title, {
      description: ERROR_CODE_MESSAGES.MODEL_ERROR.description,
    });
    return;
  }

  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    toast.error(ERROR_CODE_MESSAGES.RATE_LIMIT.title, {
      description: ERROR_CODE_MESSAGES.RATE_LIMIT.description,
    });
    return;
  }

  // Use type-specific error messages
  if (appError instanceof InsufficientCreditsError) {
    toast.error('Недостаточно кредитов', {
      description: appError.toUserMessage(),
    });
  } else if (appError instanceof NetworkError) {
    toast.error('Ошибка сети', {
      description: appError.toUserMessage(),
    });
  } else if (appError instanceof GenerationError) {
    toast.error('Ошибка генерации', {
      description: appError.toUserMessage(),
    });
  } else {
    toast.error('Ошибка генерации', {
      description: appError.toUserMessage() || 'Попробуйте еще раз',
    });
  }
}

/**
 * Check if an error is retriable based on error code
 */
export function isRetriableError(error: unknown): boolean {
  const appError = toAppError(error);
  const errorContext = appError.context as GenerationErrorResponse | undefined;
  const errorCode = errorContext?.errorCode;
  
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    return ERROR_CODE_MESSAGES[errorCode].canRetry;
  }
  
  // Default: most errors are retriable
  return true;
}

/**
 * Get error code information
 */
export function getErrorCodeInfo(errorCode: string): { title: string; description: string; canRetry: boolean } | null {
  return ERROR_CODE_MESSAGES[errorCode] || null;
}

/**
 * Parse error response from generation API
 */
export function parseGenerationError(response: any): GenerationErrorResponse {
  return {
    success: false,
    error: response?.error || 'Неизвестная ошибка',
    errorCode: response?.errorCode,
    originalError: response?.originalError,
    canRetry: response?.canRetry ?? true,
    retryAfter: response?.retryAfter,
    balance: response?.balance,
    required: response?.required,
  };
}
