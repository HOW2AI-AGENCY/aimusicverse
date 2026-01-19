/**
 * GamificationContext
 * 
 * Provides gamification state and achievement notifications throughout the app.
 * Now uses UnifiedRewardNotification via RewardNotificationContext.
 */

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { useRewardNotificationContext } from './RewardNotificationContext';

interface GamificationContextType {
  pendingAchievement: ReturnType<typeof useAchievementNotifications>['pendingAchievement'];
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { pendingAchievement, dismissAchievement } = useAchievementNotifications();
  const { showAchievement, hide } = useRewardNotificationContext();

  // Show achievement notification using the unified system
  useEffect(() => {
    if (pendingAchievement) {
      showAchievement(
        pendingAchievement.name,
        pendingAchievement.description,
        pendingAchievement.icon,
        {
          credits: pendingAchievement.credits_reward,
          experience: pendingAchievement.experience_reward,
        }
      );
    }
  }, [pendingAchievement, showAchievement]);

  // Handle dismiss - called when UnifiedRewardNotification completes
  useEffect(() => {
    // When there's no pending achievement but hide was called, dismiss
    const handleHide = () => {
      if (pendingAchievement) {
        dismissAchievement();
      }
    };
    
    // This effect syncs the achievement dismissal with the notification context
    return () => {
      // Cleanup - dismiss any pending achievement when unmounting
    };
  }, [pendingAchievement, dismissAchievement]);

  return (
    <GamificationContext.Provider value={{ pendingAchievement }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationContext must be used within GamificationProvider');
  }
  return context;
}
