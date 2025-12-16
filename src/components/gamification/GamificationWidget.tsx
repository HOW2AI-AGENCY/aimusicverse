import { useState } from 'react';
import { motion } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { DailyCheckin } from '@/components/gamification/DailyCheckin';
import { GamificationOnboarding } from '@/components/gamification/GamificationOnboarding';
import { useUserCredits, getLevelProgress } from '@/hooks/useGamification';
import { Coins, ChevronRight, Flame, Zap, Trophy, HelpCircle, Crown, Target } from 'lucide-react';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function GamificationWidget() {
  const navigate = useNavigate();
  const { data: credits, isLoading } = useUserCredits();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-[76px] bg-gradient-to-br from-muted/30 to-muted/20 animate-pulse rounded-2xl" />
        <div className="h-20 bg-gradient-to-br from-muted/30 to-muted/20 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const level = credits?.level || 1;
  const { progress, current: currentXP, next: nextLevelXP } = getLevelProgress(credits?.experience || 0);
  const streak = credits?.current_streak || 0;
  const balance = credits?.balance || 0;

  return (
    <div className="space-y-2">
      <DailyCheckin />

      {/* Compact Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => navigate('/rewards')}
        className="group relative cursor-pointer"
      >
        <div className="relative flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm border border-border/50 group-hover:border-primary/30 transition-all">
          <div className="flex items-center gap-3">
            {/* Level Ring - Compact */}
            <motion.div className="relative" whileHover={{ scale: 1.05 }}>
              <ProgressRing value={progress} size="sm" color="gradient">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-foreground">{level}</span>
                  <span className="text-[6px] text-muted-foreground uppercase">LVL</span>
                </div>
              </ProgressRing>
              {level >= 5 && (
                <Crown className="absolute -top-0.5 -right-0.5 w-3 h-3 text-yellow-500 fill-yellow-500" />
              )}
            </motion.div>

            {/* Stats - Compact */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {/* Credits */}
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
                  balance < 20 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-warning/10 text-warning"
                )}>
                  <Coins className="w-3 h-3" />
                  <span className="font-bold tabular-nums">{balance}</span>
                </div>

                {/* XP */}
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="tabular-nums font-medium">{currentXP}</span>
                  <span className="text-muted-foreground text-[10px]">/{nextLevelXP}</span>
                </div>
              </div>

              {/* Streak */}
              {streak > 0 && (
                <Badge className="w-fit bg-orange-500/10 border-orange-500/30 text-orange-500 text-[10px] px-1.5 py-0 h-5 gap-1">
                  <Flame className="w-2.5 h-2.5" />
                  <span className="font-bold">{streak} дн.</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 rounded-full"
              onClick={(e) => { e.stopPropagation(); setShowOnboarding(true); }}
            >
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </motion.div>

      <GamificationOnboarding show={showOnboarding} onComplete={() => setShowOnboarding(false)} />
    </div>
  );
}
