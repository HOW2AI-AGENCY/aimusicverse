/**
 * Shared Economy Constants for Edge Functions
 * Single source of truth for model costs and economy calculations
 */

// Model-specific generation costs
export const MODEL_COSTS: Record<string, number> = {
  V5: 12,
  V4_5PLUS: 12,
  V4_5: 12,
  V4_5ALL: 12,
  V4: 10,
  V3_5: 10,
};

// Default cost for unknown models
export const DEFAULT_GENERATION_COST = 12;

/**
 * Get generation cost for a specific model
 * @param modelKey - The model key (e.g., "V5", "V4_5ALL")
 * @returns The credit cost for generation
 */
export function getGenerationCost(modelKey: string): number {
  return MODEL_COSTS[modelKey] ?? DEFAULT_GENERATION_COST;
}

// Core exchange rates
export const ECONOMY = {
  CREDITS_PER_USD: 100,
  STARS_PER_USD: 50,
  CREDITS_PER_STAR: 2,
  
  // Generation costs
  DEFAULT_GENERATION_COST,
  
  // Feature costs
  STEM_SEPARATION_COST: 5,
  AUDIO_ANALYSIS_COST: 3,
  COVER_GENERATION_COST: 15,
  EXTEND_GENERATION_COST: 10,
  
  // Rewards
  DAILY_LOGIN_BONUS: 5,
  STREAK_BONUS_MULTIPLIER: 0.1, // +10% per day
  MAX_STREAK_BONUS: 50,
};

/**
 * Calculate total cost for a generation with options
 */
export function calculateGenerationCost(options: {
  modelKey: string;
  withStems?: boolean;
  withAnalysis?: boolean;
}): number {
  let cost = getGenerationCost(options.modelKey);
  
  if (options.withStems) {
    cost += ECONOMY.STEM_SEPARATION_COST;
  }
  
  if (options.withAnalysis) {
    cost += ECONOMY.AUDIO_ANALYSIS_COST;
  }
  
  return cost;
}
