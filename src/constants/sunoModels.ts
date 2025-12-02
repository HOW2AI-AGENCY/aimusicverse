/**
 * Suno AI model configurations
 * Used across the application for model selection
 */
export const SUNO_MODELS = {
  V5: { name: 'V5', desc: 'Новейшая модель, быстрая генерация', emoji: '🚀' },
  V4_5PLUS: { name: 'V4.5+', desc: 'Богатый звук, до 8 мин', emoji: '💎' },
  V4_5ALL: { name: 'V4.5 All', desc: 'Лучшая структура, до 8 мин', emoji: '🎯' },
  V4_5: { name: 'V4.5', desc: 'Быстро, качественно, до 8 мин', emoji: '⚡' },
  V4: { name: 'V4', desc: 'Классика, до 4 мин', emoji: '🎵' },
} as const;

export type SunoModelKey = keyof typeof SUNO_MODELS;
