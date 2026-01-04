/**
 * Economy Constants
 * Central source of truth for pricing and rewards
 * Based on: 100 credits = $1 = 50 Stars
 */

// Model-specific generation costs
export const MODEL_COSTS: Record<string, number> = {
  V5: 12,
  V4_5PLUS: 12,
  V4_5ALL: 12,
  V4: 10,
};

export const ECONOMY = {
  // Core exchange rates
  CREDITS_PER_USD: 100,
  STARS_PER_USD: 50,
  CREDITS_PER_STAR: 2,
  
  // Action costs (GENERATION_COST is now model-specific, see MODEL_COSTS)
  DEFAULT_GENERATION_COST: 12,  // Default for new models
  STEM_SEPARATION_COST: 5,      // 5 credits = $0.05
  MIDI_EXPORT_COST: 3,          // 3 credits = $0.03
  COVER_GENERATION_COST: 5,     // 5 credits = $0.05
  
  // Rewards
  DAILY_CHECKIN: {
    credits: 5,
    xp: 10,
  },
  STREAK_BONUS: {
    credits_per_day: 2,
    xp_per_day: 5,
  },
  SHARE_REWARD: {
    credits: 3,
    xp: 15,
  },
  LIKE_RECEIVED: {
    credits: 1,
    xp: 5,
  },
  GENERATION_COMPLETE: {
    credits: 0,
    xp: 20,
  },
  PUBLIC_TRACK: {
    credits: 2,
    xp: 10,
  },
  ARTIST_CREATED: {
    credits: 5,
    xp: 25,
  },
  PROJECT_CREATED: {
    credits: 3,
    xp: 15,
  },
  
  // Purchase rewards
  PURCHASE_XP_PER_100_STARS: 10,
  SUBSCRIPTION_XP_BONUS: 50,
  FIRST_PURCHASE_BONUS_CREDITS: 25,
  
  // Referral
  REFERRAL_PERCENT: 10, // 10% of purchase
  REFERRAL_INVITE_BONUS: 100, // Credits for inviter
  REFERRAL_NEW_USER_BONUS: 50, // Credits for new user
} as const;

/**
 * Convert Stars to USD
 */
export function starsToUsd(stars: number): number {
  return stars / ECONOMY.STARS_PER_USD;
}

/**
 * Convert USD to Stars
 */
export function usdToStars(usd: number): number {
  return Math.ceil(usd * ECONOMY.STARS_PER_USD);
}

/**
 * Convert Stars to Credits
 */
export function starsToCredits(stars: number): number {
  return stars * ECONOMY.CREDITS_PER_STAR;
}

/**
 * Convert Credits to Stars
 */
export function creditsToStars(credits: number): number {
  return Math.ceil(credits / ECONOMY.CREDITS_PER_STAR);
}

/**
 * Format Stars price with symbol
 */
export function formatStars(stars: number): string {
  return `${stars} ⭐`;
}

/**
 * Format USD price
 */
export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/**
 * Format credits with symbol
 */
export function formatCredits(credits: number): string {
  return `${credits} 💎`;
}

/**
 * Calculate bonus percentage for a product
 */
export function calculateBonusPercent(starsPrice: number, creditsAmount: number): number {
  const baseCredits = starsToCredits(starsPrice);
  if (creditsAmount <= baseCredits) return 0;
  return Math.round(((creditsAmount - baseCredits) / baseCredits) * 100);
}

/**
 * Calculate XP reward for a purchase
 */
export function calculatePurchaseXp(starsAmount: number): number {
  return Math.floor(starsAmount / 100) * ECONOMY.PURCHASE_XP_PER_100_STARS;
}

/**
 * Calculate referral reward
 */
export function calculateReferralReward(starsAmount: number): {
  credits: number;
  percent: number;
} {
  const credits = Math.floor(starsToCredits(starsAmount) * (ECONOMY.REFERRAL_PERCENT / 100));
  return {
    credits,
    percent: ECONOMY.REFERRAL_PERCENT,
  };
}
