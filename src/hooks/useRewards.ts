import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { soundEffects } from '@/lib/sound-effects';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface RewardResult {
  success: boolean;
  credits?: number;
  experience?: number;
  newLevel?: number;
  achievement?: {
    id: string;
    name: string;
    icon: string;
  };
}

export function useRewards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const awardCredits = useCallback(async (
    amount: number,
    actionType: string,
    description?: string
  ): Promise<RewardResult> => {
    if (!user?.id || isProcessing) return { success: false };

    setIsProcessing(true);
    try {
      // Update user credits
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('balance, total_earned, experience, level')
        .eq('user_id', user.id)
        .single();

      if (creditsError) throw creditsError;

      const newBalance = (credits?.balance || 0) + amount;
      const newTotalEarned = (credits?.total_earned || 0) + amount;

      await supabase
        .from('user_credits')
        .update({
          balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount,
        transaction_type: 'earn',
        action_type: actionType,
        description: description || `Награда: ${actionType}`,
      });

      // Play sound and haptic
      soundEffects.creditEarned();
      triggerHapticFeedback('success');

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });

      return { success: true, credits: amount };
    } catch (error) {
      logger.error('Failed to award credits', error);
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, isProcessing, queryClient]);

  const awardExperience = useCallback(async (
    amount: number,
    actionType: string
  ): Promise<RewardResult> => {
    if (!user?.id || isProcessing) return { success: false };

    setIsProcessing(true);
    try {
      const { data: credits, error } = await supabase
        .from('user_credits')
        .select('experience, level')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const newExperience = (credits?.experience || 0) + amount;
      const currentLevel = credits?.level || 1;
      
      // Calculate new level (100 XP per level, increasing)
      const xpForLevel = (level: number) => level * 100;
      let totalXpNeeded = 0;
      let newLevel = 1;
      
      while (totalXpNeeded + xpForLevel(newLevel) <= newExperience) {
        totalXpNeeded += xpForLevel(newLevel);
        newLevel++;
      }

      const leveledUp = newLevel > currentLevel;

      await supabase
        .from('user_credits')
        .update({
          experience: newExperience,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Play sound
      if (leveledUp) {
        soundEffects.levelUp();
        triggerHapticFeedback('success');
        toast.success(`🎉 Новый уровень: ${newLevel}!`);
      } else {
        soundEffects.xpEarned();
        triggerHapticFeedback('light');
      }

      queryClient.invalidateQueries({ queryKey: ['user-credits'] });

      return { 
        success: true, 
        experience: amount,
        newLevel: leveledUp ? newLevel : undefined 
      };
    } catch (error) {
      logger.error('Failed to award experience', error);
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, isProcessing, queryClient]);

  const checkAndUnlockAchievements = useCallback(async (): Promise<RewardResult[]> => {
    if (!user?.id) return [];

    try {
      // Get user stats
      const { data: credits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get already unlocked achievements
      const { data: unlocked } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);

      // Get all achievements
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*');

      if (!achievements || !credits) return [];

      const results: RewardResult[] = [];

      // Map achievement codes to user stats
      const getStatValue = (achievement: typeof achievements[0]): number => {
        const { code, requirement_type } = achievement;
        
        // Streak achievements
        if (requirement_type === 'streak' || code.startsWith('streak_')) {
          return credits.current_streak || 0;
        }
        
        // Creation achievements (tracks count)
        if (code.startsWith('tracks_')) {
          return credits.total_tracks || 0;
        }
        
        // Social achievements (likes received)
        if (code.startsWith('likes_')) {
          return credits.total_likes_received || 0;
        }
        
        // Sharing achievements
        if (code.startsWith('shares_')) {
          return credits.total_shares || 0;
        }
        
        // Plays achievements
        if (code.startsWith('plays_')) {
          return credits.total_plays || 0;
        }
        
        // Level achievements
        if (code.startsWith('level_')) {
          return credits.level || 1;
        }
        
        return 0;
      };

      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue;

        const currentValue = getStatValue(achievement);
        const shouldUnlock = currentValue >= achievement.requirement_value;

        if (shouldUnlock) {
          // Unlock achievement
          const { error } = await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id,
          });

          if (error) {
            logger.error('Failed to unlock achievement', { achievement: achievement.code, error });
            continue;
          }

          // Award credits and XP
          if (achievement.credits_reward > 0) {
            await awardCredits(achievement.credits_reward, 'achievement', achievement.name);
          }
          if (achievement.experience_reward > 0) {
            await awardExperience(achievement.experience_reward, 'achievement');
          }

          soundEffects.achievementUnlock();
          triggerHapticFeedback('success');

          results.push({
            success: true,
            achievement: {
              id: achievement.id,
              name: achievement.name,
              icon: achievement.icon,
            },
          });
        }
      }

      if (results.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      }

      return results;
    } catch (error) {
      logger.error('Failed to check achievements', error);
      return [];
    }
  }, [user?.id, awardCredits, awardExperience, queryClient]);

  const playRewardSound = useCallback((type: 'credits' | 'xp' | 'levelUp' | 'achievement' | 'streak' | 'mission') => {
    switch (type) {
      case 'credits':
        soundEffects.creditEarned();
        break;
      case 'xp':
        soundEffects.xpEarned();
        break;
      case 'levelUp':
        soundEffects.levelUp();
        break;
      case 'achievement':
        soundEffects.achievementUnlock();
        break;
      case 'streak':
        soundEffects.streakBonus();
        break;
      case 'mission':
        soundEffects.missionComplete();
        break;
    }
  }, []);

  return {
    awardCredits,
    awardExperience,
    checkAndUnlockAchievements,
    playRewardSound,
    isProcessing,
  };
}
