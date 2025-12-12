import { useState } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { GamificationOnboarding } from '@/components/gamification/GamificationOnboarding';
import { useUserCredits, getLevelProgress } from '@/hooks/useGamification';
import { Coins, ChevronRight, Flame, Zap, Trophy, HelpCircle } from 'lucide-react';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function GamificationWidget() {
  const navigate = useNavigate();
  const { data: credits, isLoading } = useUserCredits();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3 mb-6">
        <div className="h-[72px] bg-muted/30 animate-pulse rounded-2xl" />
        <div className="h-16 bg-muted/30 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const level = credits?.level || 1;
  const { progress, current: currentXP, next: nextLevelXP } = getLevelProgress(credits?.experience || 0);
  const streak = credits?.current_streak || 0;

  return (
    <div className="space-y-3">
      {/* Daily Checkin */}
      <DailyCheckin />

      {/* Stats Card - Modern glassmorphism design */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => navigate('/rewards')}
        className="group relative cursor-pointer"
      >
        {/* Animated gradient border */}
        <motion.div 
          className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/40 via-generate/40 to-warning/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 200%' }}
        />
        
        <div className="relative flex items-center justify-between p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 group-hover:border-transparent transition-colors">
          <div className="flex items-center gap-4">
            {/* Level Progress Ring with glow */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <ProgressRing
                value={progress}
                size="md"
                color="gradient"
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-foreground">{level}</span>
                  <span className="text-[7px] text-muted-foreground uppercase tracking-wider">LVL</span>
                </div>
              </ProgressRing>
              
              {/* Level glow effect - always visible with pulse */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Stats Grid */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-4">
                {/* Credits with pulse when low */}
                <motion.div 
                  className="flex items-center gap-1.5"
                  whileHover={{ scale: 1.05 }}
                  animate={(credits?.balance || 0) < 20 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    (credits?.balance || 0) < 20 
                      ? "bg-destructive/10 animate-pulse" 
                      : "bg-warning/10"
                  )}>
                    <Coins className={cn(
                      "w-4 h-4",
                      (credits?.balance || 0) < 20 ? "text-destructive" : "text-warning"
                    )} />
                  </div>
                  <span className="font-bold tabular-nums text-foreground text-base">{credits?.balance || 0}</span>
                </motion.div>

                {/* XP Progress */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Zap className="w-4 h-4 text-primary" />
                  </motion.div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm tabular-nums font-medium text-foreground">{currentXP}</span>
                    <span className="text-xs text-muted-foreground">/ {nextLevelXP}</span>
                  </div>
                </div>
              </div>

              {/* Streak indicator with fire animation */}
              {streak > 0 && (
                <motion.div 
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [-5, 5, -5],
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Flame className="w-4 h-4 text-orange-500" />
                    </motion.div>
                    <span className="text-sm font-bold text-orange-500">{streak}</span>
                    <span className="text-xs text-orange-500/70">дн.</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Arrow with animation */}
          <div className="flex items-center gap-2">
            {/* Help button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                setShowOnboarding(true);
              }}
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </Button>
            
            <motion.div
              className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 group-hover:bg-primary/20 transition-colors"
              whileHover={{ x: 3 }}
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Gamification Onboarding */}
      <GamificationOnboarding
        show={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}
