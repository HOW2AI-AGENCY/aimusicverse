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
  sm: { button: 'w-5 h-5', icon: 'w-2 h-2' },
  md: { button: 'w-7 h-7', icon: 'w-3 h-3' },
  lg: { button: 'w-9 h-9', icon: 'w-4 h-4' },
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
        "absolute inset-0 flex items-center justify-center cursor-pointer transition-all",
        !isMobile && !isPlaying && "opacity-0 group-hover:opacity-100 bg-black/30",
        isMobile && !isPlaying && "opacity-0",
        isPlaying && "opacity-100 bg-black/40",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn(
        config.button,
        "rounded-full flex items-center justify-center transition-transform backdrop-blur-sm",
        isPlaying ? "bg-primary/90 scale-100" : "bg-white/80 scale-90 group-hover:scale-100"
      )}>
        {isPlaying ? (
          <Pause className={cn(config.icon, "text-white")} aria-hidden="true" />
        ) : (
          <Play className={cn(config.icon, "ml-0.5 text-black/70")} aria-hidden="true" />
        )}
      </div>
    </div>
  );
});
