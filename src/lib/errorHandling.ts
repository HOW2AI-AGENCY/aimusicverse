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
 * Enhanced error info with hints and examples
 */
export interface ErrorCodeInfo {
  title: string;
  description: string;
  canRetry: boolean;
  hint?: string;
  examples?: string[];
  retryDelayMs?: number;
}

/**
 * Error codes from backend with user-friendly messages, hints, and examples
 */
export const ERROR_CODE_MESSAGES: Record<string, ErrorCodeInfo> = {
  RATE_LIMIT: {
    title: 'Слишком много запросов',
    description: 'Подождите минуту и попробуйте снова',
    canRetry: true,
    hint: 'Сервер обрабатывает много запросов. Подождите 1-2 минуты.',
    retryDelayMs: 60000,
  },
  INSUFFICIENT_CREDITS: {
    title: 'Недостаточно кредитов',
    description: 'Пополните баланс для продолжения генерации',
    canRetry: false,
    hint: 'Получите бесплатные кредиты за ежедневный вход, лайки и комментарии.',
  },
  ARTIST_NAME_NOT_ALLOWED: {
    title: 'Имя артиста запрещено',
    description: 'Нельзя использовать имена известных артистов.',
    canRetry: false,
    hint: 'Опишите желаемый стиль своими словами вместо упоминания артистов.',
    examples: [
      'Вместо "как Oxxxymiron" → "агрессивный рэп с быстрым флоу"',
      'Вместо "в стиле Скриптонит" → "атмосферный хип-хоп с трэп-битом"',
      'Вместо "голос как Adele" → "мощный женский вокал с соулом"',
    ],
  },
  COPYRIGHTED_CONTENT: {
    title: 'Защищённый контент',
    description: 'Текст содержит защищённый материал.',
    canRetry: false,
    hint: 'Перефразируйте текст своими словами или напишите оригинальный.',
    examples: [
      'Используйте собственные метафоры и образы',
      'Опишите идею песни, а не копируйте существующие тексты',
    ],
  },
  MALFORMED_LYRICS: {
    title: 'Проблема с текстом',
    description: 'Проверьте структуру текста.',
    canRetry: false,
    hint: 'Добавьте разделители секций и убедитесь, что текст не слишком короткий.',
    examples: [
      '[Verse]\nПервый куплет...',
      '[Chorus]\nПрипев...',
      '[Bridge]\nБридж (переход)...',
    ],
  },
  GENERATION_FAILED: {
    title: 'Ошибка генерации',
    description: 'Не удалось создать трек.',
    canRetry: true,
    hint: 'Попробуйте упростить описание или выбрать другую модель.',
    examples: [
      'Сократите описание до 2-3 ключевых характеристик',
      'Уберите противоречивые теги (например, "быстрый медленный")',
    ],
    retryDelayMs: 3000,
  },
  MODEL_ERROR: {
    title: 'Ошибка модели AI',
    description: 'Модель не смогла обработать запрос.',
    canRetry: true,
    hint: 'Попробуйте модель V4 — она стабильнее для сложных промптов.',
    retryDelayMs: 2000,
  },
  PROMPT_TOO_LONG: {
    title: 'Описание слишком длинное',
    description: 'Сократите описание до 500 символов.',
    canRetry: false,
    hint: 'В режиме Custom можно вынести детали в поле "Стиль".',
    examples: [
      'Краткое описание: "Энергичный поп-рок с женским вокалом"',
      'Детали в стиль: "электрогитары, мощные барабаны, позитивное настроение"',
    ],
  },
  NETWORK_ERROR: {
    title: 'Ошибка сети',
    description: 'Проверьте подключение к интернету.',
    canRetry: true,
    hint: 'Попробуйте переключиться с Wi-Fi на мобильные данные или наоборот.',
    retryDelayMs: 2000,
  },
  UNAUTHORIZED: {
    title: 'Требуется авторизация',
    description: 'Войдите в аккаунт для продолжения',
    canRetry: false,
    hint: 'Обновите страницу и войдите заново через Telegram.',
  },
  TIMEOUT: {
    title: 'Превышено время ожидания',
    description: 'Сервер не ответил вовремя.',
    canRetry: true,
    hint: 'Проверьте библиотеку через минуту — трек мог быть создан в фоне.',
    retryDelayMs: 5000,
  },
  API_ERROR: {
    title: 'Ошибка сервиса',
    description: 'Сервис генерации временно недоступен.',
    canRetry: true,
    hint: 'Обычно проблема решается в течение 5-10 минут.',
    retryDelayMs: 10000,
  },
  AUDIO_GENERATION_FAILED: {
    title: 'Ошибка генерации аудио',
    description: 'Не удалось создать аудио.',
    canRetry: true,
    hint: 'Попробуйте другую модель или упростите промпт.',
    examples: [
      'Модель V4 лучше для сложных текстов',
      'V5 даёт лучшее качество для инструментальных треков',
    ],
    retryDelayMs: 3000,
  },
  INTERNAL_ERROR: {
    title: 'Внутренняя ошибка',
    description: 'Временная проблема на сервере.',
    canRetry: true,
    hint: 'Подождите 2-3 минуты и попробуйте снова.',
    retryDelayMs: 5000,
  },
  AUDIO_FETCH_FAILED: {
    title: 'Не удалось загрузить аудио',
    description: 'Файл недоступен или повреждён.',
    canRetry: false,
    hint: 'Проверьте, что файл открывается в плеере, и попробуйте загрузить другой.',
  },
  AUDIO_PARSE_FAILED: {
    title: 'Не удалось обработать аудио',
    description: 'Файл повреждён или в неподдерживаемом формате.',
    canRetry: false,
    hint: 'Используйте MP3 или WAV формат. Попробуйте конвертировать файл онлайн.',
  },
  EXTEND_LYRICS_EMPTY: {
    title: 'Отсутствует текст для продолжения',
    description: 'Добавьте текст или используйте инструментальный режим.',
    canRetry: false,
    hint: 'Добавьте хотя бы 4-8 строк текста для продолжения трека.',
    examples: [
      '[Continue]\nПродолжение истории...',
      'Или включите "Инструментал" для трека без слов',
    ],
  },
  EXISTING_WORK_MATCHED: {
    title: 'Защищённый контент',
    description: 'Аудио соответствует существующему произведению.',
    canRetry: false,
    hint: 'Загрузите оригинальную запись или используйте другой референс.',
  },
  COVER_PROTECTED_CONTENT: {
    title: 'Аудио защищено авторским правом',
    description: 'Файл содержит защищённую музыку.',
    canRetry: false,
    hint: 'Для кавера используйте собственную запись мелодии или минус.',
  },
  SERVER_OVERLOADED: {
    title: 'Сервер перегружен',
    description: 'Слишком много запросов от всех пользователей.',
    canRetry: true,
    hint: 'Лучшее время для генерации: утро (6-10 МСК) или поздний вечер (22-02 МСК).',
    retryDelayMs: 30000,
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
 * Detect error code from error message
 */
function detectErrorCodeFromMessage(message: string): string | null {
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
    { match: (msg) => msg.includes('server') && (msg.includes('overload') || msg.includes('busy') || msg.includes('500')), code: 'SERVER_OVERLOADED' },
    { match: (msg) => msg.includes('timeout') || msg.includes('timed out'), code: 'TIMEOUT' },
    { match: (msg) => msg.includes('network') || msg.includes('fetch failed'), code: 'NETWORK_ERROR' },
  ];

  for (const pattern of patterns) {
    if (pattern.match(message)) {
      return pattern.code;
    }
  }
  return null;
}

/**
 * Get error info with hints and examples
 */
export function getEnhancedErrorInfo(error: unknown): ErrorCodeInfo | null {
  const appError = toAppError(error);
  const errorContext = appError.context as GenerationErrorResponse | undefined;
  const errorCode = errorContext?.errorCode;
  const errorMessage = appError.message?.toLowerCase() || '';
  
  // Check explicit error code first
  if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
    return ERROR_CODE_MESSAGES[errorCode];
  }
  
  // Pattern match from message
  const detectedCode = detectErrorCodeFromMessage(errorMessage);
  if (detectedCode && ERROR_CODE_MESSAGES[detectedCode]) {
    return ERROR_CODE_MESSAGES[detectedCode];
  }
  
  return null;
}

