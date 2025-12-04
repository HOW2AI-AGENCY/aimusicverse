import { useState } from 'react';
import { Plus, Music2, Clock, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlaylists } from '@/hooks/usePlaylists';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { CreatePlaylistDialog } from '@/components/playlist/CreatePlaylistDialog';
import { EditPlaylistDialog } from '@/components/playlist/EditPlaylistDialog';
import { PlaylistDetailSheet } from '@/components/playlist/PlaylistDetailSheet';
import type { Playlist } from '@/hooks/usePlaylists';

export default function Playlists() {
  const { playlists, isLoading, deletePlaylist } = usePlaylists();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const handleDelete = async (playlist: Playlist) => {
    if (confirm(`Удалить плейлист "${playlist.title}"?`)) {
      await deletePlaylist(playlist.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Плейлисты</h1>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Создать
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-md mb-3" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Music2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Нет плейлистов</h2>
            <p className="text-muted-foreground mb-4">
              Создайте свой первый плейлист
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать плейлист
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                formatDuration={formatDuration}
                onOpen={() => setSelectedPlaylist(playlist)}
                onEdit={() => setEditingPlaylist(playlist)}
                onDelete={() => handleDelete(playlist)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreatePlaylistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditPlaylistDialog
        playlist={editingPlaylist}
        open={!!editingPlaylist}
        onOpenChange={(open) => !open && setEditingPlaylist(null)}
      />

      <PlaylistDetailSheet
        playlist={selectedPlaylist}
        open={!!selectedPlaylist}
        onOpenChange={(open) => !open && setSelectedPlaylist(null)}
        onEdit={() => {
          if (selectedPlaylist) {
            setEditingPlaylist(selectedPlaylist);
          }
        }}
      />
    </div>
  );
}
