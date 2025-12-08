import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { useUserCredits, getLevelProgress } from '@/hooks/useGamification';
import { Coins, ChevronRight, Flame, Zap, Trophy } from 'lucide-react';
import { ProgressRing } from '@/components/ui/progress-ring';
import { cn } from '@/lib/utils';

export function GamificationWidget() {
  const navigate = useNavigate();
  const { data: credits, isLoading } = useUserCredits();

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
    <div className="space-y-3 mb-6">
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
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-generate/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-center justify-between p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 group-hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-4">
            {/* Level Progress Ring with glow */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
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
              
              {/* Level glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
            </motion.div>

            {/* Stats Grid */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-4">
                {/* Credits */}
                <motion.div 
                  className="flex items-center gap-1.5"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1 rounded-md bg-warning/10">
                    <Coins className="w-3.5 h-3.5 text-warning" />
                  </div>
                  <span className="font-bold tabular-nums text-foreground">{credits?.balance || 0}</span>
                </motion.div>

                {/* XP Progress */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs tabular-nums font-medium text-foreground">{currentXP}</span>
                    <span className="text-xs text-muted-foreground">/ {nextLevelXP}</span>
                  </div>
                </div>
              </div>

              {/* Streak indicator */}
              {streak > 0 && (
                <motion.div 
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-500">{streak}</span>
                    <span className="text-[10px] text-orange-500/70">дн.</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Arrow with animation */}
          <motion.div
            className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors"
            whileHover={{ x: 3 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
