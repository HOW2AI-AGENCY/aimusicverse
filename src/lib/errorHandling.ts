/**
 * Centralized error handling utilities for the application
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
  
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    const { title, description } = ERROR_CODE_MESSAGES[errorCode];
    toast.error(title, { description });
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
  };
}

/**
 * Clean up localStorage for audio references in error scenarios
 */
export function cleanupAudioReference(): void {
  try {
    localStorage.removeItem('stem_audio_reference');
    logger.info('Audio reference cleaned up from localStorage');
  } catch (error) {
    logger.error('Failed to cleanup audio reference', { error });
  }
}
