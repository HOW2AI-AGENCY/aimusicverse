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
    <div className="space-y-3">
      {/* Daily Checkin */}
      <DailyCheckin />

      {/* Enhanced Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => navigate('/rewards')}
        className="group relative cursor-pointer"
      >
        {/* Animated gradient border on hover */}
        <motion.div 
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)/0.5), hsl(var(--generate)/0.5), hsl(var(--warning)/0.5), hsl(var(--primary)/0.5))',
            backgroundSize: '300% 300%',
          }}
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="relative flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm border border-border/50 group-hover:border-transparent transition-all shadow-lg shadow-black/5">
          <div className="flex items-center gap-4">
            {/* Level Progress Ring with enhanced glow */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {/* Outer glow ring */}
              <motion.div 
                className="absolute -inset-2 rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary)/0.3) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <ProgressRing
                value={progress}
                size="md"
                color="gradient"
              >
                <div className="flex flex-col items-center">
                  <motion.span 
                    className="text-base font-bold text-foreground"
                    key={level}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {level}
                  </motion.span>
                  <span className="text-[7px] text-muted-foreground uppercase tracking-wider font-medium">LVL</span>
                </div>
              </ProgressRing>
              
              {/* Crown for high levels */}
              {level >= 5 && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [-5, 5, -5], y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </motion.div>
              )}
            </motion.div>

            {/* Stats Grid - Redesigned */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {/* Credits with visual indicator */}
                <motion.div 
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl",
                    balance < 20 
                      ? "bg-gradient-to-r from-destructive/15 to-destructive/5 border border-destructive/30" 
                      : "bg-gradient-to-r from-warning/15 to-warning/5 border border-warning/30"
                  )}
                  whileHover={{ scale: 1.02 }}
                  animate={balance < 20 ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.div
                    animate={balance < 20 ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Coins className={cn(
                      "w-4 h-4",
                      balance < 20 ? "text-destructive" : "text-warning"
                    )} />
                  </motion.div>
                  <span className={cn(
                    "font-bold tabular-nums text-base",
                    balance < 20 ? "text-destructive" : "text-warning"
                  )}>
                    {balance}
                  </span>
                </motion.div>

                {/* XP Progress with bar */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Zap className="w-3.5 h-3.5 text-primary" />
                    </motion.div>
                    <span className="text-xs tabular-nums font-semibold text-foreground">{currentXP}</span>
                    <span className="text-[10px] text-muted-foreground">/ {nextLevelXP}</span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-20 h-1 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Streak indicator - Enhanced */}
              {streak > 0 && (
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Badge 
                    className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 text-orange-500 gap-1.5 px-2.5 py-1"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [-5, 5, -5],
                      }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="font-bold">{streak}</span>
                    <span className="text-[10px] opacity-80">дн.</span>
                  </Badge>
                  
                  {streak >= 7 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-yellow-500/30 text-yellow-500">
                      <Trophy className="w-2.5 h-2.5 mr-0.5" />
                      Супер!
                    </Badge>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Actions */}
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
            
            {/* Arrow indicator */}
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-muted/50 to-muted/30 group-hover:from-primary/20 group-hover:to-primary/10 transition-all shadow-inner"
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
