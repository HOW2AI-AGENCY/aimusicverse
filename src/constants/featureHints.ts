/**
 * Feature Hints - Contextual help messages for the app
 * Used with useHintTracking hook to show tips once per user
 */

export interface FeatureHint {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export const FEATURE_HINTS: Record<string, FeatureHint> = {
  // Recording hints
  RECORDING_FIRST_TIME: {
    id: 'recording-first-time',
    title: '🎤 Запись аудио',
    description: 'Записывайте голос или инструмент прямо в приложении. AI автоматически анализирует стиль.',
  },
  COVER_VS_EXTEND: {
    id: 'cover-vs-extend',
    title: '💡 Кавер или расширение?',
    description: 'Кавер создаёт новую версию в другом стиле. Расширение продолжает трек, добавляя новые части.',
  },
  CLOUD_AUDIO: {
    id: 'cloud-audio',
    title: '☁️ Облачное хранение',
    description: 'Все записи автоматически сохраняются в облако. Вы можете использовать их в любой момент.',
  },
  REFERENCE_ANALYSIS: {
    id: 'reference-analysis',
    title: '✨ Анализ референса',
    description: 'AI анализирует стиль, темп и настроение референса для более точной генерации.',
  },
  
  // Studio hints
  STEM_MIXING: {
    id: 'stem-mixing',
    title: '🎚️ Микширование стемов',
    description: 'Регулируйте громкость каждого стема (вокал, бас, ударные) для идеального микса.',
  },
  GUITAR_CHORDS: {
    id: 'guitar-chords',
    title: '🎸 Распознавание аккордов',
    description: 'Играйте на гитаре — AI распознает аккорды в реальном времени и покажет диаграммы.',
  },
  
  // Generation hints
  QUICK_PRESETS: {
    id: 'quick-presets',
    title: '⚡ Быстрые пресеты',
    description: 'Используйте готовые пресеты для быстрого старта. Настройте под себя позже.',
  },
  STYLE_TAGS: {
    id: 'style-tags',
    title: '🏷️ Теги стиля',
    description: 'Добавляйте теги для более точного описания желаемого стиля музыки.',
  },
  
  // Player hints
  SWIPE_GESTURE: {
    id: 'swipe-gesture',
    title: '👆 Свайп-жесты',
    description: 'Свайпните вправо для быстрого ремикса, влево — для добавления в плейлист.',
  },
  WAVEFORM_SEEK: {
    id: 'waveform-seek',
    title: '🌊 Навигация по волне',
    description: 'Нажмите на waveform для перемотки к нужному моменту трека.',
  },
};

/**
 * Get hint by ID with fallback
 */
export function getHint(id: string): FeatureHint | null {
  return Object.values(FEATURE_HINTS).find(h => h.id === id) || null;
}

/**
 * Hint IDs for type safety
 */
export const HINT_IDS = {
  RECORDING_FIRST_TIME: 'recording-first-time',
  COVER_VS_EXTEND: 'cover-vs-extend',
  CLOUD_AUDIO: 'cloud-audio',
  REFERENCE_ANALYSIS: 'reference-analysis',
  STEM_MIXING: 'stem-mixing',
  GUITAR_CHORDS: 'guitar-chords',
  QUICK_PRESETS: 'quick-presets',
  STYLE_TAGS: 'style-tags',
  SWIPE_GESTURE: 'swipe-gesture',
  WAVEFORM_SEEK: 'waveform-seek',
} as const;
