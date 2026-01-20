/**
 * Suno API Error Mapper
 * Feature: Sprint 032 - US-003 User-Friendly Error Messages
 *
 * Maps technical Suno API errors to user-friendly messages
 * with actionable next steps
 */

import { logger } from '@/lib/logger';

/**
 * Error codes from Suno API
 */
export enum SunoErrorCode {
  // Rate limiting
  RATE_LIMIT = 'RATE_LIMIT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Authentication/Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Input validation
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_AUDIO = 'INVALID_AUDIO',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Content policy
  CONTENT_FILTER = 'CONTENT_FILTER',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',

  // Credits/Billing
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  CREDIT_LIMIT_REACHED = 'CREDIT_LIMIT_REACHED',

  // Technical errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Generation errors
  GENERATION_FAILED = 'GENERATION_FAILED',
  GENERATION_TIMEOUT = 'GENERATION_TIMEOUT',
  INVALID_PROMPT = 'INVALID_PROMPT',

  // Audio processing
  AUDIO_PROCESSING_ERROR = 'AUDIO_PROCESSING_ERROR',
  AUDIO_TOO_LONG = 'AUDIO_TOO_LONG',
  AUDIO_FORMAT_UNSUPPORTED = 'AUDIO_FORMAT_UNSUPPORTED',

