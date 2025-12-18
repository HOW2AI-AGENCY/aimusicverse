/**
 * Queue Panel Component
 *
 * Visual interface for playback queue management.
 * Features drag-to-reorder, track removal, and queue controls.
 *
 * @module QueuePanel
 */

import { useMemo } from 'react';
import { GripVertical, X, Play, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlayerStore } from '@/hooks/audio';
import { cn } from '@/lib/utils';
import { motion, Reorder } from '@/lib/motion';
import { Track } from '@/types/track';

interface QueuePanelProps {
  className?: string;
}

export function QueuePanel({ className }: QueuePanelProps) {
  const {
    queue,
    currentIndex,
    activeTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
    reorderQueue
  } = usePlayerStore();

  // Split queue into current, upcoming, and previous
  const { currentTrack, upcomingTracks, previousTracks } = useMemo(() => {
    return {
      currentTrack: queue[currentIndex] || null,
      upcomingTracks: queue.slice(currentIndex + 1),
      previousTracks: queue.slice(0, currentIndex)
    };
  }, [queue, currentIndex]);

  const handleReorder = (newOrder: Track[]) => {
    // Find which item moved and calculate new index
    const oldQueue = [...upcomingTracks];

    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].id !== oldQueue[i]?.id) {
        const track = newOrder[i];
        const oldIndex = oldQueue.findIndex(t => t.id === track.id);
        const newIndex = i;

        // Convert to absolute queue indices (skip previous + current)
        const absoluteOldIndex = currentIndex + 1 + oldIndex;
        const absoluteNewIndex = currentIndex + 1 + newIndex;

        reorderQueue(absoluteOldIndex, absoluteNewIndex);
        break;
      }
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (queue.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-8 text-center', className)}>
        <Music className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Очередь пуста</h3>
        <p className="text-sm text-muted-foreground">
          Добавьте треки в очередь для создания плейлиста
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Очередь воспроизведения</h3>
          <p className="text-sm text-muted-foreground">
            {queue.length} {queue.length === 1 ? 'трек' : 'треков'}
          </p>
        </div>
        {queue.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearQueue}
            className="text-muted-foreground hover:text-foreground"
          >
            Очистить
          </Button>
        )}
      </div>

      {/* Queue List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Previous tracks (greyed out) */}
          {previousTracks.length > 0 && (
            <div className="pb-2">
              <div className="text-xs text-muted-foreground px-2 py-1 mb-1">Прослушано</div>
              {previousTracks.map((track, index) => (
                <QueueTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  isPrevious
                  onPlay={() => playTrack(track)}
                  onRemove={() => removeFromQueue(index)}
                />
              ))}
            </div>
          )}

          {/* Current track */}
          {currentTrack && (
            <div className="py-1">
              <div className="text-xs text-primary px-2 py-1 mb-1 font-medium">Сейчас играет</div>
              <QueueTrackItem
                track={currentTrack}
                index={currentIndex}
                isCurrent
                onPlay={() => playTrack(currentTrack)}
                onRemove={() => removeFromQueue(currentIndex)}
              />
            </div>
          )}

          {/* Upcoming tracks (draggable) */}
          {upcomingTracks.length > 0 && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground px-2 py-1 mb-1">Следующие</div>
              <Reorder.Group
                axis="y"
                values={upcomingTracks}
                onReorder={handleReorder}
                className="space-y-1"
              >
                {upcomingTracks.map((track, index) => (
                  <Reorder.Item
                    key={track.id}
                    value={track}
                    drag
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <QueueTrackItem
                      track={track}
                      index={currentIndex + 1 + index}
                      isDraggable
                      onPlay={() => playTrack(track)}
                      onRemove={() => removeFromQueue(currentIndex + 1 + index)}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface QueueTrackItemProps {
  track: Track;
  index: number;
  isCurrent?: boolean;
  isPrevious?: boolean;
  isDraggable?: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

function QueueTrackItem({
  track,
  index,
  isCurrent,
  isPrevious,
  isDraggable,
  onPlay,
  onRemove
}: QueueTrackItemProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg transition-colors',
        isCurrent && 'bg-primary/10 border-l-2 border-primary',
        isPrevious && 'opacity-50',
        !isCurrent && !isPrevious && 'hover:bg-muted/50'
      )}
    >
      {/* Drag handle or play button */}
      <div className="flex-shrink-0">
        {isDraggable ? (
          <div className="cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlay}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Cover */}
      <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-muted">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title || 'Track cover'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Music className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isCurrent && 'text-primary'
        )}>
          {track.title || 'Без названия'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDuration(track.duration_seconds ?? undefined)}</span>
          {track.artist_name && (
            <>
              <span>•</span>
              <span className="truncate">{track.artist_name}</span>
            </>
          )}
        </div>
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
