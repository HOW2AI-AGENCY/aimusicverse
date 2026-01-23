/**
 * GamificationBar - Modern, compact gamification widget
 * Optimized for mobile with tooltips and micro-animations
 */
import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useNavigate } from 'react-router-dom';
import { 
  useUserCredits, 
  getLevelProgress, 
  useCheckin, 
  useCanCheckinToday,
  ACTION_REWARDS 
} from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { useRewardNotificationContext } from '@/contexts/RewardNotificationContext';
import { 
  Coins, Flame, Zap, Gift, Check, Sparkles, 
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GamificationBarProps {
  className?: string;
}

export const GamificationBar = memo(function GamificationBar({ className }: GamificationBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: credits, isLoading } = useUserCredits();
  const { data: canCheckin } = useCanCheckinToday();
  const checkin = useCheckin();
  const { showStreak, showCredits } = useRewardNotificationContext();

  const handleCheckin = (e: React.MouseEvent) => {
    e.stopPropagation();
    checkin.mutate(undefined, {
      onSuccess: (result) => {
        // Show unified reward notification
        if (result.streak > 1) {
          showStreak(result.streak, { credits: result.credits, experience: result.experience });
        } else {
          showCredits(result.credits);
        }
        localStorage.setItem('first-checkin-completed', 'true');
      },
    });
  };

  if (!user || isLoading) {
    return (
      <div className={cn("h-12 sm:h-14 bg-card/40 animate-pulse rounded-2xl", className)} />
    );
  }

  const level = credits?.level || 1;
  const { progress, current: currentXP, next: nextLevelXP } = getLevelProgress(credits?.experience || 0);
  const streak = credits?.current_streak || 0;
  const balance = credits?.balance || 0;

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative overflow-hidden rounded-xl sm:rounded-2xl",
          "bg-gradient-to-r from-card/80 via-card/60 to-card/80",
          "backdrop-blur-lg border border-border/30",
          "shadow-sm",
          className
        )}
      >
        {/* Simplified background - no animation on mobile */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative p-2 sm:p-3 flex items-center gap-1.5 sm:gap-3">
          {/* Level Badge with Progress Ring */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => navigate('/rewards')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex-shrink-0 group"
              >
                <svg className="w-9 h-9 sm:w-11 sm:h-11 -rotate-90" viewBox="0 0 44 44">
                  {/* Background ring */}
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted/20"
                  />
                  {/* Progress ring */}
                  <motion.circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="url(#levelGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 113.1} 113.1`}
                    initial={{ strokeDasharray: '0 113.1' }}
                    animate={{ strokeDasharray: `${progress * 113.1} 113.1` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                    {level}
                  </span>
                </div>
                {/* Level up glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-semibold">Уровень {level}</p>
              <p className="text-muted-foreground">{currentXP} / {nextLevelXP} XP</p>
            </TooltipContent>
          </Tooltip>

          {/* Stats - Scrollable on mobile */}
          <div className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
            {/* Balance */}
            <StatPill
              icon={<Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              value={balance}
              color="warning"
              onClick={() => navigate('/rewards')}
              pulse={balance < 20}
              tooltip="Кредиты для генерации музыки"
            />

            {/* XP */}
            <StatPill
              icon={<Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              value={`${currentXP}`}
              color="primary"
              onClick={() => navigate('/rewards')}
              tooltip={`${currentXP} / ${nextLevelXP} до следующего уровня`}
            />

            {/* Streak */}
            {streak > 0 && (
              <StatPill
                icon={<Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                value={streak}
                color="streak"
                glow
                tooltip={`Серия ${streak} дней подряд`}
              />
            )}
          </div>

          {/* Check-in Button */}
          <AnimatePresence mode="wait">
            {canCheckin ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    key="checkin"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      onClick={handleCheckin}
                      disabled={checkin.isPending}
                      size="sm"
                      className={cn(
                        "relative h-8 sm:h-9 px-2.5 sm:px-4 rounded-xl font-medium text-xs",
                        "bg-gradient-to-r from-primary to-primary/80",
                        "hover:from-primary/90 hover:to-primary/70",
                        "shadow-lg shadow-primary/20",
                        "transition-all duration-300"
                      )}
                    >
                      {checkin.isPending ? (
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <>
                          <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">+{ACTION_REWARDS.checkin.credits}</span>
                        </>
                      )}
                      {/* Pulse indicator */}
                      <motion.span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-400"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Забрать ежедневный бонус</p>
                  <p className="text-muted-foreground">+{ACTION_REWARDS.checkin.credits} кредитов</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-green-500/10 border border-green-500/20"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                    </motion.div>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Бонус получен</p>
                  <p className="text-muted-foreground">Приходи завтра!</p>
                </TooltipContent>
              </Tooltip>
            )}
          </AnimatePresence>

          {/* Navigate Arrow */}
          <motion.button
            onClick={() => navigate('/rewards')}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Bottom XP progress bar */}
        <div className="h-0.5 bg-muted/20">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </TooltipProvider>
  );
});

// Stat Pill Component with Tooltip
interface StatPillProps {
  icon: React.ReactNode;
  value: string | number;
  color: 'primary' | 'warning' | 'streak' | 'success';
  onClick?: () => void;
  pulse?: boolean;
  glow?: boolean;
  tooltip?: string;
}

const StatPill = memo(function StatPill({ 
  icon, 
  value, 
  color, 
  onClick, 
  pulse, 
  glow,
  tooltip 
}: StatPillProps) {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    streak: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  const content = (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg",
        "text-[10px] sm:text-xs font-semibold whitespace-nowrap",
        "border backdrop-blur-sm",
        "transition-colors duration-150",
        colorStyles[color],
        onClick && "cursor-pointer hover:brightness-110",
        glow && "shadow-md shadow-orange-500/20"
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="tabular-nums">{value}</span>
      
      {/* Pulse animation for low balance - simplified */}
      {pulse && (
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
    </motion.button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
});

export default GamificationBar;
