/**
 * Suno AI model configurations
 * Synchronized with Suno API model parameter values.
 * The `model` value sent to the API equals the UI key (e.g. "V5", "V4_5PLUS").
 */

export type ModelStatus = "latest" | "active" | "deprecated";

export interface SunoModelInfo {
  name: string;
  desc: string;
  emoji: string;
  apiModel: string;
  status: ModelStatus;
  cost: number; // Credits per generation
}

export const SUNO_MODELS: Record<string, SunoModelInfo> = {
  V5_5: {
    name: "V5.5",
    desc: "Раскройте свой голос — модели под ваш вкус",
    emoji: "🎤",
    apiModel: "V5_5",
    status: "latest",
    cost: 14,
  },
  V5: {
    name: "V5",
    desc: "Быстрая генерация, отличная музыкальность, до 8 мин",
    emoji: "🚀",
    apiModel: "V5",
    status: "active",
    cost: 12,
  },
  V4_5ALL: {
    name: "V4.5 All",
    desc: "Улучшенная структура песни, до 8 мин",
    emoji: "🎯",
    apiModel: "V4_5ALL",
    status: "active",
    cost: 12,
  },
  V4_5PLUS: {
    name: "V4.5+",
    desc: "Богатый звук и креативные решения, до 8 мин",
    emoji: "💎",
    apiModel: "V4_5PLUS",
    status: "active",
    cost: 12,
  },
  V4_5: {
    name: "V4.5",
    desc: "Передовой микс жанров, до 8 мин",
    emoji: "✨",
    apiModel: "V4_5",
    status: "active",
    cost: 12,
  },
  V4: {
    name: "V4",
    desc: "Высокое качество звука, до 4 мин",
    emoji: "🎵",
    apiModel: "V4",
    status: "active",
    cost: 10,
  },
} as const;

export type SunoModelKey = keyof typeof SUNO_MODELS;

// Default model for generation
export const DEFAULT_SUNO_MODEL: SunoModelKey = "V5";

// Get API model name from UI key
export const getApiModelName = (uiKey: string): string => {
  return SUNO_MODELS[uiKey]?.apiModel || SUNO_MODELS[DEFAULT_SUNO_MODEL].apiModel;
};

// Validate if model key exists and is available (not deprecated)
export const isValidModelKey = (key: string): key is SunoModelKey => {
  return key in SUNO_MODELS;
};

// Check if model is available for generation
export const isModelAvailable = (key: string): boolean => {
  const model = SUNO_MODELS[key];
  return model ? model.status !== "deprecated" : false;
};

// Get available models as array with keys
export const getAvailableModels = (): Array<SunoModelInfo & { key: string; label: string }> => {
  return Object.entries(SUNO_MODELS)
    .filter(([_, info]) => info.status !== "deprecated")
    .map(([key, info]) => ({
      ...info,
      key,
      label: `${info.name} - ${info.desc}`,
    }));
};

// Get cost for a specific model
export const getModelCost = (modelKey: string): number => {
  return SUNO_MODELS[modelKey]?.cost ?? 12;
};

// Default generation cost (for backwards compatibility)
export const DEFAULT_GENERATION_COST = 12;

// Model fallback chain for deprecated models (IMP006)
const FALLBACK_CHAIN: Record<string, SunoModelKey[]> = {
  V3: ["V4", "V4_5", "V5"],
  V3_5: ["V4", "V4_5", "V5"],
  V4: ["V4_5", "V4_5PLUS", "V5"],
  V4_5: ["V4_5PLUS", "V4_5ALL", "V5"],
  V4_5ALL: ["V4_5PLUS", "V5", "V4_5"],
  V4_5PLUS: ["V5", "V4_5ALL", "V4_5"],
  V5: ["V5_5", "V4_5PLUS", "V4_5ALL"],
  V5_5: ["V5", "V4_5PLUS", "V4_5ALL"],
};

// Validate and fallback to default if model unavailable
export const validateModel = (
  key: string,
): {
  validKey: SunoModelKey;
  wasChanged: boolean;
  originalKey: string;
} => {
  if (isValidModelKey(key) && isModelAvailable(key)) {
    return { validKey: key as SunoModelKey, wasChanged: false, originalKey: key };
  }

  const fallbacks = FALLBACK_CHAIN[key] || [DEFAULT_SUNO_MODEL];
  for (const fallbackKey of fallbacks) {
    if (isValidModelKey(fallbackKey) && isModelAvailable(fallbackKey)) {
      return { validKey: fallbackKey, wasChanged: true, originalKey: key };
    }
  }

  return { validKey: DEFAULT_SUNO_MODEL, wasChanged: true, originalKey: key };
};
