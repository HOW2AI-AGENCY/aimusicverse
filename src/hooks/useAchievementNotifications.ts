import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { getSoundEffects } from '@/lib/sound-effects';
import { triggerHapticFeedback } from '@/lib/mobile-utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  credits_reward: number;
  experience_reward: number;
}

interface UnlockedAchievement extends Achievement {
  unlocked_at: string;
}

export function useAchievementNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingAchievement, setPendingAchievement] = useState<UnlockedAchievement | null>(null);
  const [shownAchievements, setShownAchievements] = useState<Set<string>>(new Set());

  // Check for new achievements via realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('achievement-unlocks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const achievementId = payload.new.achievement_id;
          
          // Skip if already shown
          if (shownAchievements.has(achievementId)) return;

          // Fetch achievement details
          const { data: achievement } = await supabase
            .from('achievements')
            .select('*')
            .eq('id', achievementId)
            .single();

          if (achievement) {
            const unlocked: UnlockedAchievement = {
              ...achievement,
              unlocked_at: payload.new.unlocked_at,
            };

            setPendingAchievement(unlocked);
            setShownAchievements(prev => new Set([...prev, achievementId]));
            
            // Play sounds and haptic
            getSoundEffects().achievementUnlock();
            triggerHapticFeedback('success');

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
            queryClient.invalidateQueries({ queryKey: ['user-credits'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, shownAchievements, queryClient]);

  const dismissAchievement = useCallback(() => {
    setPendingAchievement(null);
  }, []);

  return {
    pendingAchievement,
    dismissAchievement,
  };
}
