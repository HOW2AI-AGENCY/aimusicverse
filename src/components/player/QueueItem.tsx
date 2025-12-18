import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Play, Layers, Music2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { LazyImage } from '@/components/ui/lazy-image';
import type { Track } from '@/types/track';
import { formatDuration } from '@/lib/player-utils';

interface QueueItemProps {
  track: Track;
  isCurrentTrack: boolean;
  onRemove: () => void;
}

export function QueueItem({ track, isCurrentTrack, onRemove }: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if track has multiple versions (A/B)
  const hasVersions = track.active_version_id != null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0 }}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-all',
        'border border-transparent',
        isCurrentTrack && 'bg-primary/10 border-primary/30',
        !isCurrentTrack && 'hover:bg-muted/50',
        isDragging && 'opacity-60 scale-[1.02] shadow-lg bg-card z-50'
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="touch-manipulation cursor-grab p-1 -m-0.5 rounded">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      {/* Cover */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "relative rounded-md overflow-hidden",
          isCurrentTrack && "ring-1 ring-primary ring-offset-1 ring-offset-background"
        )}>
          <LazyImage
            src={track.cover_url || '/placeholder-cover.png'}
            alt={track.title || 'Track'}
            className="w-9 h-9 object-cover"
            containerClassName="w-9 h-9"
          />
          {isCurrentTrack && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/70">
              <Play className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
          )}
          {!isCurrentTrack && !track.cover_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Music2 className="w-4 h-4 text-primary/50" />
            </div>
          )}
        </div>
        
        {hasVersions && !isCurrentTrack && (
          <div className="absolute -top-0.5 -right-0.5">
            <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center bg-primary/80 text-primary-foreground border border-background">
              <Layers className="w-2 h-2" />
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', isCurrentTrack && 'text-primary')}>
          {track.title || 'Untitled'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[10px] text-muted-foreground truncate">{track.style || 'Unknown'}</p>
          {track.duration_seconds && (
            <span className="text-[9px] text-muted-foreground/70">{formatDuration(track.duration_seconds)}</span>
          )}
        </div>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive rounded-full"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
}
