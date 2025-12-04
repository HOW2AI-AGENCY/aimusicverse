import { Music2, Clock, Globe, Lock, Play, Pencil, Shuffle, ListPlus, Trash2 } from 'lucide-react';
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

interface PlaylistDetailSheetProps {
  playlist: Playlist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function PlaylistDetailSheet({ playlist, open, onOpenChange, onEdit }: PlaylistDetailSheetProps) {
  const { data: playlistTracks, isLoading } = usePlaylistTracks(playlist?.id ?? null);
  const { removeTrackFromPlaylist } = usePlaylists();
  const { setQueue, addTrack } = usePlaybackQueue();

  const tracks = playlistTracks?.map(pt => ({
    ...pt.track,
    likes_count: 0,
    is_liked: false,
  })).filter(Boolean) ?? [];

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    setQueue(tracks, 0);
    toast.success('Воспроизведение плейлиста');
  };

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
    toast.success('Перемешанное воспроизведение');
  };

  const handleAddAllToQueue = () => {
    if (tracks.length === 0) return;
    tracks.forEach(track => addTrack(track));
    toast.success(`Добавлено ${tracks.length} треков в очередь`);
  };

  const handlePlayTrack = (track: any, index: number) => {
    setQueue(tracks, index);
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
            {/* Cover */}
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

            {/* Info */}
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
            <Button onClick={handlePlayAll} disabled={tracks.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Воспроизвести
            </Button>
            <Button variant="outline" onClick={handleShuffle} disabled={tracks.length === 0}>
              <Shuffle className="h-4 w-4 mr-2" />
              Перемешать
            </Button>
            <Button variant="outline" onClick={handleAddAllToQueue} disabled={tracks.length === 0}>
              <ListPlus className="h-4 w-4 mr-2" />
              В очередь
            </Button>
            <Button variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </div>

          {/* Tracks */}
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
            ) : tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Music2 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Плейлист пуст</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Добавьте треки из библиотеки
                </p>
              </div>
            ) : (
              <div className="space-y-1 pb-4">
                {tracks.map((track, index) => (
                  <div key={track.id} className="group relative">
                    <TrackRow
                      track={track}
                      onPlay={() => handlePlayTrack(track, index)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveTrack(track.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
