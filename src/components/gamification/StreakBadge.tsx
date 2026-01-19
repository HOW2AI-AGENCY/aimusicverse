/**
 * StreakBadge - Compact streak indicator for headers
 * Shows current streak with fire animation
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useTelegram } from '@/contexts/TelegramContext';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StreakBadge = memo(function StreakBadge({
  size = 'md',
  showLabel = false,
  className,
  onClick,
}: StreakBadgeProps) {
  const { credits, isLoading } = useUserCredits();
  const { hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
  const streak = credits?.current_streak || 0;
  
  // Don't show if no streak
  if (isLoading || streak === 0) {
    return null;
  }

  const handleClick = () => {
    hapticFeedback?.('light');
    if (onClick) {
      onClick();
    } else {
      navigate('/rewards');
    }
  };

  const sizeClasses = {
    sm: 'h-6 px-1.5 text-xs gap-0.5',
    md: 'h-8 px-2 text-sm gap-1',
    lg: 'h-10 px-3 text-base gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Determine if streak is "hot" (3+ days)
  const isHot = streak >= 3;
  const isOnFire = streak >= 7;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center rounded-full font-semibold",
            "bg-gradient-to-r from-orange-500/20 to-amber-500/20",
            "border border-orange-500/30",
            "text-orange-500 dark:text-orange-400",
            "hover:from-orange-500/30 hover:to-amber-500/30",
            "active:scale-95 transition-all duration-200",
            "cursor-pointer select-none",
            sizeClasses[size],
            isOnFire && "shadow-lg shadow-orange-500/25",
            className
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={streak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                rotate: isHot ? [0, -5, 5, -5, 0] : 0,
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                rotate: {
                  duration: 0.5,
                  repeat: isOnFire ? Infinity : 0,
                  repeatDelay: 2,
                }
              }}
            >
              <Flame 
                className={cn(
                  iconSizes[size],
                  isOnFire && "drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]"
                )} 
              />
            </motion.div>
          </AnimatePresence>
          
          <motion.span
            key={streak}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-bold"
          >
            {streak}
          </motion.span>
          
          {showLabel && (
            <span className="text-orange-400/80 font-normal">
              {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
            </span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-center">
        <p className="font-semibold">🔥 Серия {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</p>
      </TooltipContent>
    </Tooltip>
  );
});

export default StreakBadge;
