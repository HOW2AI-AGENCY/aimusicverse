/**
 * Shared Suno API model configuration
 * Single source of truth for model validation, mapping, and costs
 */

export const VALID_MODELS = ["V5_5", "V5", "V4_5PLUS", "V4_5ALL", "V4_5", "V4", "V3_5"];
export const DEFAULT_MODEL = "V5";

export const DEPRECATED_MODELS: Record<string, string> = {
  V4AUK: "V4_5",
  "chirp-v4": "V4",
  "chirp-v3-5": "V3_5",
  "chirp-auk": "V4_5ALL",
  "chirp-bluejay": "V4_5PLUS",
  "chirp-crow": "V5",
};

export const MODEL_FALLBACK_CHAIN: Record<string, string> = {
  V5_5: "V5",
  V5: "V4_5PLUS",
  V4_5PLUS: "V4_5ALL",
  V4_5ALL: "V4_5",
  V4_5: "V4",
  V4: "V3_5",
};

/**
 * Convert UI model key to API model name, handling deprecations
 */
export function getApiModelName(uiKey: string): string {
  if (DEPRECATED_MODELS[uiKey]) {
    return DEPRECATED_MODELS[uiKey];
  }
  return VALID_MODELS.includes(uiKey) ? uiKey : DEFAULT_MODEL;
}

/**
 * Validate that a model key is known (valid or deprecated)
 */
export function isValidModel(key: string): boolean {
  return VALID_MODELS.includes(key) || key in DEPRECATED_MODELS;
}
