import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Play, Layers, Music2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { LazyImage } from '@/components/ui/lazy-image';
import type { Track } from '@/hooks/useTracksOptimized';
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      whileHover={{ scale: isCurrentTrack ? 1 : 1.01 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 relative overflow-hidden',
        'border border-transparent',
        isCurrentTrack && 'bg-gradient-to-r from-primary/15 to-primary/5 border-primary/30 shadow-md',
        !isCurrentTrack && 'hover:bg-muted/50',
        isDragging && 'opacity-60 scale-[1.02] shadow-xl bg-card z-50'
      )}
    >
      {/* Current track glow effect */}
      {isCurrentTrack && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent -z-10"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="touch-manipulation cursor-grab active:cursor-grabbing flex-shrink-0 p-1.5 -m-1 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Cover Image with playing indicator */}
      <div className="relative flex-shrink-0">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={cn(
            "relative rounded-lg overflow-hidden shadow-md",
            isCurrentTrack && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <LazyImage
            src={track.cover_url || '/placeholder-cover.png'}
            alt={track.title || 'Track'}
            className="w-12 h-12 object-cover"
            containerClassName="w-12 h-12"
          />
          {isCurrentTrack && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-primary/80"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Play className="w-5 h-5 text-primary-foreground fill-current" />
              </motion.div>
            </motion.div>
          )}
          {!isCurrentTrack && !track.cover_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Music2 className="w-5 h-5 text-primary/50" />
            </div>
          )}
        </motion.div>
        
        {/* Version indicator badge */}
        {hasVersions && !isCurrentTrack && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center bg-primary/80 text-primary-foreground shadow-md border-2 border-background">
              <Layers className="w-2.5 h-2.5" />
            </Badge>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            'text-sm font-medium truncate transition-colors',
            isCurrentTrack ? 'text-primary' : 'text-foreground'
          )}>
            {track.title || 'Untitled Track'}
          </p>
          {isCurrentTrack && (
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {track.style || 'Unknown Style'}
          </p>
          {track.duration_seconds && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-muted-foreground/20">
              {formatDuration(track.duration_seconds)}
            </Badge>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 touch-manipulation flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-full"
          aria-label="Remove from queue"
        >
          <X className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