  // Unknown/Other
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * User-friendly error message
 */
export interface UserFriendlyError {
  title: string;
  message: string;
  action: string;
  retryable: boolean;
  code: SunoErrorCode;
  technical?: string; // For debugging
}

/**
 * Error message configurations
 */
const ERROR_MESSAGES: Record<SunoErrorCode, Omit<UserFriendlyError, 'code' | 'technical'>> = {
  // Rate limiting
  [SunoErrorCode.RATE_LIMIT]: {
    title: 'Слишком много запросов',
    message: 'Пожалуйста, подождите 2 минуты перед следующей генерацией.',
    action: 'Понятно',
    retryable: true,
  },
  [SunoErrorCode.RATE_LIMIT_EXCEEDED]: {
    title: 'Лимит запросов превышен',
    message: 'Вы достигли лимита генераций. Пожалуйста, подождите немного или получите больше кредитов.',
    action: 'Подождать',
    retryable: true,
  },
  [SunoErrorCode.TOO_MANY_REQUESTS]: {
    title: 'Слишком много запросов',
    message: 'Пожалуйста, подождите 1-2 минуты перед следующей попыткой.',
    action: 'Понятно',
    retryable: true,
  },
  [SunoErrorCode.QUOTA_EXCEEDED]: {
    title: 'Квота превышена',
    message: 'Вы исчерпали свою квоту генераций на сегодня. Получите больше кредитов или вернитесь завтра.',
    action: 'Получить кредиты',
    retryable: false,
  },

  // Authentication
  [SunoErrorCode.UNAUTHORIZED]: {
    title: 'Ошибка авторизации',
    message: 'Пожалуйста, войдите в систему снова.',
    action: 'Войти',
    retryable: false,
  },
  [SunoErrorCode.INVALID_API_KEY]: {
    title: 'Ошибка системы',
    message: 'Произошла ошибка при обработке запроса. Мы уже работаем над её исправлением.',
    action: 'Попробовать снова',
    retryable: true,
  },
  [SunoErrorCode.TOKEN_EXPIRED]: {
    title: 'Сессия истекла',
    message: 'Ваша сессия истекла. Пожалуйста, обновите страницу и войдите снова.',
    action: 'Обновить',
    retryable: false,
  },

  // Input validation
  [SunoErrorCode.INVALID_INPUT]: {
    title: 'Неверный ввод',
    message: 'Пожалуйста, проверьте введенные данные и попробуйте снова.',
    action: 'Исправить',
    retryable: false,
  },
  [SunoErrorCode.INVALID_AUDIO]: {
    title: 'Неверный формат аудио',
    message: 'Загрузите аудиофайл в формате MP3, WAV или M4A (макс. 10MB, до 2 минут).',
    action: 'Выбрать файл',
    retryable: false,
  },
  [SunoErrorCode.INVALID_REQUEST]: {
    title: 'Неверный запрос',
    message: 'Пожалуйста, проверьте параметры генерации и попробуйте снова.',
    action: 'Исправить',
    retryable: false,
  },
  [SunoErrorCode.MISSING_REQUIRED_FIELD]: {
    title: 'Заполните все поля',
    message: 'Пожалуйста, заполните обязательное поле: описание.',
    action: 'Заполнить',
    retryable: false,
  },

  // Content policy
  [SunoErrorCode.CONTENT_FILTER]: {
    title: 'Контент не прошел проверку',
    message: 'Ваш запрос содержит контент, который не соответствует нашим правилам. Пожалуйста, измените описание и попробуйте снова.',
    action: 'Изменить',
    retryable: false,
  },
  [SunoErrorCode.CONTENT_POLICY_VIOLATION]: {
    title: 'Нарушение правил контента',
    message: 'Ваш запрос содержит контент, который не может быть обработан. Пожалуйста, измените описание.',
    action: 'Изменить',
    retryable: false,
  },
  [SunoErrorCode.INAPPROPRIATE_CONTENT]: {
    title: 'Неподходящий контент',
    message: 'К сожалению, мы не можем создать такой контент. Пожалуйста, попробуйте другое описание.',
    action: 'Изменить',
    retryable: false,
  },

  // Credits/Billing
  [SunoErrorCode.INSUFFICIENT_CREDITS]: {
    title: 'Недостаточно кредитов',
    message: 'Для генерации нужно {required} кредитов. У вас осталось {balance}.',
    action: 'Пополнить баланс',
    retryable: false,
  },
  [SunoErrorCode.PAYMENT_REQUIRED]: {
    title: 'Требуется оплата',
    message: 'У вас закончились бесплатные генерации. Получите больше кредитов для продолжения.',
    action: 'Получить кредиты',
    retryable: false,
  },
  [SunoErrorCode.CREDIT_LIMIT_REACHED]: {
    title: 'Лимит кредитов достигнут',
    message: 'Вы достигли дневного лимита генераций. Вернитесь завтра или получите больше кредитов.',
    action: 'Получить кредиты',
    retryable: false,
  },

  // Technical errors
  [SunoErrorCode.NETWORK_ERROR]: {
    title: 'Ошибка соединения',
    message: 'Проверьте подключение к интернету и попробуйте снова.',
    action: 'Повторить',
    retryable: true,
  },
  [SunoErrorCode.SERVER_ERROR]: {
    title: 'Ошибка сервера',
    message: 'На наших серверах произошла ошибка. Мы уже работаем над её исправлением.',
    action: 'Попробовать снова',
    retryable: true,
  },
  [SunoErrorCode.TIMEOUT]: {
    title: 'Превышено время ожидания',
    message: 'Генерация заняла больше времени, чем обычно. Мы повторим попытку автоматически.',
    action: 'Подождать',
    retryable: true,
  },
  [SunoErrorCode.SERVICE_UNAVAILABLE]: {
    title: 'Сервис временно недоступен',
    message: 'Сервис генерации временно недоступен. Пожалуйста, попробуйте снова через несколько минут.',
    action: 'Попробовать снова',
    retryable: true,
  },

  // Generation errors
  [SunoErrorCode.GENERATION_FAILED]: {
    title: 'Генерация не удалась',
    message: 'К сожалению, не удалось создать трек. Пожалуйста, попробуйте снова с другим описанием.',
    action: 'Попробовать снова',
    retryable: true,
  },
  [SunoErrorCode.GENERATION_TIMEOUT]: {
    title: 'Генерация заняла слишком много времени',
    message: 'Генерация не завершилась вовремя. Мы попробуем снова автоматически.',
    action: 'Подождать',
    retryable: true,
  },
  [SunoErrorCode.INVALID_PROMPT]: {
    title: 'Неверное описание',
    message: 'Пожалуйста, используйте более конкретное описание. Например: "Энергичный рок с электрогитарами"',
    action: 'Изменить',
    retryable: false,
  },

  // Audio processing
  [SunoErrorCode.AUDIO_PROCESSING_ERROR]: {
    title: 'Ошибка обработки аудио',
    message: 'Не удалось обработать загруженный аудиофайл. Пожалуйста, попробуйте другой файл.',
    action: 'Выбрать другой',
    retryable: false,
  },
  [SunoErrorCode.AUDIO_TOO_LONG]: {
    title: 'Аудиофайл слишком длинный',
    message: 'Максимальная длина аудиофайла: 2 минуты. Пожалуйста, загрузите более короткий файл.',
    action: 'Выбрать другой',
    retryable: false,
  },
  [SunoErrorCode.AUDIO_FORMAT_UNSUPPORTED]: {
    title: 'Неподдерживаемый формат',
    message: 'Пожалуйста, загрузите файл в формате MP3, WAV или M4A.',
    action: 'Выбрать файл',
    retryable: false,
  },

  // Unknown
  [SunoErrorCode.UNKNOWN_ERROR]: {
    title: 'Произошла ошибка',
    message: 'К сожалению, произошла непредвиденная ошибка. Мы уже знаем о проблеме.',
    action: 'Попробовать снова',
    retryable: true,
  },
};

/**
 * Detect error code from error object or message
 */
export function detectErrorCode(error: any): SunoErrorCode {
  // Error code explicitly provided
  if (error.code && Object.values(SunoErrorCode).includes(error.code)) {
    return error.code as SunoErrorCode;
  }

  // Error message pattern matching
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.statusCode;

  // Status code mapping
  if (status === 429) return SunoErrorCode.RATE_LIMIT;
  if (status === 401) return SunoErrorCode.UNAUTHORIZED;
  if (status === 402) return SunoErrorCode.INSUFFICIENT_CREDITS;
  if (status === 400) return SunoErrorCode.INVALID_INPUT;
  if (status >= 500) return SunoErrorCode.SERVER_ERROR;
  if (status === 503) return SunoErrorCode.SERVICE_UNAVAILABLE;

  // Message pattern matching
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return SunoErrorCode.RATE_LIMIT;
  }
  if (message.includes('quota') || message.includes('exceeded')) {
    return SunoErrorCode.QUOTA_EXCEEDED;
  }
  if (message.includes('unauthorized') || message.includes('not authenticated')) {
    return SunoErrorCode.UNAUTHORIZED;
  }
  if (message.includes('invalid audio') || message.includes('audio format')) {
    return SunoErrorCode.INVALID_AUDIO;
  }
  if (message.includes('content') && (message.includes('filter') || message.includes('policy'))) {
    return SunoErrorCode.CONTENT_FILTER;
  }
  if (message.includes('credit') || message.includes('insufficient')) {
    return SunoErrorCode.INSUFFICIENT_CREDITS;
  }
  if (message.includes('network') || message.includes('fetch')) {
    return SunoErrorCode.NETWORK_ERROR;
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return SunoErrorCode.TIMEOUT;
  }
  if (message.includes('generation') && message.includes('fail')) {
    return SunoErrorCode.GENERATION_FAILED;
  }

