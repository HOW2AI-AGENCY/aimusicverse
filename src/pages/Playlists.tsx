import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlaylists } from '@/hooks/usePlaylists';
import { PlaylistCard } from '@/components/playlist/PlaylistCard';
import { CreatePlaylistDialog } from '@/components/playlist/CreatePlaylistDialog';
import { EditPlaylistDialog } from '@/components/playlist/EditPlaylistDialog';
import { SharePlaylistDialog } from '@/components/playlist/SharePlaylistDialog';
import type { Playlist } from '@/hooks/usePlaylists';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { UnifiedEmptyState } from '@/components/ui/unified-empty-state';

export default function Playlists() {
  // Telegram BackButton
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  const [searchParams] = useSearchParams();
  const { playlists, isLoading, deletePlaylist } = usePlaylists();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [sharingPlaylist, setSharingPlaylist] = useState<Playlist | null>(null);

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
      <div 
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 pb-3"
        style={{ paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}
      >
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
          <UnifiedEmptyState
            type="playlists"
            action={{
              label: 'Создать плейлист',
              onClick: () => setCreateDialogOpen(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                formatDuration={formatDuration}
                onOpen={() => setEditingPlaylist(playlist)}
                onEdit={() => setEditingPlaylist(playlist)}
                onDelete={() => handleDelete(playlist)}
                onShare={() => setSharingPlaylist(playlist)}
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
        onOpenChange={(open: boolean) => !open && setEditingPlaylist(null)}
      />

      <SharePlaylistDialog
        playlist={sharingPlaylist}
        open={!!sharingPlaylist}
        onOpenChange={(open: boolean) => !open && setSharingPlaylist(null)}
      />
    </div>
  );
}
