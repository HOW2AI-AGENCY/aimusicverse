/**
 * Suno AI model configurations
 * Synchronized with suno_models database table
 * 
 * Model mapping:
 * - V5 = chirp-crow (latest)
 * - V4_5PLUS = chirp-bluejay (active)
 * - V4_5ALL = chirp-auk (active) - default
 * - V4 = chirp-v4 (active)
 */
export const SUNO_MODELS = {
  V5: { 
    name: 'V5', 
    desc: 'Новейшая модель, быстрая генерация', 
    emoji: '🚀',
    apiModel: 'chirp-crow',
    status: 'latest'
  },
  V4_5PLUS: { 
    name: 'V4.5+', 
    desc: 'Богатый звук, до 8 мин', 
    emoji: '💎',
    apiModel: 'chirp-bluejay',
    status: 'active'
  },
  V4_5ALL: { 
    name: 'V4.5 All', 
    desc: 'Лучшая структура, до 8 мин', 
    emoji: '🎯',
    apiModel: 'chirp-auk',
    status: 'active'
  },
  V4: { 
    name: 'V4', 
    desc: 'Классика, до 4 мин', 
    emoji: '🎵',
    apiModel: 'chirp-v4',
    status: 'active'
  },
} as const;

export type SunoModelKey = keyof typeof SUNO_MODELS;

// Default model for generation
export const DEFAULT_SUNO_MODEL: SunoModelKey = 'V4_5ALL';

// Get API model name from UI key
export const getApiModelName = (uiKey: SunoModelKey): string => {
  return SUNO_MODELS[uiKey]?.apiModel || SUNO_MODELS.V4_5ALL.apiModel;
};

// Validate if model key exists
export const isValidModelKey = (key: string): key is SunoModelKey => {
  return key in SUNO_MODELS;
};
