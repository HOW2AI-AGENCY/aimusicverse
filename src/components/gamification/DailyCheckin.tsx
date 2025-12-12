import { motion, AnimatePresence } from '@/lib/motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckin, useCanCheckinToday, useUserCredits, ACTION_REWARDS } from '@/hooks/useGamification';
import { Flame, Gift, Sparkles, Check, Coins, Star } from 'lucide-react';
import { RewardCelebration } from './RewardCelebration';

// Generate random star movements outside of component to ensure purity
const generateStarMovements = () =>
  Array.from({ length: 3 }, () => ({
    x: Math.random() * 50 - 25,
    y: Math.random() * -30,
  }));

export function DailyCheckin() {
  // Generate random star movements once using useState initializer
  const [starMovements] = useState(generateStarMovements);
  const { data: canCheckin, isLoading: checkingStatus } = useCanCheckinToday();
  const { data: credits } = useUserCredits();
  const checkin = useCheckin();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    credits: number;
    experience: number;
    streak: number;
  } | null>(null);

  const handleCheckin = () => {
    checkin.mutate(undefined, {
      onSuccess: (result) => {
        setCelebrationData({
          credits: result.credits,
          experience: result.experience,
          streak: result.streak,
        });
        setShowCelebration(true);
        // Mark first checkin completed for gamification onboarding
        localStorage.setItem('first-checkin-completed', 'true');
      },
    });
  };

  const nextStreakBonus = credits?.current_streak 
    ? (credits.current_streak + 1) * ACTION_REWARDS.streak_bonus.credits 
    : 0;

  return (
    <>
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={{ scale: canCheckin ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 1, repeat: canCheckin ? Infinity : 0 }}
                >
                  <Flame className="h-5 w-5 text-orange-500" />
                </motion.div>
                <span className="font-semibold">Ежедневный чекин</span>
              </div>
              
              {credits?.current_streak ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Серия: {credits.current_streak} {credits.current_streak === 1 ? 'день' : 'дней'}
                  </p>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    🔥
                  </motion.span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Начни серию сегодня!
                </p>
              )}

              {canCheckin && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mt-2"
                >
                  <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <Coins className="w-3 h-3" />
                    <span>+{ACTION_REWARDS.checkin.credits}</span>
                    {nextStreakBonus > 0 && <span className="text-primary">+{nextStreakBonus}</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="w-3 h-3" />
                    <span>+{ACTION_REWARDS.checkin.experience} XP</span>
                  </div>
                </motion.div>
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
                    className="gap-2 relative overflow-hidden"
                  >
                    {checkin.isPending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Gift className="h-4 w-4" />
                      </motion.div>
                    )}
                    Забрать
                    
                    {/* Shine effect */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                  <span>Выполнено</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>

        {/* Decorative stars */}
        {canCheckin && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {starMovements.map((movement, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.5, 0],
                  scale: [0, 1, 0],
                  x: [0, movement.x],
                  y: [0, movement.y],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="absolute"
                style={{ left: `${20 + i * 30}%`, top: '50%' }}
              >
                <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      <RewardCelebration
        show={showCelebration}
        credits={celebrationData?.credits}
        experience={celebrationData?.experience}
        streak={celebrationData?.streak}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}
