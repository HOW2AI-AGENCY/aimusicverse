import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrackDetailsSheet } from '@/components/track/TrackDetailsSheet';
import { TrackActionsMenu } from '@/components/TrackActionsMenu';
import { TrackTypeIcons } from '@/components/library/TrackTypeIcons';
import { VersionBadge } from '@/components/library/VersionBadge';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { useTrackStems } from '@/hooks/useTrackStems';

interface TrackRowProps {
  track: Track;
  isPlaying?: boolean;
  onPlay?: () => void;
  onMoreActions?: () => void;
}

export function TrackRow({ 
  track, 
  isPlaying, 
  onPlay, 
  onMoreActions 
}: TrackRowProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { data: versions = [] } = useTrackVersions(track.id);
  const { data: stems = [] } = useTrackStems(track.id);
  
  const versionCount = versions.length;
  const activeVersion = versions.find(v => v.is_primary) || versions[0];
  const versionNumber = activeVersion 
    ? versions.filter(v => new Date(v.created_at || '') <= new Date(activeVersion.created_at || '')).length 
    : 1;
  const isMaster = activeVersion?.is_primary || false;
  const stemCount = stems.length;

  return (
    <>
      <div 
        className="flex items-center gap-3 h-16 px-3 sm:px-4 hover:bg-accent/50 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-border/50"
        onClick={() => setDetailsOpen(true)}
      >
        {/* Cover Image */}
        <div className="relative flex-shrink-0">
          <img
            src={track.cover_url || '/placeholder.svg'}
            alt={track.title || 'Track'}
            className="w-12 h-12 rounded-md object-cover"
            loading="lazy"
          />
          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/40 rounded-md opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white ml-0.5" />
            )}
          </div>
        </div>
        
        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{track.title || 'Без названия'}</p>
            {/* Version Badge - only show if more than 1 version */}
            {versionCount > 1 && (
              <VersionBadge
                versionNumber={versionNumber}
                versionCount={versionCount}
                isMaster={isMaster}
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground truncate">
              {track.style || track.tags?.split(',').slice(0, 2).join(', ') || 'Без стиля'}
            </p>
            {/* Type Icons */}
            <TrackTypeIcons track={track} />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.();
            }}
            className={cn(
              "h-10 w-10 touch-manipulation rounded-full",
              isPlaying && "bg-primary text-primary-foreground"
            )}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>
          
          <div onClick={(e) => e.stopPropagation()}>
            <TrackActionsMenu track={track} />
          </div>
        </div>
      </div>

      <TrackDetailsSheet
        track={track}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
