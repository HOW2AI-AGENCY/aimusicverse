// LikeButton component - Sprint 011 Phase 6
// Animated heart button with like count

import { useLikeTrack } from '@/hooks/engagement/useLikeTrack';
import { useTrackStats } from '@/hooks/engagement/useTrackStats';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LikeButtonProps {
  trackId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showCount?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function LikeButton({
  trackId,
  variant = 'ghost',
  size = 'default',
  showCount = true,
  showIcon = true,
  className,
}: LikeButtonProps) {
  const { like, unlike, isLoading } = useLikeTrack();
  const { data: stats, isLoading: isLoadingStats } = useTrackStats({ trackId });

  const isLiked = stats?.isLiked || false;
  const likesCount = stats?.likesCount || 0;

  const handleClick = () => {
    if (isLiked) {
      unlike({ trackId });
    } else {
      like({ trackId });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || isLoadingStats}
      className={cn(
        'transition-all',
        isLiked && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      {isLoading || isLoadingStats ? (
        <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
      ) : (
        <>
          {showIcon && (
            <motion.div
              initial={false}
              animate={{
                scale: isLiked ? [1, 1.3, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
            >
              <Heart
                className={cn(
                  size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
                  isLiked && 'fill-current'
                )}
              />
            </motion.div>
          )}
          {showCount && likesCount > 0 && (
            <motion.span
              key={likesCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={cn('ml-2', size === 'sm' && 'text-xs')}
            >
              {likesCount}
            </motion.span>
          )}
        </>
      )}
    </Button>
  );
}
