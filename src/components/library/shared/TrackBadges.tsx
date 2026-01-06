import { memo } from 'react';
import { Layers, ListMusic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InlineVersionToggle } from '../InlineVersionToggle';

interface TrackBadgesProps {
  trackId: string;
  trackOwnerId?: string;
  versionCount?: number;
  activeVersionId?: string | null;
  stemCount?: number;
  /** Queue position (1-indexed) */
  queuePosition?: number | null;
  isNextTrack?: boolean;
  className?: string;
  /** Compact mode for smaller badges */
  compact?: boolean;
}

/**
 * TrackBadges - Unified badges display for versions, stems, queue position
 * 
 * Used in:
 * - TrackCard (grid overlay)
 * - PublicTrackCard
 * - TrackSheetHeader
 */
export const TrackBadges = memo(function TrackBadges({
  trackId,
  trackOwnerId,
  versionCount = 0,
  activeVersionId,
  stemCount = 0,
  queuePosition,
  isNextTrack = false,
  className,
  compact = false,
}: TrackBadgesProps) {
  const hasContent = versionCount > 1 || stemCount > 0 || queuePosition;
  
  if (!hasContent) return null;
  
  return (
    <div className={cn("flex gap-1", className)}>
      {/* Queue Position Badge */}
      {queuePosition && (
        <Badge 
          variant={isNextTrack ? "default" : "glass"} 
          size="sm"
          className={cn(
            "gap-0.5",
            isNextTrack && "bg-primary text-primary-foreground"
          )}
        >
          <ListMusic className="w-3 h-3" />
          {queuePosition}
        </Badge>
      )}
      
      {/* Version Toggle */}
      {versionCount > 1 && (
        <InlineVersionToggle
          trackId={trackId}
          activeVersionId={activeVersionId}
          versionCount={versionCount}
          trackOwnerId={trackOwnerId}
          compact={compact}
        />
      )}
      
      {/* Stems Badge */}
      {stemCount > 0 && (
        <Badge variant="secondary" size="sm" className="gap-1">
          <Layers className="w-3 h-3" />
          {stemCount}
        </Badge>
      )}
    </div>
  );
});
