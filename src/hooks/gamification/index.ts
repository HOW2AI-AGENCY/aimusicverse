/**
 * Gamification Hooks - Re-exports for cleaner imports
 */

export {
  // Hooks
  useUserCredits,
  useAchievements,
  useUserAchievements,
  useLeaderboard,
  useCreditTransactions,
  useCheckin,
  useRewardAction,
  useCanCheckinToday,
  useRewardShare,
  // Types
  type UserCredits,
  type Achievement,
  type UserAchievement,
  type LeaderboardEntry,
  type LeaderboardCategory,
  type CreditTransaction,
  // Constants
  LEADERBOARD_CATEGORIES,
  ACTION_REWARDS,
  // Utils
  getExperienceForLevel,
  getLevelFromExperience,
  getLevelProgress,
} from '../useGamification';
