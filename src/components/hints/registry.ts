/**
 * Canonical catalog of all in-app hint texts.
 *
 * Single source of truth. All other hint registries (FEATURE_TIPS,
 * CONTEXTUAL_TIPS, etc.) re-export from here.
 *
 * id convention: `kebab-case`. Aliases (legacy snake_case ids used by
 * older overlays) are listed below and resolve to the same entry.
 */

export type HintContext =
  | 'library'
  | 'player'
  | 'studio'
  | 'generation'
  | 'social';

export interface HintEntry {
  id: string;
  title: string;
  message: string;
  emoji?: string;
  context: HintContext;
  /** Lower runs first when several tips queue for the same context. */
  priority: number;
}

export const HINT_REGISTRY = {
  // ─── library ─────────────────────────────────────────────────────────
  'swipe-gesture': {
    id: 'swipe-gesture',
    title: 'Жесты свайпа',
    message:
      'Свайпните трек влево для добавления в очередь, вправо — для смены версии',
    emoji: '👆',
    priority: 1,
    context: 'library',
  },
  'version-badge': {
    id: 'version-badge',
    title: 'Версии A/B',
    message:
      'Нажмите на бейдж версии для переключения между A и B вариантами',
    emoji: '🔄',
    priority: 2,
    context: 'library',
  },
  'track-menu': {
    id: 'track-menu',
    title: 'Меню трека',
    message:
      'Откройте меню для доступа к стемам, кавер, расширению и другим функциям',
    emoji: '⋮',
    priority: 1,
    context: 'library',
  },

  // ─── player ──────────────────────────────────────────────────────────
  'waveform-seek': {
    id: 'waveform-seek',
    title: 'Перемотка по волне',
    message: 'Нажмите на waveform для перехода к нужному моменту трека',
    emoji: '📊',
    priority: 2,
    context: 'player',
  },
  'queue-management': {
    id: 'queue-management',
    title: 'Очередь воспроизведения',
    message: 'Управляйте очередью: перетаскивайте треки для изменения порядка',
    emoji: '📋',
    priority: 3,
    context: 'player',
  },
  'repeat-modes': {
    id: 'repeat-modes',
    title: 'Режимы повтора',
    message:
      'Нажимайте на кнопку повтора для переключения: все → один → выключено',
    emoji: '🔁',
    priority: 3,
    context: 'player',
  },

  // ─── studio ──────────────────────────────────────────────────────────
  'studio-first-open': {
    id: 'studio-first-open',
    title: 'Добро пожаловать в Студию!',
    message: 'Здесь вы можете редактировать стемы, микшировать и экспортировать',
    emoji: '🎛️',
    priority: 1,
    context: 'studio',
  },
  'stem-mixing': {
    id: 'stem-mixing',
    title: 'Микшер стемов',
    message: 'Регулируйте громкость каждого стема для идеального микса',
    emoji: '🎚️',
    priority: 1,
    context: 'studio',
  },
  'effects-panel': {
    id: 'effects-panel',
    title: 'Эффекты',
    message: 'Добавляйте реверб, эхо и другие эффекты к отдельным стемам',
    emoji: '✨',
    priority: 2,
    context: 'studio',
  },
  'cover-action': {
    id: 'cover-action',
    title: 'AI-кавер',
    message: 'Создайте кавер-версию в любом жанре',
    emoji: '🎤',
    priority: 2,
    context: 'studio',
  },
  'extend-action': {
    id: 'extend-action',
    title: 'Расширение трека',
    message: 'Продлите трек, добавив новые секции',
    emoji: '➕',
    priority: 2,
    context: 'studio',
  },
  'lyrics-ai': {
    id: 'lyrics-ai',
    title: 'AI-помощник для текстов',
    message: 'Генерируйте и редактируйте тексты с помощью AI',
    emoji: '✍️',
    priority: 1,
    context: 'studio',
  },
  recording: {
    id: 'recording',
    title: 'Запись',
    message: 'Записывайте вокал или инструменты прямо поверх трека',
    emoji: '🎙️',
    priority: 2,
    context: 'studio',
  },
  'chord-detection': {
    id: 'chord-detection',
    title: 'Определение аккордов',
    message: 'AI автоматически определит аккорды вашей записи',
    emoji: '🎸',
    priority: 3,
    context: 'studio',
  },

  // ─── generation ──────────────────────────────────────────────────────
  'quick-presets': {
    id: 'quick-presets',
    title: 'Быстрые пресеты',
    message: 'Используйте готовые стили для мгновенной генерации',
    emoji: '⚡',
    priority: 1,
    context: 'generation',
  },
  'reference-audio': {
    id: 'reference-audio',
    title: 'Референсное аудио',
    message: 'Загрузите аудио-референс для создания трека в похожем стиле',
    emoji: '🎯',
    priority: 2,
    context: 'generation',
  },
  'quick-create-first': {
    id: 'quick-create-first',
    title: 'Создайте первый трек',
    message:
      'Нажмите «Создать трек», опишите музыку словами — AI создаст трек за минуту. Стоимость: 10–12 кредитов.',
    emoji: '✨',
    priority: 0,
    context: 'generation',
  },

  // ─── social ──────────────────────────────────────────────────────────
  'share-options': {
    id: 'share-options',
    title: 'Поделиться',
    message: 'Делитесь треками в Telegram Stories или копируйте ссылку',
    emoji: '🚀',
    priority: 2,
    context: 'social',
  },
  'playlist-creation': {
    id: 'playlist-creation',
    title: 'Создание плейлиста',
    message: 'Организуйте треки в плейлисты для удобного доступа',
    emoji: '📂',
    priority: 3,
    context: 'social',
  },
} as const satisfies Record<string, HintEntry>;

export type HintId = keyof typeof HINT_REGISTRY;

/**
 * Legacy snake_case ids → canonical kebab-case ids.
 * Used by old overlays that hardcoded snake_case strings.
 */
export const HINT_ALIASES: Record<string, HintId> = {
  studio_first_open: 'studio-first-open',
  cover_action: 'cover-action',
  extend_action: 'extend-action',
  stem_mixer: 'stem-mixing',
  quick_preset: 'quick-presets',
  midi_export: 'lyrics-ai', // closest match; legacy entry retired
};

/** Resolve any id (canonical or legacy) to a registry entry. */
export function resolveHint(id: string): HintEntry | undefined {
  if (id in HINT_REGISTRY) return HINT_REGISTRY[id as HintId];
  const alias = HINT_ALIASES[id];
  return alias ? HINT_REGISTRY[alias] : undefined;
}

/** All hints scoped to a single context, ordered by priority. */
export function getHintsByContext(context: HintContext): HintEntry[] {
  return Object.values(HINT_REGISTRY)
    .filter((h) => h.context === context)
    .sort((a, b) => a.priority - b.priority);
}
