import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { useUserCredits, getLevelProgress } from '@/hooks/useGamification';
import { Coins, Star, ChevronRight, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function GamificationWidget() {
  const navigate = useNavigate();
  const { data: credits, isLoading } = useUserCredits();

  if (isLoading) {
    return (
      <div className="space-y-3 mb-6">
        <div className="h-[72px] bg-muted animate-pulse rounded-xl" />
        <div className="h-16 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  const level = credits?.level || 1;
  const { progress } = getLevelProgress(credits?.experience || 0);

  return (
    <div className="space-y-3 mb-6">
      {/* Daily Checkin */}
      <DailyCheckin />

      {/* Quick Stats Bar */}
      <motion.button
        onClick={() => navigate('/rewards')}
        className="w-full p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 via-primary/5 to-purple-500/10 border border-primary/20 hover:border-primary/40 transition-all"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Level */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {level}
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Уровень</p>
                <Progress value={progress} className="h-1 w-16" />
              </div>
            </div>

            {/* Credits */}
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{credits?.balance || 0}</span>
            </div>

            {/* Streak */}
            {(credits?.current_streak || 0) > 0 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="font-medium text-sm">{credits?.current_streak}</span>
              </div>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.button>
    </div>
  );
}
