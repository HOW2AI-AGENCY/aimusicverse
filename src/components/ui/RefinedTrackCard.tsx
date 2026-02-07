/**
 * RefinedTrackCard - Premium track card with glassmorphism and micro-interactions
 * Phase 5 Professional UI (Spec 032)
 * 
 * Features:
 * - Glassmorphism effects
 * - Smooth hover animations
 * - Optimistic like updates
 * - Telegram haptic integration
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, Heart, MoreHorizontal, Music2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { Button } from './button';
import { Badge } from './badge';
import { pill, interactive, surface } from '@/lib/overlay-colors';

interface RefinedTrackCardProps {
  id: string;
  title: string;
  style?: string;
  coverUrl?: string | null;
  isPlaying?: boolean;
  isLiked?: boolean;
  likesCount?: number;
  stemCount?: number;
  duration?: number;
  onPlay?: () => void;
  onLike?: () => void;
  onOptions?: () => void;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

export const RefinedTrackCard = memo(function RefinedTrackCard({
  id,
  title,
  style,
  coverUrl,
  isPlaying = false,
  isLiked = false,
  likesCount = 0,
  stemCount = 0,
  duration,
  onPlay,
  onLike,
  onOptions,
  onClick,
  className,
  variant = 'default',
}: RefinedTrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    onPlay?.();
  }, [onPlay]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    setLocalLiked(!localLiked);
    onLike?.();
  }, [onLike, localLiked]);

  const handleOptions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    onOptions?.();
  }, [onOptions]);

  const handleClick = useCallback(() => {
    hapticImpact('light');
    onClick?.();
  }, [onClick]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <motion.div
      className={cn(
        'group relative rounded-2xl overflow-hidden cursor-pointer',
        'bg-card/80 backdrop-blur-sm border border-border/50',
        'shadow-sm hover:shadow-lg transition-shadow duration-300',
        isPlaying && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isCompact && 'flex items-center gap-3 p-2',
        isFeatured && 'aspect-[4/3]',
        !isCompact && !isFeatured && 'aspect-square',
        className
      )}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      layout
    >
      {/* Cover Image */}
      <div className={cn(
        'relative overflow-hidden',
        isCompact ? 'w-14 h-14 rounded-xl flex-shrink-0' : 'w-full h-full',
        !isCompact && 'absolute inset-0'
      )}>
        {coverUrl && !imageError ? (
          <motion.img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            animate={isHovered && !isCompact ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent flex items-center justify-center">
            <Music2 className={cn(
              'text-primary/40',
              isCompact ? 'w-6 h-6' : 'w-12 h-12'
            )} />
          </div>
        )}

        {/* Gradient overlay for non-compact */}
        {!isCompact && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        )}
      </div>

      {/* Play button overlay */}
      {!isCompact && (
        <AnimatePresence>
          {(isHovered || isPlaying) && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <motion.button
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center',
                  'bg-primary/90 hover:bg-primary text-primary-foreground',
                  'shadow-lg shadow-primary/25'
                )}
                onClick={handlePlay}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Content */}
      <div className={cn(
        isCompact
          ? 'flex-1 min-w-0'
          : 'absolute bottom-0 left-0 right-0 p-3'
      )}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              'font-semibold truncate',
              isCompact ? 'text-sm' : 'text-sm text-white'
            )}>
              {title || 'Без названия'}
            </h3>
            {style && (
              <p className={cn(
                'text-xs truncate',
                isCompact ? 'text-muted-foreground' : 'text-white/70'
              )}>
                {style}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Like button */}
            <motion.button
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                'transition-colors',
                isCompact 
                  ? interactive.hover 
                  : surface.medium,
                localLiked && 'text-red-500'
              )}
              onClick={handleLike}
              whileTap={{ scale: 0.85 }}
            >
              <Heart className={cn('w-4 h-4', localLiked && 'fill-current')} />
            </motion.button>

            {/* Compact: play button */}
            {isCompact && (
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={handlePlay}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                )}
              </Button>
            )}

            {/* Options */}
            {onOptions && (
              <motion.button
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'transition-colors',
                  isCompact ? interactive.hover : cn(surface.medium, 'text-white')
                )}
                onClick={handleOptions}
                whileTap={{ scale: 0.85 }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      {!isCompact && (
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {/* Duration */}
          {duration && (
            <Badge variant="secondary" className={cn("border-0 text-[10px]", pill.glassDark)}>
              {formatDuration(duration)}
            </Badge>
          )}

          {/* Stems */}
          {stemCount > 0 && (
            <Badge variant="secondary" className={cn("border-0 text-[10px] gap-1", pill.glassDark)}>
              <Layers className="w-3 h-3" />
              {stemCount}
            </Badge>
          )}
        </div>
      )}

      {/* Playing indicator */}
      {isPlaying && (
        <div className={cn(
          'absolute flex gap-0.5',
          isCompact ? 'top-1 right-1' : 'top-2 right-2'
        )}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-primary rounded-full"
              animate={{ height: [4, 12, 4] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
});
