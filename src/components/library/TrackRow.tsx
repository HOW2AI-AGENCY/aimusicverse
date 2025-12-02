import { Track } from '@/hooks/useTracksOptimized';
import { Play, Pause, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  return (
    <div className="flex items-center gap-3 h-16 px-4 hover:bg-accent/50 transition-colors">
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
        onClick={onPlay}
        className="h-11 w-11 touch-manipulation"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <Button
        size="icon"
        variant="ghost"
        onClick={onMoreActions}
        className="h-11 w-11 touch-manipulation"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
