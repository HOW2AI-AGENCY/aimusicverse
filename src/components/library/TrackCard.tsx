import { memo } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { LazyImage } from '@/components/ui/lazy-image';

/**
 * TrackCard - Performance-optimized track card component
 * 
 * Sprint 025 US-025-002: List Virtualization
 * 
 * Optimizations:
 * - React.memo with custom comparison
 * - Memoized styles and callbacks
 * - Reduced re-renders during scrolling
 */

interface TrackCardProps {
  trackId: string;
  title: string;
  imageUrl?: string;
  isPlaying?: boolean;
  onPlay: () => void;
  duration?: number;
  className?: string;
}

export const TrackCard = memo(
  ({
    trackId,
    title,
    imageUrl,
    isPlaying,
    onPlay,
    duration,
    className,
  }: TrackCardProps) => {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${isPlaying ? 'Сейчас играет' : 'Воспроизвести'}: ${title}${duration ? `, ${formatTime(duration)}` : ''}`}
        className={cn(
          'relative group cursor-pointer rounded-lg overflow-hidden',
          'transition-transform duration-200 hover:scale-[1.02]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          className
        )}
        onClick={onPlay}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay();
          }
        }}
      >
        {/* Image */}
        <div className="aspect-square bg-muted relative">
          {imageUrl ? (
            <LazyImage
              src={imageUrl}
              alt=""
              coverSize="small"
              responsive={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-4xl" aria-hidden="true">♪</span>
            </div>
          )}
          
          {/* Play indicator */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center" aria-hidden="true">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
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

TrackCard.displayName = 'TrackCard';
