/**
 * Credits Service
 * Business logic for credits, XP, levels, and gamification
 */

import * as creditsApi from '@/api/credits.api';
import { logger } from '@/lib/logger';

// Constants
export const GENERATION_COST = 10;

export const ACTION_REWARDS = {
  checkin: { credits: 5, experience: 10, description: 'Ежедневный чекин' },
  streak_bonus: { credits: 2, experience: 5, description: 'Бонус за серию' },
  share: { credits: 3, experience: 15, description: 'Расшаривание трека' },
  like_received: { credits: 1, experience: 5, description: 'Получен лайк' },
  generation_complete: { credits: 0, experience: 20, description: 'Генерация трека' },
  public_track: { credits: 2, experience: 10, description: 'Публичный трек' },
  artist_created: { credits: 5, experience: 25, description: 'Создание артиста' },
  project_created: { credits: 3, experience: 15, description: 'Создание проекта' },
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
