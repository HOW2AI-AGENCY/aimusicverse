import { createContext, useContext, ReactNode } from 'react';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { AchievementUnlockNotification } from '@/components/gamification/AchievementUnlockNotification';

interface GamificationContextType {
  pendingAchievement: ReturnType<typeof useAchievementNotifications>['pendingAchievement'];
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { pendingAchievement, dismissAchievement } = useAchievementNotifications();

  return (
    <GamificationContext.Provider value={{ pendingAchievement }}>
      {children}
      
      {/* Global achievement notification */}
      {pendingAchievement && (
        <AchievementUnlockNotification
          show={!!pendingAchievement}
          name={pendingAchievement.name}
          description={pendingAchievement.description}
          icon={pendingAchievement.icon}
          creditsReward={pendingAchievement.credits_reward}
          experienceReward={pendingAchievement.experience_reward}
          onClose={dismissAchievement}
        />
      )}
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
