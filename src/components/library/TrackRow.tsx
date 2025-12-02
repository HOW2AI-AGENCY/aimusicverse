import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Play, Pause, MoreHorizontal, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrackDetailsSheet } from '@/components/track/TrackDetailsSheet';
import { TrackActionsMenu } from '@/components/TrackActionsMenu';

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

  return (
    <>
      <div 
        className="flex items-center gap-3 h-16 px-4 hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => setDetailsOpen(true)}
      >
        {/* Cover Image */}
        <img
          src={track.cover_url}
          alt={track.title}
          className="w-12 h-12 rounded object-cover"
          loading="lazy"
        />
        
        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {track.style || 'Unknown Style'}
          </p>
        </div>
        
        {/* Actions */}
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onPlay?.();
          }}
          className="h-11 w-11 touch-manipulation"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div onClick={(e) => e.stopPropagation()}>
          <TrackActionsMenu track={track} />
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
