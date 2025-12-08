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

export type ModelStatus = 'latest' | 'active' | 'deprecated';

export interface SunoModelInfo {
  name: string;
  desc: string;
  emoji: string;
  apiModel: string;
  status: ModelStatus;
}

export const SUNO_MODELS: Record<string, SunoModelInfo> = {
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
export const getApiModelName = (uiKey: string): string => {
  return SUNO_MODELS[uiKey]?.apiModel || SUNO_MODELS.V4_5ALL.apiModel;
};

// Validate if model key exists and is available (not deprecated)
export const isValidModelKey = (key: string): key is SunoModelKey => {
  return key in SUNO_MODELS;
};

// Check if model is available for generation
export const isModelAvailable = (key: string): boolean => {
  const model = SUNO_MODELS[key];
  return model ? model.status !== 'deprecated' : false;
};

// Get available models only (filter out deprecated)
export const getAvailableModels = (): Record<string, SunoModelInfo> => {
  return Object.fromEntries(
    Object.entries(SUNO_MODELS).filter(([_, info]) => info.status !== 'deprecated')
  );
};

// Validate and fallback to default if model unavailable
export const validateModel = (key: string): { 
  validKey: SunoModelKey; 
  wasChanged: boolean; 
  originalKey: string;
} => {
  if (isValidModelKey(key) && isModelAvailable(key)) {
    return { validKey: key as SunoModelKey, wasChanged: false, originalKey: key };
  }
  return { validKey: DEFAULT_SUNO_MODEL, wasChanged: true, originalKey: key };
};
