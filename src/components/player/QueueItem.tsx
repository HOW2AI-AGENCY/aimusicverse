import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Play, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { LazyImage } from '@/components/ui/lazy-image';
import type { Track } from '@/hooks/useTracksOptimized';

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
  
  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
        'border border-transparent',
        isCurrentTrack && 'bg-primary/10 border-primary/30',
        !isCurrentTrack && 'hover:bg-muted/50',
        isDragging && 'opacity-60 scale-[1.02] shadow-lg bg-card z-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="touch-manipulation cursor-grab active:cursor-grabbing flex-shrink-0 p-1 -m-1 rounded-md hover:bg-muted/50 transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Cover Image with playing indicator */}
      <div className="relative flex-shrink-0">
        <LazyImage
          src={track.cover_url || '/placeholder-cover.png'}
          alt={track.title || 'Track'}
          className={cn(
            "w-11 h-11 rounded-lg object-cover transition-all duration-300",
            isCurrentTrack && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          containerClassName="w-11 h-11 rounded-lg"
        />
        {isCurrentTrack && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-primary/80 rounded-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Play className="w-4 h-4 text-primary-foreground fill-current" />
            </motion.div>
          </motion.div>
        )}
        
        {/* Version indicator badge */}
        {hasVersions && !isCurrentTrack && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center bg-primary/80 text-primary-foreground">
              <Layers className="w-2.5 h-2.5" />
            </Badge>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate transition-colors',
          isCurrentTrack ? 'text-primary' : 'text-foreground'
        )}>
          {track.title || 'Untitled Track'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {track.style || 'Unknown Style'}
          </p>
          {track.duration_seconds && (
            <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
              {formatDuration(track.duration_seconds)}
            </span>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-9 w-9 touch-manipulation flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Remove from queue"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
