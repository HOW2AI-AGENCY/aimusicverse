/**
 * useRewardNotification Hook
 * 
 * Centralized hook for showing gamification reward notifications
 * Replaces direct usage of LevelUpNotification, AchievementUnlockNotification, RewardCelebration
 */

import { useState, useCallback } from 'react';
import type { RewardNotificationData, RewardNotificationType } from '@/components/gamification/UnifiedRewardNotification';

interface UseRewardNotificationReturn {
  notificationData: RewardNotificationData | null;
  
  // Show methods for specific types
  showLevelUp: (level: number, title?: string, rewards?: { credits?: number; experience?: number }) => void;
  showAchievement: (name: string, description?: string, icon?: string, rewards?: { credits?: number; experience?: number }) => void;
  showCredits: (credits: number, title?: string) => void;
  showExperience: (experience: number, title?: string) => void;
  showStreak: (streak: number, rewards?: { credits?: number; experience?: number }) => void;
  showWelcomeBonus: (bonus: number) => void;
  showSubscription: (tier: 'pro' | 'premium', credits: number, features?: string[]) => void;
  
  // Generic show method
  show: (data: RewardNotificationData) => void;
  
  // Hide/reset
  hide: () => void;
}

export function useRewardNotification(): UseRewardNotificationReturn {
  const [notificationData, setNotificationData] = useState<RewardNotificationData | null>(null);

  const hide = useCallback(() => {
    setNotificationData(null);
  }, []);

  const show = useCallback((data: RewardNotificationData) => {
    setNotificationData(data);
  }, []);

  const showLevelUp = useCallback((
    level: number, 
    title?: string, 
    rewards?: { credits?: number; experience?: number }
  ) => {
    setNotificationData({
      type: 'level_up',
      level,
      levelTitle: title,
      credits: rewards?.credits,
      experience: rewards?.experience,
      showConfetti: true,
    });
  }, []);

  const showAchievement = useCallback((
    name: string, 
    description?: string, 
    icon?: string, 
    rewards?: { credits?: number; experience?: number }
  ) => {
    setNotificationData({
      type: 'achievement',
      achievementName: name,
      description,
      achievementIcon: icon,
      credits: rewards?.credits,
      experience: rewards?.experience,
      showConfetti: true,
      requireDismiss: true,
    });
  }, []);

  const showCredits = useCallback((credits: number, title?: string) => {
    setNotificationData({
      type: 'credits',
      credits,
      title: title || 'Кредиты получены!',
    });
  }, []);

  const showExperience = useCallback((experience: number, title?: string) => {
    setNotificationData({
      type: 'experience',
      experience,
      title: title || 'Опыт получен!',
    });
  }, []);

  const showStreak = useCallback((
    streak: number, 
    rewards?: { credits?: number; experience?: number }
  ) => {
    setNotificationData({
      type: 'streak',
      streak,
      credits: rewards?.credits,
      experience: rewards?.experience,
      title: `🔥 День ${streak}!`,
    });
  }, []);

  const showWelcomeBonus = useCallback((bonus: number) => {
    setNotificationData({
      type: 'welcome_bonus',
      welcomeBonus: bonus,
      showConfetti: true,
      requireDismiss: true,
      autoCloseDelay: 10000,
    });
  }, []);

  const showSubscription = useCallback((
    tier: 'pro' | 'premium', 
    credits: number, 
    features?: string[]
  ) => {
    setNotificationData({
      type: 'subscription',
      subscriptionTier: tier,
      subscriptionCredits: credits,
      subscriptionFeatures: features,
      showConfetti: true,
      requireDismiss: true,
    });
  }, []);

  return {
    notificationData,
    show,
    showLevelUp,
    showAchievement,
    showCredits,
    showExperience,
    showStreak,
    showWelcomeBonus,
    showSubscription,
    hide,
  };
}

export default useRewardNotification;
