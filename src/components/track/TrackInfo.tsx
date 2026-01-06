/**
 * TrackInfo - Unified track info display (title, style, creator)
 * 
 * Variants:
 * - compact: title only
 * - default: title + style
 * - full: title + style + creator
 */

import { memo } from 'react';
import { Volume2, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreatorAvatar, CreatorLink } from '@/components/ui/creator-avatar';
import type { Track } from '@/types/track';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

interface TrackInfoProps {
  track: Track | PublicTrackWithCreator;
  variant?: 'compact' | 'default' | 'full';
  showIcons?: boolean;
  stemCount?: number;
  isHovered?: boolean;
  className?: string;
}

export const TrackInfo = memo(function TrackInfo({
  track,
  variant = 'default',
  showIcons = true,
  stemCount = 0,
  isHovered = false,
  className,
}: TrackInfoProps) {
  const publicTrack = track as PublicTrackWithCreator;
  const hasCreator = 'creator_name' in track || 'creator_username' in track;

  const titleClass = cn(
    'font-medium truncate transition-colors',
    variant === 'compact' ? 'text-xs' : 'text-sm',
    isHovered && 'text-primary'
  );

  const styleClass = cn(
    'text-muted-foreground truncate',
    variant === 'compact' ? 'text-[10px]' : 'text-xs'
  );

  return (
    <div className={cn('min-w-0', className)}>
      {/* Title row with icons */}
      <div className="flex items-center gap-1.5">
        <h3 className={titleClass}>
          {track.title || 'Без названия'}
        </h3>
        
        {showIcons && (
          <>
            {track.is_instrumental && (
              <Volume2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            {stemCount > 0 && (
              <Layers className="w-3 h-3 text-primary flex-shrink-0" />
            )}
          </>
        )}
      </div>

      {/* Style/Tags */}
      {variant !== 'compact' && (
        <p className={styleClass}>
          {track.style || track.tags?.split(',')[0] || '--'}
        </p>
      )}

      {/* Creator info for full variant */}
      {variant === 'full' && hasCreator && (publicTrack.creator_name || publicTrack.creator_username) && (
        <div className="flex items-center gap-1.5 mt-1">
          <CreatorAvatar
            userId={publicTrack.user_id}
            photoUrl={publicTrack.creator_photo_url}
            name={publicTrack.creator_name}
            username={publicTrack.creator_username}
            size="xs"
          />
          <CreatorLink
            userId={publicTrack.user_id}
            name={publicTrack.creator_name}
            username={publicTrack.creator_username}
            className="text-[10px] text-muted-foreground truncate max-w-[80px]"
          />
        </div>
      )}
    </div>
  );
});
