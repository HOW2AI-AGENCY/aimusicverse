import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserCredits, getLevelProgress } from '@/hooks/useGamification';
import { Coins, Flame, Zap, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GamificationWidgetCompactProps {
  showCheckin?: boolean;
  className?: string;
}

export function GamificationWidgetCompact({ showCheckin = true, className }: GamificationWidgetCompactProps) {
  const navigate = useNavigate();
  const { data: credits, isLoading } = useUserCredits();

  if (isLoading) {
    return (
      <div className={cn("h-12 bg-muted/30 animate-pulse rounded-xl", className)} />
    );
  }

  const level = credits?.level || 1;
  const { progress } = getLevelProgress(credits?.experience || 0);
  const streak = credits?.current_streak || 0;
  const canCheckin = !credits?.last_checkin_date || 
    new Date(credits.last_checkin_date).toDateString() !== new Date().toDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between gap-2 p-2 sm:p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50",
        className
      )}
    >
      {/* Stats Row */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Level Badge */}
        <motion.div 
          className="flex items-center gap-1.5 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/rewards')}
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-primary-foreground">{level}</span>
            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="2"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray={`${progress * 2.83} 283`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </motion.div>

        {/* Credits */}
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-warning" />
          <span className="font-semibold tabular-nums text-sm">{credits?.balance || 0}</span>
        </div>

        {/* XP */}
        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs tabular-nums">{credits?.experience || 0} XP</span>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-semibold text-orange-500">{streak}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {showCheckin && canCheckin && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/rewards')}
            className="h-8 px-3 gap-1.5 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground"
          >
            <Gift className="w-3.5 h-3.5" />
            <span className="text-xs font-medium hidden sm:inline">Чекин</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/rewards')}
          className="h-8 w-8 rounded-lg"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  );
}
