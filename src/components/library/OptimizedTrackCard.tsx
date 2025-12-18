import { memo } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';

/**
 * OptimizedTrackCard - Performance-optimized track card component
 * 
 * Sprint 025 US-025-002: List Virtualization
 * 
 * Optimizations:
 * - React.memo with custom comparison
 * - Memoized styles and callbacks
 * - Reduced re-renders during scrolling
 */

interface OptimizedTrackCardProps {
  trackId: string;
  title: string;
  imageUrl?: string;
  isPlaying?: boolean;
  onPlay: () => void;
  duration?: number;
  className?: string;
}

export const OptimizedTrackCard = memo(
  ({
    trackId,
    title,
    imageUrl,
    isPlaying,
    onPlay,
    duration,
    className,
  }: OptimizedTrackCardProps) => {
    return (
      <div
        className={cn(
          'relative group cursor-pointer rounded-lg overflow-hidden',
          'transition-transform duration-200 hover:scale-[1.02]',
          className
        )}
        onClick={onPlay}
      >
        {/* Image */}
        <div className="aspect-square bg-muted relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-4xl">♪</span>
            </div>
          )}
          
          {/* Play indicator */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white">▶</span>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="p-3 bg-card">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          {duration && (
            <p className="text-xs text-muted-foreground">
              {formatTime(duration)}
            </p>
          )}
        </div>
      </div>
    );
  },
  // Custom comparison function - only re-render if these props change
  (prevProps, nextProps) => {
    return (
      prevProps.trackId === nextProps.trackId &&
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.title === nextProps.title &&
      prevProps.imageUrl === nextProps.imageUrl
    );
  }
);

OptimizedTrackCard.displayName = 'OptimizedTrackCard';
