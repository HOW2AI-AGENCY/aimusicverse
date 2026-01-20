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
  
  // Feature costs (synced with sunoapi.org prices)
  STEM_SEPARATION_SIMPLE_COST: 10,    // 10 credits = 2 stems (vocal + instrumental)
  STEM_SEPARATION_DETAILED_COST: 50,  // 50 credits = 12+ stems
  REPLACE_SECTION_COST: 5,            // 5 credits = section replacement
  AUDIO_ANALYSIS_COST: 3,
  COVER_GENERATION_COST: 10,          // 10 credits = cover
  EXTEND_GENERATION_COST: 10,         // 10 credits = extend
  MIDI_EXPORT_COST: 3,
  
  // Rewards (BOOSTED - synced with frontend)
  DAILY_CHECKIN: {
    credits: 10,  // Was 5
    xp: 25,
  },
  STREAK_BONUS: {
    credits_per_day: 5,  // Was multiplier
    xp_per_day: 15,
    max_credits: 50,
  },
  SHARE_REWARD: {
    credits: 5,
    xp: 30,
  },
  LIKE_RECEIVED: {
    credits: 2,
    xp: 10,
  },
  PUBLIC_TRACK: {
    credits: 5,
    xp: 25,
  },
  ARTIST_CREATED: {
    credits: 10,
    xp: 50,
  },
  PROJECT_CREATED: {
    credits: 8,
    xp: 35,
  },
  COMMENT_POSTED: {
    credits: 3,
    xp: 15,
  },
  
  // Referral (reduced rewards)
  REFERRAL_PERCENT: 10,
  REFERRAL_INVITE_BONUS: 15, // Was 100
  REFERRAL_NEW_USER_BONUS: 15, // Was 50
  
  // Free user limits
  FREE_DAILY_EARN_CAP: 30,
  FREE_MAX_BALANCE: 100,
  WELCOME_BONUS: 50,
};

/**
 * Calculate total cost for a generation with options
 */
export function calculateGenerationCost(options: {
  modelKey: string;
  withStems?: boolean;
  stemMode?: 'simple' | 'detailed';
  withAnalysis?: boolean;
}): number {
  let cost = getGenerationCost(options.modelKey);
  
  if (options.withStems) {
    // Use detailed cost if stemMode is detailed, otherwise simple
    cost += options.stemMode === 'detailed' 
      ? ECONOMY.STEM_SEPARATION_DETAILED_COST 
      : ECONOMY.STEM_SEPARATION_SIMPLE_COST;
  }
  
  if (options.withAnalysis) {
    cost += ECONOMY.AUDIO_ANALYSIS_COST;
  }
  
  return cost;
}

/**
 * Get stem separation cost based on mode
 */
export function getStemSeparationCost(mode: 'simple' | 'detailed'): number {
  return mode === 'detailed' 
    ? ECONOMY.STEM_SEPARATION_DETAILED_COST 
    : ECONOMY.STEM_SEPARATION_SIMPLE_COST;
}
