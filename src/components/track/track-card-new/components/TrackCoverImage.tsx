/**
 * TrackCoverImage - Track cover with play overlay
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';
import { PlayingIndicator } from './PlayingIndicator';

type CoverSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<CoverSize, string> = {
  xs: 'w-11 h-11',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-full aspect-square',
};

const buttonSizeClasses: Record<CoverSize, string> = {
  xs: 'w-8 h-8',
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  lg: 'w-11 h-11 min-w-[44px] min-h-[44px]',
};

interface TrackCoverImageProps {
  coverUrl?: string | null;
  title?: string | null;
  size?: CoverSize;
  isPlaying?: boolean;
  isHovered?: boolean;
  onPlay?: (e: React.MouseEvent) => void;
  showPlayingGlow?: boolean;
  className?: string;
}

export const TrackCoverImage = memo(function TrackCoverImage({
  coverUrl,
  title,
  size = 'md',
  isPlaying = false,
  isHovered = false,
  onPlay,
  showPlayingGlow = true,
  className,
}: TrackCoverImageProps) {
  const [imageError, setImageError] = useState(false);
  
  const showOverlay = isPlaying || isHovered;
  const isGridSize = size === 'lg';

  return (
    <div
      className={cn(
        'relative flex-shrink-0 rounded-lg overflow-hidden shadow-md',
        sizeClasses[size],
        className
      )}
    >
      <LazyImage
        src={coverUrl || ''}
        alt={title || 'Track cover'}
        className="w-full h-full object-cover"
        containerClassName="w-full h-full"
        coverSize={isGridSize ? 'medium' : 'small'}
        fallback={
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center">
            <Disc3 className={cn('text-primary/50', isGridSize ? 'w-8 h-8' : 'w-5 h-5')} />
          </div>
        }
        onError={() => setImageError(true)}
      />

      {/* Play/Pause Overlay */}
      <motion.div
        className={cn(
          'absolute inset-0 flex items-center justify-center cursor-pointer',
          isGridSize
            ? 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
            : 'bg-black/50',
          !showOverlay && 'opacity-0'
        )}
        animate={{ opacity: showOverlay ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        onClick={onPlay}
        data-play-button
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="playing"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {isGridSize ? (
                <Button
                  size="icon"
                  className={cn(buttonSizeClasses[size], 'rounded-full bg-primary')}
                  onClick={onPlay}
                >
                  <Pause className="w-5 h-5 text-primary-foreground" />
                </Button>
              ) : (
                <PlayingIndicator color="bg-white" />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {isGridSize ? (
                <Button
                  size="icon"
                  className={cn(buttonSizeClasses[size], 'rounded-full bg-primary/90 hover:bg-primary')}
                  onClick={onPlay}
                >
                  <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                </Button>
              ) : (
                <Play className="w-5 h-5 text-white fill-white" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Active playing glow */}
      {isPlaying && showPlayingGlow && (
        <motion.div
          className="absolute inset-0 rounded-lg ring-2 ring-primary pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 0 hsl(var(--primary) / 0.4)',
              '0 0 0 4px hsl(var(--primary) / 0)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );
});