/**
 * Display a standardized error toast for generation failures
 * Enhanced with structured error codes, hints, and examples
 */
export function showGenerationError(error: unknown): void {
  const appError = toAppError(error);
  logger.error('Generation error', appError.toJSON());

  const errorInfo = getEnhancedErrorInfo(error);
  
  if (errorInfo) {
    // Show error with hint
    const description = errorInfo.hint 
      ? `${errorInfo.description} ${errorInfo.hint}`
      : errorInfo.description;
    
    toast.error(errorInfo.title, { 
      description,
      duration: errorInfo.canRetry ? 8000 : 10000,
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
      description: appError.toUserMessage() + ' Попробуйте переключиться с Wi-Fi на мобильные данные.',
    });
  } else if (appError instanceof GenerationError) {
    toast.error('Ошибка генерации', {
      description: appError.toUserMessage() + ' Попробуйте упростить описание.',
    });
  } else {
    toast.error('Ошибка генерации', {
      description: appError.toUserMessage() || 'Попробуйте изменить описание или повторить позже.',
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
  
  // Use enhanced error info lookup
  const errorInfo = getEnhancedErrorInfo(error);
  if (errorInfo) {
    return errorInfo.canRetry;
  }
  
  return false;
}

/**
 * Get retry delay for an error (with backoff support)
 */
export function getRetryDelayForError(error: unknown, attempt: number = 0): number {
  const errorInfo = getEnhancedErrorInfo(error);
  
  // Use error-specific delay if available
  const baseDelay = errorInfo?.retryDelayMs ?? 2000;
  
  // Apply exponential backoff: baseDelay * 2^attempt
  return Math.min(baseDelay * Math.pow(2, attempt), 60000);
}

/**
 * Get error code information
 */
export function getErrorCodeInfo(errorCode: string): ErrorCodeInfo | null {
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
 * IMPORTANT: Only include names that are ACTUAL artists
 * Do NOT include common Russian words/names that cause false positives:
 * - "magazin", "lenka", "karina", "chika", "poli", "девочка", "миша", "аня", "класс", "максим"
 */
const BLOCKED_ARTIST_PATTERNS = [
  // English artists - ONLY well-known artists, no common words
  /\b(taylor swift|ed sheeran|beyonce|eminem|kanye west|ariana grande|billie eilish|rihanna|justin bieber|lady gaga|katy perry|bruno mars|post malone|dua lipa|the weeknd|adele|coldplay|maroon 5|imagine dragons|bts|blackpink|twice|red velvet|akon|shakira|pitbull|nicki minaj|cardi b|travis scott|kendrick lamar|j cole|lil wayne|metro boomin|bad bunny|ozuna|daddy yankee|maluma|j balvin|rosalia|doja cat|megan thee stallion|lizzo|harry styles|olivia rodrigo|demi lovato|selena gomez|miley cyrus|nick jonas|shawn mendes|camila cabello|charlie puth|one direction|twenty one pilots|panic at the disco|fall out boy|my chemical romance|green day|blink 182|linkin park|nirvana|pink floyd|led zeppelin|metallica|guns n roses|bon jovi|aerosmith)\b/i,
  // Russian artists - only real confirmed blocked artists, NO common words
  /\b(моргенштерн|morgenshtern|тимати|timati|баста|oxxxymiron|оксимирон|егор крид|егоркрид|egor creed|скриптонит|scriptonite|pharaoh|фараон|miyagi|мияги|jah khalib|джах халиб|matrang|макс корж|max korzh|noize mc|нойз мс|ленинград|leningrad|земфира|zemfira|алла пугачёва|alla pugacheva|филипп киркоров|kirkorov|дима билан|dima bilan|полина гагарина|polina gagarina|григорий лепс|валерий меладзе|meladze|лобода|loboda|монеточка|monetochka|slava marlow|слава марлоу|big baby tape|биг бейби тейп|gone fludd|boulevarddepo|бульвар депо|kizaru|кизару)\b/i,
  // K-Pop artists - only group names that are distinctive
  /\b(g-idle|aespa|newjeans|stray kids|le sserafim|nmixx|enhypen|shinee|super junior|girls generation|snsd|2ne1|bigbang)\b/i,
  // African and EDM artists - only distinctive names
  /\b(wizkid|davido|burna boy|asake|ckay|fireboy dml|ayra starr|joeboy|omah lay|skrillex|deadmau5|marshmello|daft punk|david guetta|calvin harris|tiesto|avicii|martin garrix|kygo|alan walker|zedd|steve aoki|diplo|major lazer|afrojack|hardwell|armin van buuren|karol g|becky g|rauw alejandro|jhay cortez)\b/i,
];

/**
 * Words to EXCLUDE from artist detection (common Russian words/names)
 * These cause false positives because they match artist regex but are regular words
 * Phase 1.1: Extended based on error log analysis (magazin, misha, karina, chika, lenka)
 */
const FALSE_POSITIVE_WORDS = [
  // Common Russian words that cause most false positives (from error logs)
  'magazin', 'магазин', 'магазина', 'магазине', 'магазину', 'магазины', 'магазинов',
  'lenka', 'ленка', 'ленке', 'ленку', 'ленки', 'лена', 'лене', 'лену', 'лены',
  'karina', 'карина', 'карине', 'карину', 'карины', 'каринка', 'каринке',
  'chika', 'девочка', 'девочки', 'девочке', 'девочку', 'девчонка', 'девчонки',
  'poli', 'поли', 'polina', 'полина', 'полине', 'полину', 'полины',
  
  // Common Russian names (extended)
  'миша', 'мише', 'мишу', 'миши', 'misha', 'мишка', 'мишке', 'михаил', 'михаила',
  'аня', 'ане', 'аню', 'ани', 'ania', 'anna', 'анна', 'анне', 'анну',
  'катя', 'кате', 'катю', 'кати', 'katya', 'катька', 'екатерина',
  'даша', 'даше', 'дашу', 'даши', 'dasha', 'дарья', 'дарье',
  'саша', 'саше', 'сашу', 'саши', 'sasha', 'александр', 'александра',
  'максим', 'максима', 'максиму', 'максиме', 'maksim', 'макс', 'максу',
  'никита', 'никите', 'никиту', 'никиты', 'nikita',
  'андрей', 'андрею', 'андрея', 'andrey',
  'алексей', 'алексею', 'алексея', 'aleksey', 'лёша', 'лёше',
  'дима', 'диме', 'диму', 'димы', 'dima', 'дмитрий',
  'ваня', 'ване', 'ваню', 'вани', 'vanya', 'иван', 'ивану',
  'настя', 'насте', 'настю', 'насти', 'nastya', 'анастасия',
  'оля', 'оле', 'олю', 'оли', 'olya', 'ольга', 'ольге',
  'юля', 'юле', 'юлю', 'юли', 'julia', 'юлия', 'юлии',
  'маша', 'маше', 'машу', 'маши', 'masha', 'мария', 'марии',
  'вика', 'вике', 'вику', 'вики', 'vika', 'виктория',
  'лиза', 'лизе', 'лизу', 'лизы', 'liza', 'елизавета',
  'таня', 'тане', 'таню', 'тани', 'tanya', 'татьяна',
  
  // Common Russian words
  'класс', 'классе', 'классу', 'класса', 'klass', 'классный', 'классно',
  'queen', 'королева', 'королеве', 'королеву', // "queen" is too common
  'drake', 'дракон', 'драконе', // common word for "дракон" context
  'future', 'будущее', 'будущего', // too common
  'teni', 'тени', 'тень', 'теней', // shadows in Russian
  'mejja',
  'ive', // too short, matches "I've"
  'seventeen', 'семнадцать', // number
  'exo', 'nct', 'txt', 'psy', // too short
  'itzy', 'gidle',
  'lany', 'mirami', 'мирами',
  'rema', 'mora', 'feid', 'anuel',
  'tena', 'хаски', 'husky', // husky is a dog breed
  'nervy', 'нервы', 'нерв', // common word "nerves"
  'mot', 'мот', 'мотор', // can be common word
  'face', 'фэйс', 'фейс', 'лицо', // common word
  'элджей', 'yelzey', 'mayot', 'clipz', 'платина', 'platina',
  'thomas mraz', 'томас мраз',
  'сектор газа', 'sektor gaza', // only block if explicitly "in style of"
  
  // Extended from recent error logs
  'марина', 'марине', 'марину', 'марины', 'marina',
  'света', 'свете', 'свету', 'светы', 'svetlana', 'светлана',
  'natasha', 'наташа', 'наташе', 'наташу',
  'sasha', 'паша', 'паше', 'пашу', 'pasha',
  'серёжа', 'сереже', 'серёжу', 'sergey', 'сергей',
  'костя', 'косте', 'костю', 'kostya', 'константин',
  'петя', 'пете', 'петю', 'petya', 'пётр',
  'gena', 'гена', 'гене', 'гену', 'геннадий',
];

/**
 * Check if prompt contains blocked artist names
 * Returns the matched artist name or null
 * Now with false positive filtering
 */
export function checkForBlockedArtists(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  // Check if text contains context indicating artist reference
  const artistContextPatterns = [
    /в стиле\s+/i,
    /как у\s+/i,
    /похоже на\s+/i,
    /типа\s+/i,
    /like\s+/i,
    /similar to\s+/i,
    /style of\s+/i,
    /звучит как\s+/i,
    /голосом\s+/i,
  ];
  
  const hasArtistContext = artistContextPatterns.some(p => p.test(lowerText));
  
  for (const pattern of BLOCKED_ARTIST_PATTERNS) {
    const match = lowerText.match(pattern);
    if (match) {
      const matchedWord = match[0].toLowerCase();
      
      // Skip if it's a known false positive word and no artist context
      if (!hasArtistContext && FALSE_POSITIVE_WORDS.some(fp => 
        matchedWord === fp.toLowerCase() || matchedWord.includes(fp.toLowerCase())
      )) {
        continue;
      }
      
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
