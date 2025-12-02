import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors',
        isCurrentTrack && 'bg-accent',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="touch-manipulation cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Cover Image */}
      <img
        src={track.cover_url || '/placeholder-cover.png'}
        alt={track.title || 'Track'}
        className="w-10 h-10 rounded object-cover flex-shrink-0"
      />

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isCurrentTrack && 'text-primary'
        )}>
          {track.title || 'Untitled Track'}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {track.style || 'Unknown Style'}
        </p>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-9 w-9 touch-manipulation flex-shrink-0"
        aria-label="Remove from queue"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
