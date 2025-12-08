import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { useUserCredits, getLevelProgress } from '@/hooks/useGamification';
import { Coins, ChevronRight, Flame, Zap } from 'lucide-react';
import { ProgressRing } from '@/components/ui/progress-ring';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

export function GamificationWidget() {
  const navigate = useNavigate();
  const { data: credits, isLoading } = useUserCredits();

  if (isLoading) {
    return (
      <div className="space-y-3 mb-6">
        <div className="h-[72px] bg-muted/50 animate-pulse rounded-2xl" />
        <div className="h-16 bg-muted/50 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const level = credits?.level || 1;
  const { progress, current: currentXP, next: nextLevelXP } = getLevelProgress(credits?.experience || 0);

  return (
    <div className="space-y-3 mb-6">
      {/* Daily Checkin */}
      <DailyCheckin />

      {/* Stats Card - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard
          hover="glow"
          padding="none"
          className="cursor-pointer"
          onClick={() => navigate('/rewards')}
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-4">
              {/* Level Progress Ring */}
              <ProgressRing
                value={progress}
                size="md"
                color="gradient"
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold">{level}</span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-wide">LVL</span>
                </div>
              </ProgressRing>

              {/* Stats */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  {/* Credits */}
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-warning" />
                    <span className="font-bold tabular-nums">{credits?.balance || 0}</span>
                  </div>

                  {/* XP */}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs tabular-nums">
                      {currentXP}/{nextLevelXP} XP
                    </span>
                  </div>
                </div>

                {/* Streak */}
                {(credits?.current_streak || 0) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-500">
                      {credits?.current_streak} дней подряд
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
