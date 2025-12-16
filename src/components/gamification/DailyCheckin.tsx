import { motion, AnimatePresence } from '@/lib/motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCheckin, useCanCheckinToday, useUserCredits, ACTION_REWARDS } from '@/hooks/useGamification';
import { Flame, Gift, Sparkles, Check, Coins, Star, Zap, Calendar } from 'lucide-react';
import { RewardCelebration } from './RewardCelebration';
import { cn } from '@/lib/utils';

// Generate random star movements outside of component to ensure purity
const generateStarMovements = () =>
  Array.from({ length: 5 }, () => ({
    x: Math.random() * 60 - 30,
    y: Math.random() * -40 - 10,
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

  const streak = credits?.current_streak || 0;

  return (
    <>
      <motion.div 
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
          "border border-primary/20",
          canCheckin && "shadow-lg shadow-primary/10"
        )}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated background glow for available checkin */}
        {canCheckin && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/10 via-generate/10 to-primary/10"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          />
        )}

        <div className="relative p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Icon container with animation */}
              <motion.div
                className={cn(
                  "relative w-12 h-12 rounded-xl flex items-center justify-center",
                  canCheckin 
                    ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30" 
                    : "bg-green-500/10 border border-green-500/20"
                )}
                animate={canCheckin ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {canCheckin ? (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Gift className="w-6 h-6 text-orange-500" />
                  </motion.div>
                ) : (
                  <Check className="w-6 h-6 text-green-500" />
                )}
                
                {/* Notification dot */}
                {canCheckin && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm sm:text-base">Ежедневный чекин</span>
                  {streak > 0 && (
                    <Badge 
                      className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-500 gap-1 px-2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Flame className="w-3 h-3" />
                      </motion.div>
                      {streak}
                    </Badge>
                  )}
                </div>
                
                {canCheckin ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-warning/10 border border-warning/20">
                      <Coins className="w-3 h-3 text-warning" />
                      <span className="text-xs font-semibold text-warning">
                        +{ACTION_REWARDS.checkin.credits}
                        {nextStreakBonus > 0 && (
                          <span className="text-primary ml-1">+{nextStreakBonus}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">+{ACTION_REWARDS.checkin.experience} XP</span>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-xs text-green-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Возвращайся завтра!
                  </p>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {checkingStatus ? (
                <div className="w-24 h-11 bg-muted/30 animate-pulse rounded-xl" />
              ) : canCheckin ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <Button 
                    onClick={handleCheckin}
                    disabled={checkin.isPending}
                    className="relative gap-2 px-5 h-11 rounded-xl font-semibold shadow-lg shadow-primary/25 overflow-hidden"
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
                    <span>Забрать</span>
                    
                    {/* Shine effect */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-green-500 bg-green-500/10 border border-green-500/20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                  <span>Готово</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Decorative floating stars */}
        {canCheckin && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {starMovements.map((movement, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.7, 0],
                  scale: [0, 1, 0],
                  x: [0, movement.x],
                  y: [0, movement.y],
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.4,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
                className="absolute"
                style={{ left: `${15 + i * 18}%`, top: '60%' }}
              >
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

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
