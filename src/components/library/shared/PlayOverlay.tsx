import { memo } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/mobile-utils';

interface PlayOverlayProps {
  isPlaying?: boolean;
  isMobile?: boolean;
  onPlay: () => void;
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CONFIG = {
  sm: { button: 'w-6 h-6', icon: 'w-2.5 h-2.5' },
  md: { button: 'w-8 h-8', icon: 'w-3.5 h-3.5' },
  lg: { button: 'w-12 h-12', icon: 'w-5 h-5' },
};

/**
 * PlayOverlay - Reusable play/pause overlay for track covers
 * 
 * Used in:
 * - TrackCover (new unified component)
 * - UnifiedTrackCard
 * - TrackCard (legacy)
 */
export const PlayOverlay = memo(function PlayOverlay({ 
  isPlaying, 
  isMobile = false,
  onPlay,
  className,
  size = 'md'
}: PlayOverlayProps) {
  const config = SIZE_CONFIG[size];
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('medium');
    onPlay();
  };
  
  return (
    <div
      className={cn(
        "absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-all",
        !isMobile && !isPlaying && "opacity-0 group-hover:opacity-100",
        isMobile && !isPlaying && "bg-black/20",
        isPlaying && "opacity-100 bg-black/50",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn(
        config.button,
        "rounded-full flex items-center justify-center transition-transform",
        isPlaying ? "bg-primary scale-100" : "bg-white/90 scale-90 group-hover:scale-100"
      )}>
        {isPlaying ? (
          <Pause className={cn(config.icon, "text-white")} aria-hidden="true" />
        ) : (
          <Play className={cn(config.icon, "ml-0.5 text-black/80")} aria-hidden="true" />
        )}
      </div>
    </div>
  );
});
