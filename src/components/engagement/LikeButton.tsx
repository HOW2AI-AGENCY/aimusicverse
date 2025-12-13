// LikeButton Component - Sprint 011 Task T060
// Heart button with animation for liking tracks and comments

import React, { useCallback } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onToggle: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

/**
 * Like button with heart icon and animation
 */
export function LikeButton({
  isLiked,
  likesCount,
  onToggle,
  isLoading = false,
  size = 'md',
  showCount = true,
  className,
}: LikeButtonProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Haptic feedback (if available)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      onToggle();
    },
    [onToggle]
  );

  const sizeClasses = {
    sm: 'h-8 px-2 gap-1',
    md: 'h-9 px-3 gap-2',
    lg: 'h-10 px-4 gap-2',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Format likes count (1.2K, 1.2M, etc.)
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'text-muted-foreground hover:text-foreground transition-colors',
        isLiked && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      {/* Animated heart icon */}
      <motion.div
        key={isLiked ? 'liked' : 'unliked'}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <Heart
          className={cn(
            iconSizes[size],
            'transition-all',
            isLiked && 'fill-red-500 text-red-500'
          )}
        />
      </motion.div>

      {/* Likes count */}
      {showCount && likesCount > 0 && (
        <AnimatePresence mode="wait">
          <motion.span
            key={likesCount}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(textSizes[size], 'font-medium')}
          >
            {formatCount(likesCount)}
          </motion.span>
        </AnimatePresence>
      )}
    </Button>
  );
}
