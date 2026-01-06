import { memo } from 'react';
import { cn } from '@/lib/utils';

interface DurationBadgeProps {
  seconds: number | null | undefined;
  className?: string;
  /** Position: 'cover' = absolute bottom-right, 'inline' = normal inline badge */
  position?: 'cover' | 'inline';
}

/**
 * DurationBadge - Reusable duration display component
 * 
 * Used in:
 * - UnifiedTrackCard
 * - TrackCover
 * - TrackCard (legacy)
 * - Player components
 */
export const DurationBadge = memo(function DurationBadge({ 
  seconds, 
  className,
  position = 'cover'
}: DurationBadgeProps) {
  if (!seconds) return null;
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formatted = `${minutes}:${String(secs).padStart(2, '0')}`;
  
  if (position === 'cover') {
    return (
      <div 
        className={cn(
          "absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded font-medium z-10",
          className
        )}
      >
        {formatted}
      </div>
    );
  }
  
  return (
    <span className={cn("text-xs text-muted-foreground", className)}>
      {formatted}
    </span>
  );
});
