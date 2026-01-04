/**
 * Credits Service
 * Business logic for credits, XP, levels, and gamification
 */

import * as creditsApi from '@/api/credits.api';
import { logger } from '@/lib/logger';
import { ECONOMY, MODEL_COSTS } from '@/lib/economy';
import { getModelCost, DEFAULT_GENERATION_COST } from '@/constants/sunoModels';

// Re-export economy constants for backward compatibility
export const GENERATION_COST = ECONOMY.DEFAULT_GENERATION_COST;

// Get model-specific generation cost
export { getModelCost, MODEL_COSTS };

export const ACTION_REWARDS = {
  // Daily rewards
  checkin: { 
    credits: ECONOMY.DAILY_CHECKIN.credits, 
    experience: ECONOMY.DAILY_CHECKIN.xp, 
    description: 'Ежедневный чекин' 
  },
  streak_bonus: { 
    credits: ECONOMY.STREAK_BONUS.credits_per_day, 
    experience: ECONOMY.STREAK_BONUS.xp_per_day, 
    description: 'Бонус за серию' 
  },
  
  // Social rewards
  share: { 
    credits: ECONOMY.SHARE_REWARD.credits, 
    experience: ECONOMY.SHARE_REWARD.xp, 
    description: 'Расшаривание трека' 
  },
  like_received: { 
    credits: ECONOMY.LIKE_RECEIVED.credits, 
    experience: ECONOMY.LIKE_RECEIVED.xp, 
    description: 'Получен лайк' 
  },
  
  // Creation rewards
  generation_complete: { 
    credits: ECONOMY.GENERATION_COMPLETE.credits, 
    experience: ECONOMY.GENERATION_COMPLETE.xp, 
    description: 'Генерация трека' 
  },
  public_track: { 
    credits: ECONOMY.PUBLIC_TRACK.credits, 
    experience: ECONOMY.PUBLIC_TRACK.xp, 
    description: 'Публичный трек' 
  },
  artist_created: { 
    credits: ECONOMY.ARTIST_CREATED.credits, 
    experience: ECONOMY.ARTIST_CREATED.xp, 
    description: 'Создание артиста' 
  },
  project_created: { 
    credits: ECONOMY.PROJECT_CREATED.credits, 
    experience: ECONOMY.PROJECT_CREATED.xp, 
    description: 'Создание проекта' 
  },
  
  // Purchase rewards
  purchase_credits: {
    credits: 0,
    experience: ECONOMY.PURCHASE_XP_PER_100_STARS,
    description: 'Покупка кредитов',
  },
  purchase_subscription: {
    credits: 0,
    experience: ECONOMY.SUBSCRIPTION_XP_BONUS,
    description: 'Оформление подписки',
  },
  first_purchase: {
    credits: ECONOMY.FIRST_PURCHASE_BONUS_CREDITS,
    experience: 50,
    description: 'Первая покупка',
  },
  
  // Referral rewards  
  referral_signup: {
    credits: ECONOMY.REFERRAL_INVITE_BONUS,
    experience: 50,
    description: 'Приглашение друга',
  },
  referral_purchase: {
    credits: 0, // Calculated dynamically based on purchase
    experience: 25,
    description: 'Покупка реферала',
  },
} as const;

export type ActionType = keyof typeof ACTION_REWARDS;

/**
 * Calculate level from experience points
 */
export function getLevelFromExperience(experience: number): number {
  return Math.max(1, Math.floor(Math.sqrt(experience / 100)) + 1);
}

/**
 * Calculate experience needed for a specific level
 */
export function getExperienceForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

/**
 * Get level progress percentage
 */
