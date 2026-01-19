import { motion, AnimatePresence } from '@/lib/motion';
import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCheckin, useCanCheckinToday, useUserCredits, ACTION_REWARDS } from '@/hooks/useGamification';
import { Flame, Gift, Sparkles, Check, Calendar } from 'lucide-react';
import { useRewardNotificationContext } from '@/contexts/RewardNotificationContext';
import { cn } from '@/lib/utils';

// Generate random star movements outside of component to ensure purity
const generateStarMovements = () =>
  Array.from({ length: 5 }, () => ({
    x: Math.random() * 60 - 30,
    y: Math.random() * -40 - 10,
  }));

export const DailyCheckin = memo(function DailyCheckin() {
  // Generate random star movements once using useState initializer
  const [starMovements] = useState(generateStarMovements);
  const { data: canCheckin, isLoading: checkingStatus } = useCanCheckinToday();
  const { data: credits } = useUserCredits();
  const checkin = useCheckin();
  const { showStreak, showCredits } = useRewardNotificationContext();

  const handleCheckin = () => {
    checkin.mutate(undefined, {
      onSuccess: (result) => {
        // Show unified reward notification
        if (result.streak > 1) {
          showStreak(result.streak, { credits: result.credits, experience: result.experience });
        } else {
          showCredits(result.credits);
        }
        // Mark first checkin completed for gamification onboarding
        localStorage.setItem('first-checkin-completed', 'true');
      },
    });
  };

  const nextStreakBonus = credits?.current_streak 
    ? (credits.current_streak + 1) * ACTION_REWARDS.streak_bonus.credits 
    : 0;

  const streak = credits?.current_streak || 0;

  return (
    <motion.div 
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
        "border border-primary/20"
      )}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            {/* Icon - Compact */}
            <motion.div
              className={cn(
                "relative w-10 h-10 rounded-lg flex items-center justify-center",
                canCheckin 
                  ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30" 
                  : "bg-green-500/10 border border-green-500/20"
              )}
              animate={canCheckin ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {canCheckin ? (
                <Gift className="w-5 h-5 text-orange-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {canCheckin && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-semibold text-sm">Чекин</span>
                {streak > 0 && (
                  <Badge className="bg-orange-500/15 border-orange-500/30 text-orange-500 text-[10px] px-1.5 py-0 h-4 gap-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    {streak}
                  </Badge>
                )}
              </div>
              
              {canCheckin ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-warning">
                    +{ACTION_REWARDS.checkin.credits}
                    {nextStreakBonus > 0 && <span className="text-primary">+{nextStreakBonus}</span>}
                  </span>
                  <span className="text-[10px] font-medium text-primary">+{ACTION_REWARDS.checkin.experience} XP</span>
                </div>
              ) : (
                <p className="text-[10px] text-green-500 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  Завтра
                </p>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {checkingStatus ? (
              <div className="w-20 h-9 bg-muted/30 animate-pulse rounded-lg" />
            ) : canCheckin ? (
              <Button 
                onClick={handleCheckin}
                disabled={checkin.isPending}
                size="sm"
                className="gap-1.5 px-3 h-9 rounded-lg font-medium"
              >
                {checkin.isPending ? (
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Gift className="h-3.5 w-3.5" />
                )}
                <span>Забрать</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-green-500 bg-green-500/10">
                <Check className="h-3.5 w-3.5" />
                <span>Готово</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});
