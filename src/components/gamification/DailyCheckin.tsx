import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckin, useCanCheckinToday, useUserCredits, ACTION_REWARDS } from '@/hooks/useGamification';
import { Flame, Gift, Sparkles, Check } from 'lucide-react';

export function DailyCheckin() {
  const { data: canCheckin, isLoading: checkingStatus } = useCanCheckinToday();
  const { data: credits } = useUserCredits();
  const checkin = useCheckin();

  const handleCheckin = () => {
    checkin.mutate();
  };

  const nextStreakBonus = credits?.current_streak 
    ? (credits.current_streak + 1) * ACTION_REWARDS.streak_bonus.credits 
    : 0;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Ежедневный чекин</span>
            </div>
            
            {credits?.current_streak ? (
              <p className="text-sm text-muted-foreground">
                Серия: {credits.current_streak} {credits.current_streak === 1 ? 'день' : 'дней'} 🔥
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Начни серию сегодня!
              </p>
            )}

            {canCheckin && nextStreakBonus > 0 && (
              <p className="text-xs text-primary mt-1">
                +{nextStreakBonus} бонус за серию
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {checkingStatus ? (
              <div className="w-24 h-10 bg-muted animate-pulse rounded-md" />
            ) : canCheckin ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <Button 
                  onClick={handleCheckin}
                  disabled={checkin.isPending}
                  className="gap-2"
                >
                  {checkin.isPending ? (
                    <Sparkles className="h-4 w-4 animate-spin" />
                  ) : (
                    <Gift className="h-4 w-4" />
                  )}
                  +{ACTION_REWARDS.checkin.credits}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-4 w-4 text-green-500" />
                Выполнено
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
