/**
 * QuickLikeButton - One-tap like button for track cards
 * Provides instant feedback with animation and haptics
 * Suggests playlist creation after 3 likes in session
 */

import { memo, useCallback, useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { useLikeTrack } from '@/hooks/engagement/useLikeTrack';
import { useLikeSessionTracker } from '@/hooks/engagement/useLikeSessionTracker';
import { useAuth } from '@/hooks/useAuth';
import { notify } from '@/lib/notifications';

interface QuickLikeButtonProps {
  trackId: string;
  isLiked?: boolean;
  likesCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'overlay' | 'minimal';
  className?: string;
  onLikeChange?: (isLiked: boolean) => void;
}

export const QuickLikeButton = memo(function QuickLikeButton({
  trackId,
  isLiked: initialIsLiked = false,
  likesCount = 0,
  size = 'md',
  showCount = false,
  variant = 'default',
  className,
  onLikeChange,
}: QuickLikeButtonProps) {
  const { hapticFeedback } = useTelegram();
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const { trackLike } = useLikeSessionTracker();
  
  const { isLiked, isLoading, toggleLike } = useLikeTrack(trackId);
  
  // Use controlled value if provided, otherwise use hook value
  const currentIsLiked = initialIsLiked || isLiked;
  
  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      notify.error('Войдите, чтобы ставить лайки');
      return;
    }
    
    if (isLoading) return;
    
    // Haptic feedback
    hapticFeedback(currentIsLiked ? 'light' : 'medium');
    
    // Start animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Toggle like
    toggleLike();
    onLikeChange?.(!currentIsLiked);
    
    // Track for playlist suggestion
    trackLike(!currentIsLiked);
    
    // Show toast
    notify.trackLiked(!currentIsLiked);
  }, [user, isLoading, currentIsLiked, hapticFeedback, toggleLike, trackId, onLikeChange, trackLike]);
  
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };
  
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  const variantClasses = {
    default: cn(
      "rounded-lg transition-all active:scale-90",
      currentIsLiked 
        ? "bg-red-500/15 text-red-500 hover:bg-red-500/25" 
        : "bg-muted/60 text-muted-foreground hover:text-red-400 hover:bg-muted"
    ),
    overlay: cn(
      "rounded-full bg-black/40 backdrop-blur-sm transition-all active:scale-90",
      currentIsLiked 
        ? "text-red-500" 
        : "text-white/80 hover:text-red-400"
    ),
    minimal: cn(
      "rounded-full transition-all active:scale-90",
      currentIsLiked 
        ? "text-red-500" 
        : "text-muted-foreground hover:text-red-400"
    ),
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center gap-1",
        sizeClasses[size],
        variantClasses[variant],
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={currentIsLiked ? "Убрать лайк" : "Поставить лайк"}
      aria-pressed={currentIsLiked}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIsLiked ? 'liked' : 'unliked'}
          initial={{ scale: 0.8 }}
          animate={{ 
            scale: isAnimating ? [1, 1.3, 1] : 1,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Heart 
            className={cn(
              iconSizes[size],
              "transition-colors"
            )}
            fill={currentIsLiked ? 'currentColor' : 'none'}
          />
        </motion.div>
      </AnimatePresence>
      
      {showCount && likesCount > 0 && (
        <span className="text-xs font-medium tabular-nums">
          {likesCount}
        </span>
      )}
    </button>
  );
});
