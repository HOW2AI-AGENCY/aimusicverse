/**
 * Centralized error handling utilities for the application
 * Phase 4: Enhanced with comprehensive error codes, user-friendly messages, and recovery strategies
 */

import { toast } from 'sonner';
import { logger } from './logger';
import { 
  toAppError, 
  AppError, 
  NetworkError, 
  InsufficientCreditsError,
  GenerationError,
  ErrorCode,
  ErrorSeverity,
  RecoveryStrategy,
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
  // New error codes based on real error logs
  AUDIO_GENERATION_FAILED: {
    title: 'Ошибка генерации аудио',
    description: 'Не удалось создать аудио. Попробуйте другой промпт или модель.',
    canRetry: true,
  },
  INTERNAL_ERROR: {
    title: 'Внутренняя ошибка',
    description: 'Временная проблема на сервере. Попробуйте через несколько минут.',
    canRetry: true,
  },
  AUDIO_FETCH_FAILED: {
    title: 'Не удалось загрузить аудио',
    description: 'Проверьте, что файл доступен и не повреждён. Попробуйте загрузить другой файл.',
    canRetry: false,
  },
  AUDIO_PARSE_FAILED: {
    title: 'Не удалось обработать аудио',
    description: 'Файл повреждён или в неподдерживаемом формате. Используйте MP3 или WAV.',
    canRetry: false,
  },
  EXTEND_LYRICS_EMPTY: {
    title: 'Отсутствует текст для продолжения',
    description: 'Добавьте текст для продолжения трека или используйте инструментальный режим.',
    canRetry: false,
  },
  EXISTING_WORK_MATCHED: {
    title: 'Защищённый контент',
    description: 'Загруженное аудио соответствует существующему произведению. Используйте другой файл.',
    canRetry: false,
  },
  COVER_PROTECTED_CONTENT: {
    title: 'Аудио защищено авторским правом',
    description: 'Этот файл содержит защищённую музыку. Попробуйте загрузить оригинальную запись.',
    canRetry: false,
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

  // Pattern matching for common errors from real error logs
  const patterns: Array<{ match: (msg: string) => boolean; code: string }> = [
    { match: (msg) => msg.includes('prompt too long') || msg.includes('слишком длинн'), code: 'PROMPT_TOO_LONG' },
    { match: (msg) => msg.includes('model error'), code: 'MODEL_ERROR' },
    { match: (msg) => msg.includes('rate limit') || msg.includes('too many'), code: 'RATE_LIMIT' },
    { match: (msg) => msg.includes('audio generation failed'), code: 'AUDIO_GENERATION_FAILED' },
    { match: (msg) => msg.includes('internal error') || msg.includes('please try again later'), code: 'INTERNAL_ERROR' },
    { match: (msg) => msg.includes("can't fetch") || msg.includes('cannot fetch'), code: 'AUDIO_FETCH_FAILED' },
    { match: (msg) => msg.includes("can't parse") || msg.includes('source is corrupted'), code: 'AUDIO_PARSE_FAILED' },
    { match: (msg) => msg.includes('extending lyrics empty') || msg.includes('lyrics malformed') || msg.includes('too short, or malformed'), code: 'EXTEND_LYRICS_EMPTY' },
    { match: (msg) => msg.includes('artist name') || msg.includes("don't reference specific artists"), code: 'ARTIST_NAME_NOT_ALLOWED' },
    { match: (msg) => msg.includes('matches existing work') || msg.includes('existing work of art'), code: 'EXISTING_WORK_MATCHED' },
    { match: (msg) => msg.includes('uploaded audio') && msg.includes('protected'), code: 'COVER_PROTECTED_CONTENT' },
  ];

  for (const pattern of patterns) {
    if (pattern.match(errorMessage)) {
      const info = ERROR_CODE_MESSAGES[pattern.code];
      if (info) {
        toast.error(info.title, { description: info.description });
        return;
      }
    }
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
  
  // First check AppError's built-in retryable property
  if (appError.isRetryable()) {
    return true;
  }
  
  // Fallback to error code lookup
  const errorContext = appError.context as GenerationErrorResponse | undefined;
  const errorCode = errorContext?.errorCode;
  
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    return ERROR_CODE_MESSAGES[errorCode].canRetry;
  }
  
  return false;
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

/**
 * Get recovery action based on error
 */
export function getRecoveryAction(error: unknown): {
  strategy: RecoveryStrategy;
  message?: string;
  action?: () => void;
} {
  const appError = toAppError(error);
  const { recoveryStrategy, userActionRequired } = appError.metadata;
  
  switch (recoveryStrategy) {
    case RecoveryStrategy.RETRY:
    case RecoveryStrategy.RETRY_BACKOFF:
      return {
        strategy: recoveryStrategy,
        message: 'Попробуйте ещё раз',
      };
    case RecoveryStrategy.REAUTH:
      return {
        strategy: recoveryStrategy,
        message: 'Войдите в аккаунт',
        action: () => {
          import('@/hooks/useAppNavigate').then(({ navigateTo }) => {
            navigateTo('/auth');
          }).catch(() => {
            window.location.href = '/auth';
          });
        },
      };
    case RecoveryStrategy.REFRESH:
      return {
        strategy: recoveryStrategy,
        message: 'Перезагрузите страницу',
        action: () => window.location.reload(),
      };
    case RecoveryStrategy.MANUAL:
      return {
        strategy: recoveryStrategy,
        message: userActionRequired || 'Исправьте ошибку и попробуйте снова',
      };
    default:
      return {
        strategy: RecoveryStrategy.NONE,
      };
  }
}

/**
 * Common artist names that Suno API blocks
 * This is a subset - the API may block more
 */
const BLOCKED_ARTIST_PATTERNS = [
  // English artists
  /\b(taylor swift|ed sheeran|drake|beyonce|eminem|kanye|ariana grande|billie eilish|rihanna|justin bieber|lady gaga|katy perry|bruno mars|post malone|dua lipa|the weeknd|adele|coldplay|maroon 5|imagine dragons|bts|blackpink|twice|red velvet)\b/i,
  // Russian artists  
  /\b(моргенштерн|morgenshtern|тимати|timati|баста|basta|oxxxymiron|оксимирон|егор крид|егоркрид|egor creed|хаски|husky|скриптонит|scriptonite|фейс|pharaoh|фараон|miyagi|мияги|джизус|jah khalib|джах халиб|matrang|макс корж|max korzh|noize mc|нойз мс)\b/i,
];

/**
 * Check if prompt contains blocked artist names
 * Returns the matched artist name or null
 */
export function checkForBlockedArtists(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  for (const pattern of BLOCKED_ARTIST_PATTERNS) {
    const match = lowerText.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Validate prompt before generation
 * Returns error message or null if valid
 */
export function validatePromptForGeneration(prompt: string, style?: string): {
  valid: boolean;
  error?: string;
  suggestion?: string;
} {
  const textToCheck = `${prompt} ${style || ''}`;
  
  const blockedArtist = checkForBlockedArtists(textToCheck);
  if (blockedArtist) {
    return {
      valid: false,
      error: `Нельзя использовать имя "${blockedArtist}"`,
      suggestion: 'Опишите желаемый стиль без упоминания конкретных артистов',
    };
  }
  
  return { valid: true };
}

/**
 * Show error toast with recovery action
 */
export function showErrorWithRecovery(error: unknown): void {
  const appError = toAppError(error);
  const recovery = getRecoveryAction(error);
  
  const severity = appError.metadata.severity;
  const toastFn = severity === ErrorSeverity.FATAL || severity === ErrorSeverity.HIGH
    ? toast.error
    : severity === ErrorSeverity.MEDIUM
    ? toast.warning
    : toast.info;
  
  toastFn(appError.toUserMessage(), {
    description: recovery.message,
    action: recovery.action ? {
      label: recovery.message || 'Действие',
      onClick: recovery.action,
    } : undefined,
  });
}
