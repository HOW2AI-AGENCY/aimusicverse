import { Music2, Clock, Globe, Lock, Play, Pencil, Shuffle, ListPlus, Trash2, GripVertical } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlaylistTracks, usePlaylists, type Playlist } from '@/hooks/usePlaylists';
import { usePlaybackQueue } from '@/hooks/usePlaybackQueue';
import { TrackRow } from '@/components/library/TrackRow';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';

interface PlaylistDetailSheetProps {
  playlist: Playlist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

interface SortableTrackItemProps {
  track: any;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
}

function SortableTrackItem({ track, index, onPlay, onRemove }: SortableTrackItemProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <TrackRow track={track} onPlay={onPlay} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function PlaylistDetailSheet({ playlist, open, onOpenChange, onEdit }: PlaylistDetailSheetProps) {
  const { data: playlistTracks, isLoading } = usePlaylistTracks(playlist?.id ?? null);
  const { removeTrackFromPlaylist, reorderPlaylistTracks } = usePlaylists();
  const { setQueue, addTrack } = usePlaybackQueue();
  const [orderedTracks, setOrderedTracks] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (playlistTracks) {
      setOrderedTracks(
        playlistTracks.map(pt => ({
          ...pt.track,
          likes_count: 0,
          is_liked: false,
          _playlistTrackId: pt.id,
          _position: pt.position,
        })).filter(Boolean)
      );
    }
  }, [playlistTracks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !playlist) return;

    const oldIndex = orderedTracks.findIndex(t => t.id === active.id);
    const newIndex = orderedTracks.findIndex(t => t.id === over.id);

    const newOrder = arrayMove(orderedTracks, oldIndex, newIndex);
    setOrderedTracks(newOrder);

    // Update positions in database
    try {
      await reorderPlaylistTracks({
        playlistId: playlist.id,
        trackIds: newOrder.map(t => t.id),
      });
    } catch (error) {
      // Revert on error
      setOrderedTracks(orderedTracks);
      toast.error('Ошибка изменения порядка');
    }
  };

  const handlePlayAll = () => {
    if (orderedTracks.length === 0) return;
    setQueue(orderedTracks, 0);
    toast.success('Воспроизведение плейлиста');
  };

  const handleShuffle = () => {
    if (orderedTracks.length === 0) return;
    const shuffled = [...orderedTracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
    toast.success('Перемешанное воспроизведение');
  };

  const handleAddAllToQueue = () => {
    if (orderedTracks.length === 0) return;
    orderedTracks.forEach(track => addTrack(track));
    toast.success(`Добавлено ${orderedTracks.length} треков в очередь`);
  };

  const handlePlayTrack = (track: any, index: number) => {
    setQueue(orderedTracks, index);
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    await removeTrackFromPlaylist({ playlistId: playlist.id, trackId });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  if (!playlist) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{playlist.title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex gap-4 pb-4 border-b border-border">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
              {playlist.cover_url ? (
                <img
                  src={playlist.cover_url}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <Music2 className="h-10 w-10 text-primary/40" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold truncate">{playlist.title}</h2>
                {playlist.is_public ? (
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span>{playlist.track_count} треков</span>
                {playlist.total_duration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(playlist.total_duration)}
                  </span>
                )}
              </div>

              {playlist.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {playlist.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 py-3 overflow-x-auto">
            <Button onClick={handlePlayAll} disabled={orderedTracks.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Воспроизвести
            </Button>
            <Button variant="outline" onClick={handleShuffle} disabled={orderedTracks.length === 0}>
              <Shuffle className="h-4 w-4 mr-2" />
              Перемешать
            </Button>
            <Button variant="outline" onClick={handleAddAllToQueue} disabled={orderedTracks.length === 0}>
              <ListPlus className="h-4 w-4 mr-2" />
              В очередь
            </Button>
            <Button variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </div>

          {/* Tracks with Drag & Drop */}
          <ScrollArea className="flex-1 -mx-4 px-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orderedTracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Music2 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Плейлист пуст</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Добавьте треки из библиотеки
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedTracks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1 pb-4">
                    {orderedTracks.map((track, index) => (
                      <SortableTrackItem
                        key={track.id}
                        track={track}
                        index={index}
                        onPlay={() => handlePlayTrack(track, index)}
                        onRemove={() => handleRemoveTrack(track.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