export function getLevelProgress(experience: number): {
  current: number;
  next: number;
  progress: number;
  level: number;
} {
  const level = getLevelFromExperience(experience);
  const currentLevelExp = getExperienceForLevel(level);
  const nextLevelExp = getExperienceForLevel(level + 1);
  const progress = ((experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
  
  return {
    current: currentLevelExp,
    next: nextLevelExp,
    progress: Math.min(100, Math.max(0, progress)),
    level,
  };
}

/**
 * Check if user can afford generation
 */
export async function canAffordGeneration(userId: string): Promise<{
  canGenerate: boolean;
  isAdmin: boolean;
  balance: number;
  cost: number;
}> {
  const isAdmin = await creditsApi.checkAdminStatus(userId);
  
  if (isAdmin) {
    // Admins use shared API balance
    const apiBalance = await creditsApi.fetchSunoApiBalance();
    return {
      canGenerate: true,
      isAdmin: true,
      balance: apiBalance,
      cost: GENERATION_COST,
    };
  }

  const credits = await creditsApi.fetchUserCredits(userId);
  const balance = credits?.balance ?? 0;

  return {
    canGenerate: balance >= GENERATION_COST,
    isAdmin: false,
    balance,
    cost: GENERATION_COST,
  };
}

/**
 * Deduct credits for generation (non-admin users only)
 */
export async function chargeForGeneration(userId: string): Promise<void> {
  const isAdmin = await creditsApi.checkAdminStatus(userId);
  if (isAdmin) {
    logger.info('Admin user - skipping credit deduction');
    return;
  }

  await creditsApi.deductCredits(userId, GENERATION_COST);
  await creditsApi.logCreditTransaction(
    userId,
    -GENERATION_COST,
    'spend',
    'generation',
    'Генерация трека'
  );
}

/**
 * Process daily check-in
 */
export async function processDailyCheckin(userId: string): Promise<{
  credits: number;
  experience: number;
  streak: number;
  levelUp: boolean;
  newLevel: number;
}> {
  // Check if already checked in
  const alreadyCheckedIn = await creditsApi.hasCheckedInToday(userId);
  if (alreadyCheckedIn) {
    throw new Error('Вы уже отметились сегодня');
  }

  // Get current state
  const credits = await creditsApi.fetchUserCredits(userId);
  const lastCheckinDate = credits?.last_checkin_date;
  
  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let newStreak = 1;
  if (lastCheckinDate === yesterdayStr) {
    newStreak = (credits?.current_streak || 0) + 1;
  }

  // Calculate rewards
  const baseReward = ACTION_REWARDS.checkin;
  const streakBonus = newStreak > 1 ? (newStreak - 1) * ACTION_REWARDS.streak_bonus.credits : 0;
  const streakExpBonus = newStreak > 1 ? (newStreak - 1) * ACTION_REWARDS.streak_bonus.experience : 0;
  const totalCredits = baseReward.credits + streakBonus;
  const totalExperience = baseReward.experience + streakExpBonus;

  // Calculate new level
  const oldLevel = credits?.level || 1;
  const newExperience = (credits?.experience || 0) + totalExperience;
  const newLevel = getLevelFromExperience(newExperience);
  const levelUp = newLevel > oldLevel;

  // Record check-in
  await creditsApi.recordCheckin(userId, totalCredits, newStreak);

  // Update credits
  const today = new Date().toISOString().split('T')[0];
  await creditsApi.upsertUserCredits(userId, {
    balance: (credits?.balance || 0) + totalCredits,
    total_earned: (credits?.total_earned || 0) + totalCredits,
    current_streak: newStreak,
    longest_streak: Math.max(credits?.longest_streak || 0, newStreak),
    last_checkin_date: today,
    experience: newExperience,
    level: newLevel,
  });

  // Log transaction
  await creditsApi.logCreditTransaction(
    userId,
    totalCredits,
    'earn',
    'checkin',
    `Ежедневный чекин (день ${newStreak})`,
    { streak: newStreak, experience_earned: totalExperience }
  );

  return {
    credits: totalCredits,
    experience: totalExperience,
    streak: newStreak,
    levelUp,
    newLevel,
  };
}

/**
 * Reward user for action
 */
export async function rewardForAction(
  userId: string,
  actionType: ActionType,
  metadata?: Record<string, unknown>
): Promise<{
  credits: number;
  experience: number;
  levelUp: boolean;
  newLevel: number;
}> {
  const reward = ACTION_REWARDS[actionType];
  const { credits: creditAmount, experience: expAmount, description } = reward;

  // Get current state
  const currentCredits = await creditsApi.fetchUserCredits(userId);
  const oldLevel = currentCredits?.level || 1;
  const newExperience = (currentCredits?.experience || 0) + expAmount;
  const newLevel = getLevelFromExperience(newExperience);
  const levelUp = newLevel > oldLevel;

  // Update credits
  await creditsApi.upsertUserCredits(userId, {
    balance: (currentCredits?.balance || 0) + creditAmount,
    total_earned: (currentCredits?.total_earned || 0) + creditAmount,
    experience: newExperience,
    level: newLevel,
  });

  // Log transaction
  if (creditAmount > 0) {
    await creditsApi.logCreditTransaction(
      userId,
      creditAmount,
      'earn',
      actionType,
      description,
      { ...metadata, experience_earned: expAmount }
    );
  }

  return {
    credits: creditAmount,
    experience: expAmount,
    levelUp,
    newLevel,
  };
}

/**
 * Get user's complete gamification stats
 */
export async function getUserGamificationStats(userId: string): Promise<{
  credits: creditsApi.UserCredits | null;
  isAdmin: boolean;
  apiBalance: number | null;
  effectiveBalance: number;
  canGenerate: boolean;
  levelProgress: ReturnType<typeof getLevelProgress>;
}> {
  const [credits, isAdmin] = await Promise.all([
    creditsApi.fetchUserCredits(userId),
    creditsApi.checkAdminStatus(userId),
  ]);

  let apiBalance: number | null = null;
  if (isAdmin) {
    apiBalance = await creditsApi.fetchSunoApiBalance();
  }

  const effectiveBalance = isAdmin ? (apiBalance ?? 0) : (credits?.balance ?? 0);
  const canGenerate = isAdmin ? true : effectiveBalance >= GENERATION_COST;
  const levelProgress = getLevelProgress(credits?.experience ?? 0);

  return {
    credits,
    isAdmin,
    apiBalance,
    effectiveBalance,
    canGenerate,
    levelProgress,
  };
}
