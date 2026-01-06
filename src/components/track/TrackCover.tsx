/**
 * TrackCover - Unified track cover component with play overlay
 * 
 * Features:
 * - Lazy image loading
 * - Play/pause overlay
 * - Duration badge
 * - Optional playing indicator
 */

import { memo, useState } from 'react';
import { Play, Pause, Music2 } from 'lucide-react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/player-utils';

interface TrackCoverProps {
  coverUrl?: string | null;
  title?: string | null;
  duration?: number | null;
  isPlaying?: boolean;
  isHovered?: boolean;
  onPlay?: (e: React.MouseEvent) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDuration?: boolean;
  showPlayingIndicator?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  xs: { 
    container: 'w-11 h-11', 
    playButton: 'w-11 h-11',
    playIcon: 'w-4 h-4',
    duration: 'text-[8px] px-1 py-0.5',
    fallbackIcon: 'text-sm',
    fallbackEmoji: '🎵',
  },
  sm: { 
    container: 'w-14 h-14', 
    playButton: 'w-10 h-10',
    playIcon: 'w-4 h-4',
    duration: 'text-[9px] px-1.5 py-0.5',
    fallbackIcon: 'w-5 h-5',
    fallbackEmoji: '♪',
  },
  md: { 
    container: 'aspect-square', 
    playButton: 'w-11 h-11',
    playIcon: 'w-4 h-4',
    duration: 'text-[10px] px-1.5 py-0.5',
    fallbackIcon: 'w-8 h-8',
    fallbackEmoji: '♪',
  },
  lg: { 
    container: 'aspect-square', 
    playButton: 'w-12 h-12',
    playIcon: 'w-5 h-5',
    duration: 'text-xs px-2 py-1',
    fallbackIcon: 'w-10 h-10',
    fallbackEmoji: '♪',
  },
};

export const TrackCover = memo(function TrackCover({
  coverUrl,
  title = 'Track',
  duration,
  isPlaying = false,
  isHovered = false,
  onPlay,
  size = 'md',
  showDuration = true,
  showPlayingIndicator = true,
  className,
}: TrackCoverProps) {
  const [imageError, setImageError] = useState(false);
  const config = SIZE_CONFIG[size];
  const showOverlay = isPlaying || isHovered;
  const displayTitle = title || 'Track';

  const fallback = (
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
      {size === 'xs' ? (
        <span className={config.fallbackIcon}>{config.fallbackEmoji}</span>
      ) : (
        <Music2 className={cn(config.fallbackIcon, 'text-primary/40')} />
      )}
    </div>
  );

  return (
    <div className={cn('relative overflow-hidden rounded-lg', config.container, className)}>
      {coverUrl && !imageError ? (
        <LazyImage
          src={coverUrl}
          alt={displayTitle}
          className="w-full h-full object-cover"
          containerClassName="w-full h-full"
          onError={() => setImageError(true)}
          fallback={fallback}
        />
      ) : (
        fallback
      )}

      {/* Play/Pause Overlay */}
      {onPlay && (
        <motion.div
          className="absolute inset-0 bg-black/60 flex items-center justify-center"
          initial={false}
          animate={{ opacity: showOverlay ? 1 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              config.playButton,
              'rounded-full text-white hover:bg-white/20',
              isPlaying && 'bg-primary hover:bg-primary/90'
            )}
            onClick={onPlay}
            data-play-button
            aria-label={isPlaying ? 'Приостановить' : 'Воспроизвести'}
          >
            {isPlaying ? (
              <Pause className={config.playIcon} />
            ) : (
              <Play className={cn(config.playIcon, 'ml-0.5')} />
            )}
          </Button>
        </motion.div>
      )}

      {/* Duration Badge */}
      {showDuration && duration && (
        <span className={cn(
          'absolute bottom-1 right-1 text-white/80 bg-black/40 rounded-full',
          config.duration
        )}>
          {formatDuration(duration)}
        </span>
      )}

      {/* Playing Indicator */}
      {showPlayingIndicator && isPlaying && (
        <div className="absolute top-1.5 left-1.5">
          <motion.div 
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-medium"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <div className="flex items-center gap-0.5 h-2">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i}
                  className="w-0.5 bg-primary-foreground rounded-full"
                  animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});