  // Default to unknown
  return SunoErrorCode.UNKNOWN_ERROR;
}

/**
 * Map error to user-friendly format
 */
export function mapSunoError(
  error: any,
  context?: {
    requiredCredits?: number;
    balanceCredits?: number;
  }
): UserFriendlyError {
  const errorCode = detectErrorCode(error);
  const baseMessage = ERROR_MESSAGES[errorCode];

  // Format message with context variables
  let message = baseMessage.message;
  if (context) {
    message = message
      .replace('{required}', String(context.requiredCredits || '?'))
      .replace('{balance}', String(context.balanceCredits || 0));
  }

  const result: UserFriendlyError = {
    ...baseMessage,
    message,
    code: errorCode,
    technical: error.message || String(error),
  };

  // Log error for debugging
  logger.error('Suno error mapped to user-friendly format', {
    errorCode,
    title: result.title,
    retryable: result.retryable,
    originalError: error,
    context,
  });

  return result;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const mapped = mapSunoError(error);
  return mapped.retryable;
}

/**
 * Get retry delay for exponential backoff
 */
export function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
  return Math.min(1000 * Math.pow(2, attempt), 16000);
}

/**
 * Suno error class for throwing
 */
export class SunoError extends Error {
  constructor(
    public code: SunoErrorCode,
    message?: string,
    public originalError?: any
  ) {
    super(message || ERROR_MESSAGES[code].message);
    this.name = 'SunoError';
  }
}

/**
 * Create a SunoError from any error
 */
export function createSunoError(error: any): SunoError {
  const code = detectErrorCode(error);
  return new SunoError(code, error.message, error);
}
