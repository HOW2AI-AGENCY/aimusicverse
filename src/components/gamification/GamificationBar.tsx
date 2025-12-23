/**
 * GamificationBar - Modern, compact gamification widget
 * Combines daily check-in and stats into a single sleek component
 */
import { memo, useState } from 'react';
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
import { 
  Coins, Flame, Zap, Gift, Check, Sparkles, 
  ChevronRight, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RewardCelebration } from './RewardCelebration';

interface GamificationBarProps {
  className?: string;
}

export const GamificationBar = memo(function GamificationBar({ className }: GamificationBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: credits, isLoading } = useUserCredits();
  const { data: canCheckin } = useCanCheckinToday();
  const checkin = useCheckin();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    credits: number;
    experience: number;
    streak: number;
  } | null>(null);

  const handleCheckin = (e: React.MouseEvent) => {
    e.stopPropagation();
    checkin.mutate(undefined, {
      onSuccess: (result) => {
        setCelebrationData({
          credits: result.credits,
          experience: result.experience,
          streak: result.streak,
        });
        setShowCelebration(true);
        localStorage.setItem('first-checkin-completed', 'true');
      },
    });
  };

  if (!user || isLoading) {
    return (
      <div className={cn("h-14 bg-card/40 animate-pulse rounded-2xl", className)} />
    );
  }

  const level = credits?.level || 1;
  const { progress, current: currentXP, next: nextLevelXP } = getLevelProgress(credits?.experience || 0);
  const streak = credits?.current_streak || 0;
  const balance = credits?.balance || 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-r from-card/80 via-card/60 to-card/80",
          "backdrop-blur-xl border border-border/30",
          "shadow-lg shadow-black/5",
          className
        )}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-10 -right-10 w-28 h-28 bg-accent/10 rounded-full blur-3xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <div className="relative p-3 flex items-center gap-3">
          {/* Level Badge with Progress Ring */}
          <motion.button
            onClick={() => navigate('/rewards')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex-shrink-0 group"
          >
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
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
              <span className="text-xs font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                {level}
              </span>
            </div>
            {/* Level up glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </motion.button>

          {/* Stats */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* Balance */}
            <StatPill
              icon={<Coins className="w-3.5 h-3.5" />}
              value={balance}
              color="warning"
              onClick={() => navigate('/rewards')}
              pulse={balance < 20}
            />

            {/* XP */}
            <StatPill
              icon={<Zap className="w-3.5 h-3.5" />}
              value={`${currentXP}XP`}
              color="primary"
              onClick={() => navigate('/rewards')}
            />

            {/* Streak */}
            {streak > 0 && (
              <StatPill
                icon={<Flame className="w-3.5 h-3.5" />}
                value={`${streak}д`}
                color="streak"
                glow
              />
            )}
          </div>

          {/* Check-in Button */}
          <AnimatePresence mode="wait">
            {canCheckin ? (
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
                    "relative h-9 px-4 rounded-xl font-medium",
                    "bg-gradient-to-r from-primary to-primary/80",
                    "hover:from-primary/90 hover:to-primary/70",
                    "shadow-lg shadow-primary/20",
                    "transition-all duration-300"
                  )}
                >
                  {checkin.isPending ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-1.5" />
                      <span className="text-xs">+{ACTION_REWARDS.checkin.credits}</span>
                    </>
                  )}
                  {/* Pulse indicator */}
                  <motion.span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20"
              >
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-500">✓</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigate Arrow */}
          <motion.button
            onClick={() => navigate('/rewards')}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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

      <RewardCelebration
        show={showCelebration}
        credits={celebrationData?.credits}
        experience={celebrationData?.experience}
        streak={celebrationData?.streak}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
});

// Stat Pill Component
interface StatPillProps {
  icon: React.ReactNode;
  value: string | number;
  color: 'primary' | 'warning' | 'streak' | 'success';
  onClick?: () => void;
  pulse?: boolean;
  glow?: boolean;
}

const StatPill = memo(function StatPill({ 
  icon, 
  value, 
  color, 
  onClick, 
  pulse, 
  glow 
}: StatPillProps) {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    streak: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl",
        "text-xs font-semibold whitespace-nowrap",
        "border backdrop-blur-sm",
        "transition-all duration-200",
        colorStyles[color],
        onClick && "cursor-pointer hover:brightness-110",
        glow && "shadow-lg shadow-orange-500/20"
      )}
    >
      {icon}
      <span className="tabular-nums">{value}</span>
      
      {/* Pulse animation for low balance */}
      {pulse && (
        <motion.span
          className="absolute inset-0 rounded-xl border-2 border-amber-400"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
});

export default GamificationBar;
