/**
 * Animated progress bar utilities
 * For beautiful progress indicators in Telegram messages
 */

// Progress bar visual styles
export const PROGRESS_STYLES = {
  blocks: { empty: '░', filled: '▓' },
  dots: { empty: '○', filled: '●' },
  bars: { empty: '▱', filled: '▰' },
  circles: { empty: '◯', filled: '◉' },
  squares: { empty: '▫️', filled: '▪️' },
  modern: { empty: '⬜', filled: '🟩' },
  fire: { empty: '⬜', filled: '🔥' },
  music: { empty: '⬜', filled: '🎵' },
} as const;

// Spinner frames for animation
export const SPINNERS = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  clock: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],
  moon: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
  arrows: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  music: ['🎵', '🎶', '🎵', '🎶'],
} as const;

export type ProgressStyle = keyof typeof PROGRESS_STYLES;
export type SpinnerStyle = keyof typeof SPINNERS;

interface ProgressBarOptions {
  width?: number;
  style?: ProgressStyle;
  showPercent?: boolean;
  showEta?: boolean;
  etaSeconds?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Generate a text progress bar
 */
export function formatProgressBar(
  progress: number, // 0-100
  options: ProgressBarOptions = {}
): string {
  const {
    width = 10,
    style = 'blocks',
    showPercent = true,
    showEta = false,
    etaSeconds,
    prefix = '',
    suffix = '',
  } = options;
  
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const filledCount = Math.round((clampedProgress / 100) * width);
  const emptyCount = width - filledCount;
  
  const styleConfig = PROGRESS_STYLES[style];
  const bar = styleConfig.filled.repeat(filledCount) + styleConfig.empty.repeat(emptyCount);
  
  let result = `${prefix}${bar}${suffix}`;
  
  if (showPercent) {
    result += ` ${Math.round(clampedProgress)}%`;
  }
  
  if (showEta && etaSeconds !== undefined && etaSeconds > 0) {
    result += ` (${formatEta(etaSeconds)})`;
  }
  
  return result;
}

/**
 * Format estimated time remaining
 */
export function formatEta(seconds: number): string {
  if (seconds < 60) {
    return `~${Math.ceil(seconds)} сек`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `~${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `~${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
}

/**
 * Get spinner frame for animation
 */
export function getSpinnerFrame(
  frameIndex: number,
  style: SpinnerStyle = 'dots'
): string {
  const frames = SPINNERS[style];
  return frames[frameIndex % frames.length];
}

interface ProgressMessageOptions {
  showBar?: boolean;
  showSpinner?: boolean;
  spinnerStyle?: SpinnerStyle;
  barStyle?: ProgressStyle;
  icon?: string;
  showDetails?: boolean;
  details?: string;
}

/**
 * Create a formatted progress message
 */
export function createProgressMessage(
  title: string,
  progress: number,
  status: string,
  options: ProgressMessageOptions = {}
): string {
  const {
    showBar = true,
    showSpinner = true,
    spinnerStyle = 'dots',
    barStyle = 'blocks',
    icon = '⏳',
    showDetails = false,
    details,
  } = options;
  
  const lines: string[] = [];
  
  // Title with icon
  const spinner = showSpinner ? getSpinnerFrame(Math.floor(progress / 5), spinnerStyle) : '';
  lines.push(`${icon} *${escapeMarkdown(title)}*`);
  
  // Progress bar
  if (showBar) {
    lines.push('');
    lines.push(formatProgressBar(progress, { style: barStyle, showPercent: true }));
  }
  
  // Status with spinner
  lines.push('');
  lines.push(`${spinner} _${escapeMarkdown(status)}_`);
  
  // Additional details
  if (showDetails && details) {
    lines.push('');
    lines.push(`📋 ${escapeMarkdown(details)}`);
  }
  
  return lines.join('\n');
}

/**
 * Create upload progress message
 */
export function createUploadProgressMessage(
  fileName: string,
  progress: number,
  stage: 'uploading' | 'processing' | 'analyzing' | 'completing' | 'done' | 'error'
): string {
  const stageInfo: Record<typeof stage, { icon: string; status: string }> = {
    uploading: { icon: '📤', status: 'Загрузка файла...' },
    processing: { icon: '⚙️', status: 'Обработка...' },
    analyzing: { icon: '🔍', status: 'Анализ аудио...' },
    completing: { icon: '✨', status: 'Завершение...' },
    done: { icon: '✅', status: 'Готово!' },
    error: { icon: '❌', status: 'Ошибка!' },
  };
  
  const info = stageInfo[stage];
  const displayName = fileName.length > 25 ? fileName.slice(0, 22) + '...' : fileName;
  
  return createProgressMessage(displayName, progress, info.status, {
    icon: info.icon,
    showBar: stage !== 'done' && stage !== 'error',
    showSpinner: stage !== 'done' && stage !== 'error',
    barStyle: 'modern',
  });
}

/**
 * Create generation progress message
 */
export function createGenerationProgressMessage(
  prompt: string,
  progress: number,
  stage: 'queued' | 'generating' | 'rendering' | 'finalizing' | 'done' | 'error'
): string {
  const stageInfo: Record<typeof stage, { icon: string; status: string }> = {
    queued: { icon: '⏳', status: 'В очереди...' },
    generating: { icon: '🎵', status: 'Генерация музыки...' },
    rendering: { icon: '🎧', status: 'Рендеринг аудио...' },
    finalizing: { icon: '✨', status: 'Финализация...' },
    done: { icon: '✅', status: 'Трек готов!' },
    error: { icon: '❌', status: 'Ошибка генерации' },
  };
  
  const info = stageInfo[stage];
  const displayPrompt = prompt.length > 30 ? prompt.slice(0, 27) + '...' : prompt;
  
  return createProgressMessage(displayPrompt, progress, info.status, {
    icon: info.icon,
    showBar: stage !== 'done' && stage !== 'error',
    showSpinner: stage !== 'done' && stage !== 'error',
    spinnerStyle: 'music',
    barStyle: 'music',
  });
}

/**
 * Escape special characters for MarkdownV2
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, '\\$1');
}

/**
 * Progress stages with percentages
 */
export const PROGRESS_STAGES = {
  upload: {
    start: 0,
    uploading: 30,
    processing: 60,
    analyzing: 80,
    done: 100,
  },
  generation: {
    queued: 5,
    generating: 40,
    rendering: 70,
    finalizing: 90,
    done: 100,
  },
  separation: {
    start: 0,
    loading: 20,
    separating: 60,
    saving: 85,
    done: 100,
  },
} as const;
