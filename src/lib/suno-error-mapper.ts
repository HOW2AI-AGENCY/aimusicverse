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
  hint?: string; // Contextual hint for what to do next
  faqLink?: string; // Link to relevant FAQ/help article
  examples?: string[]; // Example corrections for content policy errors
}

/**
 * FAQ/Help URLs
 */
const FAQ_URLS = {
  rateLimit: '/help/rate-limits',
  credits: '/help/credits',
  contentPolicy: '/help/content-policy',
  audioFormats: '/help/audio-formats',
  generation: '/help/generation-tips',
  troubleshooting: '/help/troubleshooting',
} as const;

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
    hint: 'Сервер обрабатывает много запросов. Попробуйте через 2 минуты — обычно этого достаточно.',
    faqLink: FAQ_URLS.rateLimit,
  },
  [SunoErrorCode.RATE_LIMIT_EXCEEDED]: {
    title: 'Лимит запросов превышен',
    message: 'Вы достигли лимита генераций. Пожалуйста, подождите немного или получите больше кредитов.',
    action: 'Подождать',
    retryable: true,
    hint: 'Лимит обычно сбрасывается каждый час. PRO-подписка увеличивает лимиты.',
    faqLink: FAQ_URLS.credits,
  },
  [SunoErrorCode.TOO_MANY_REQUESTS]: {
    title: 'Слишком много запросов',
    message: 'Пожалуйста, подождите 1-2 минуты перед следующей попыткой.',
    action: 'Понятно',
    retryable: true,
    hint: 'Делайте паузу 30 секунд между генерациями для стабильной работы.',
  },
  [SunoErrorCode.QUOTA_EXCEEDED]: {
    title: 'Квота превышена',
    message: 'Вы исчерпали свою квоту генераций на сегодня.',
    action: 'Получить кредиты',
    retryable: false,
    hint: 'Дневная квота обновляется в полночь по МСК. Подписка снимает ограничения.',
    faqLink: FAQ_URLS.credits,
  },

  // Authentication
  [SunoErrorCode.UNAUTHORIZED]: {
    title: 'Ошибка авторизации',
    message: 'Пожалуйста, войдите в систему снова.',
    action: 'Войти',
    retryable: false,
    hint: 'Попробуйте обновить страницу или выйти и войти заново.',
  },
  [SunoErrorCode.INVALID_API_KEY]: {
    title: 'Ошибка системы',
    message: 'Произошла ошибка при обработке запроса. Мы уже работаем над её исправлением.',
    action: 'Попробовать снова',
    retryable: true,
    hint: 'Это временная проблема на нашей стороне. Попробуйте через 5 минут.',
  },
  [SunoErrorCode.TOKEN_EXPIRED]: {
    title: 'Сессия истекла',
    message: 'Ваша сессия истекла. Пожалуйста, обновите страницу и войдите снова.',
    action: 'Обновить',
    retryable: false,
    hint: 'Нажмите F5 или потяните экран вниз для обновления.',
  },

  // Input validation
  [SunoErrorCode.INVALID_INPUT]: {
    title: 'Неверный ввод',
    message: 'Пожалуйста, проверьте введенные данные и попробуйте снова.',
    action: 'Исправить',
    retryable: false,
    hint: 'Убедитесь, что описание не пустое и содержит понятные слова.',
    faqLink: FAQ_URLS.generation,
  },
  [SunoErrorCode.INVALID_AUDIO]: {
    title: 'Неверный формат аудио',
    message: 'Загрузите аудиофайл в формате MP3, WAV или M4A.',
    action: 'Выбрать файл',
    retryable: false,
    hint: 'Максимальный размер: 10MB, длительность: до 2 минут. Попробуйте сжать файл онлайн.',
    faqLink: FAQ_URLS.audioFormats,
  },
  [SunoErrorCode.INVALID_REQUEST]: {
    title: 'Неверный запрос',
    message: 'Пожалуйста, проверьте параметры генерации и попробуйте снова.',
    action: 'Исправить',
    retryable: false,
    hint: 'Попробуйте упростить описание — короткие и конкретные промпты работают лучше.',
    faqLink: FAQ_URLS.generation,
  },
  [SunoErrorCode.MISSING_REQUIRED_FIELD]: {
    title: 'Заполните все поля',
    message: 'Пожалуйста, заполните обязательное поле: описание.',
    action: 'Заполнить',
    retryable: false,
    hint: 'Опишите желаемый стиль, настроение или инструменты.',
    examples: ['Энергичный рок с электрогитарами', 'Спокойный лоу-фай для учебы', 'Весёлая поп-музыка'],
  },

  // Content policy - ENHANCED with examples
  [SunoErrorCode.CONTENT_FILTER]: {
    title: 'Контент не прошел проверку',
    message: 'Ваш запрос содержит элементы, которые не могут быть обработаны.',
    action: 'Изменить',
    retryable: false,
    hint: 'Избегайте имён известных артистов, брендов и откровенного контента. Используйте описание стиля вместо имён.',
    faqLink: FAQ_URLS.contentPolicy,
    examples: [
      'Вместо "как Eminem" → "агрессивный рэп с быстрым флоу"',
      'Вместо "стиль Beatles" → "британский рок 60-х с гармониями"',
      'Вместо "голос Adele" → "мощный женский вокал с соулом"',
    ],
  },
  [SunoErrorCode.CONTENT_POLICY_VIOLATION]: {
    title: 'Нарушение правил контента',
    message: 'Ваш запрос содержит запрещённый контент.',
    action: 'Изменить',
    retryable: false,
    hint: 'Имена артистов, бренды, политический и откровенный контент запрещены. Опишите желаемый звук своими словами.',
    faqLink: FAQ_URLS.contentPolicy,
    examples: [
      'Опишите жанр: "хип-хоп", "рок", "электроника"',
      'Опишите настроение: "энергичный", "меланхоличный", "радостный"',
      'Опишите инструменты: "акустическая гитара", "синтезаторы", "живые барабаны"',
    ],
  },
  [SunoErrorCode.INAPPROPRIATE_CONTENT]: {
    title: 'Неподходящий контент',
    message: 'К сожалению, мы не можем создать такой контент.',
    action: 'Изменить',
    retryable: false,
    hint: 'Попробуйте более нейтральное описание без упоминания конкретных людей или брендов.',
    faqLink: FAQ_URLS.contentPolicy,
    examples: [
      'Используйте жанровые теги вместо имён',
      'Опишите звучание, а не исполнителя',
      'Фокусируйтесь на настроении и инструментах',
    ],
  },

  // Credits/Billing
  [SunoErrorCode.INSUFFICIENT_CREDITS]: {
    title: 'Недостаточно кредитов',
    message: 'Для генерации нужно {required} кредитов. У вас осталось {balance}.',
    action: 'Пополнить баланс',
    retryable: false,
    hint: 'Получите бесплатные кредиты за ежедневный вход, лайки и комментарии.',
    faqLink: FAQ_URLS.credits,
  },
  [SunoErrorCode.PAYMENT_REQUIRED]: {
    title: 'Требуется оплата',
    message: 'У вас закончились бесплатные генерации.',
    action: 'Получить кредиты',
    retryable: false,
    hint: 'PRO-подписка даёт 500 кредитов в месяц + бонусы за покупки.',
    faqLink: FAQ_URLS.credits,
  },
  [SunoErrorCode.CREDIT_LIMIT_REACHED]: {
    title: 'Лимит кредитов достигнут',
    message: 'Вы достигли дневного лимита генераций.',
    action: 'Получить кредиты',
    retryable: false,
    hint: 'Лимит сбрасывается в полночь. Подписка снимает дневные ограничения.',
    faqLink: FAQ_URLS.credits,
  },

  // Technical errors
  [SunoErrorCode.NETWORK_ERROR]: {
    title: 'Ошибка соединения',
    message: 'Проверьте подключение к интернету и попробуйте снова.',
    action: 'Повторить',
    retryable: true,
    hint: 'Попробуйте переключиться с Wi-Fi на мобильные данные или наоборот.',
    faqLink: FAQ_URLS.troubleshooting,
  },
  [SunoErrorCode.SERVER_ERROR]: {
    title: 'Ошибка сервера',
    message: 'На наших серверах произошла ошибка. Мы уже работаем над её исправлением.',
    action: 'Попробовать снова',
    retryable: true,
    hint: 'Обычно это временная проблема. Подождите 2-3 минуты и попробуйте снова.',
    faqLink: FAQ_URLS.troubleshooting,
  },
  [SunoErrorCode.TIMEOUT]: {
    title: 'Превышено время ожидания',
    message: 'Генерация заняла больше времени, чем обычно.',
    action: 'Подождать',
    retryable: true,
    hint: 'Сервер перегружен. Ваш запрос мог быть обработан — проверьте библиотеку через минуту.',
    faqLink: FAQ_URLS.troubleshooting,
  },
  [SunoErrorCode.SERVICE_UNAVAILABLE]: {
    title: 'Сервис временно недоступен',
    message: 'Сервис генерации временно недоступен.',
    action: 'Попробовать снова',
    retryable: true,
    hint: 'Возможно, идёт техническое обслуживание. Попробуйте через 10-15 минут.',
    faqLink: FAQ_URLS.troubleshooting,
  },

  // Generation errors
  [SunoErrorCode.GENERATION_FAILED]: {
    title: 'Генерация не удалась',
    message: 'К сожалению, не удалось создать трек.',
    action: 'Попробовать снова',
    retryable: true,
    hint: 'Попробуйте изменить описание — иногда небольшие изменения помогают.',
    faqLink: FAQ_URLS.generation,
    examples: [
      'Добавьте конкретный жанр',
      'Укажите темп: "быстрый", "медленный"',
      'Уточните настроение',
    ],
  },
  [SunoErrorCode.GENERATION_TIMEOUT]: {
    title: 'Генерация заняла слишком много времени',
    message: 'Генерация не завершилась вовремя.',
    action: 'Подождать',
    retryable: true,
    hint: 'Проверьте библиотеку через пару минут — трек мог быть создан в фоне.',
  },
  [SunoErrorCode.INVALID_PROMPT]: {
    title: 'Неверное описание',
    message: 'Пожалуйста, используйте более конкретное описание.',
    action: 'Изменить',
    retryable: false,
    hint: 'Хорошее описание содержит жанр + настроение + инструменты.',
    faqLink: FAQ_URLS.generation,
    examples: [
      'Энергичный рок с электрогитарами и мощными барабанами',
      'Нежная баллада с фортепиано и струнными',
      'Танцевальная электроника с басами и синтезаторами',
    ],
  },

  // Audio processing
  [SunoErrorCode.AUDIO_PROCESSING_ERROR]: {
    title: 'Ошибка обработки аудио',
    message: 'Не удалось обработать загруженный аудиофайл.',
    action: 'Выбрать другой',
    retryable: false,
    hint: 'Попробуйте конвертировать файл в MP3 с битрейтом 128-320 kbps.',
    faqLink: FAQ_URLS.audioFormats,
  },
  [SunoErrorCode.AUDIO_TOO_LONG]: {
    title: 'Аудиофайл слишком длинный',
    message: 'Максимальная длина аудиофайла зависит от выбранной модели.',
    action: 'Выбрать другой',
    retryable: false,
    hint: 'Используйте триммер в приложении или выберите модель с большим лимитом.',
    faqLink: FAQ_URLS.audioFormats,
  },
  [SunoErrorCode.AUDIO_FORMAT_UNSUPPORTED]: {
    title: 'Неподдерживаемый формат',
    message: 'Пожалуйста, загрузите файл в формате MP3, WAV или M4A.',
    action: 'Выбрать файл',
    retryable: false,
    hint: 'Конвертируйте файл онлайн на cloudconvert.com или используйте VLC.',
    faqLink: FAQ_URLS.audioFormats,
  },

  // Unknown
  [SunoErrorCode.UNKNOWN_ERROR]: {
    title: 'Произошла ошибка',
    message: 'К сожалению, произошла непредвиденная ошибка.',
    action: 'Попробовать снова',
    retryable: true,
    hint: 'Попробуйте обновить страницу. Если ошибка повторяется — напишите в поддержку.',
    faqLink: FAQ_URLS.troubleshooting,
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
