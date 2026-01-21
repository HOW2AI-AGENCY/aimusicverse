import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Track } from '@/types/track';
import { ListMusic, Plus, Search, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/lib/mobile-utils';
import { logger } from '@/lib/logger';
import { usePlaylists } from '@/hooks/usePlaylists';

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function AddToPlaylistDialog({ open, onOpenChange, track }: AddToPlaylistDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const triggerSuccessHaptic = useHapticFeedback('success');
  const triggerSelectionHaptic = useHapticFeedback('selection');

  // Real playlists data from Supabase
  const { 
    playlists, 
    isLoading: playlistsLoading, 
    createPlaylist, 
    addTrackToPlaylist,
    isCreating,
    isAdding,
  } = usePlaylists();

  const loading = isCreating || isAdding;

  // Filter playlists by search query
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToPlaylist = useCallback(async () => {
    if (!selectedPlaylistId) {
      toast.error('Выберите плейлист');
      return;
    }

    try {
      triggerSelectionHaptic();
      
      await addTrackToPlaylist({ 
        playlistId: selectedPlaylistId, 
        trackId: track.id 
      });

      const playlist = playlists.find(p => p.id === selectedPlaylistId);
      triggerSuccessHaptic();
      // Toast is already shown by the hook
      onOpenChange(false);
      
      // Reset selection
      setSelectedPlaylistId(null);
      setSearchQuery('');
    } catch (error) {
      logger.error('Failed to add track to playlist', error);
      // Error toast is already shown by the hook
    }
  }, [selectedPlaylistId, track.id, playlists, addTrackToPlaylist, triggerSelectionHaptic, triggerSuccessHaptic, onOpenChange]);

  const handleCreateNewPlaylist = useCallback(async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Введите название плейлиста');
      return;
    }

    try {
      triggerSelectionHaptic();
      
      // Create playlist and add track in one flow
      const newPlaylist = await createPlaylist({
        title: newPlaylistName.trim(),
        is_public: false,
      });
      
      // Add track to the newly created playlist
      await addTrackToPlaylist({
        playlistId: newPlaylist.id,
        trackId: track.id,
      });

      triggerSuccessHaptic();
      toast.success(`Плейлист "${newPlaylistName}" создан и трек добавлен`);
      onOpenChange(false);
      
      // Reset form
      setCreatingNew(false);
      setNewPlaylistName('');
      setSearchQuery('');
    } catch (error) {
      logger.error('Failed to create playlist', error);
      // Error toast is already shown by the hook
    }
  }, [newPlaylistName, track.id, createPlaylist, addTrackToPlaylist, triggerSelectionHaptic, triggerSuccessHaptic, onOpenChange]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        setCreatingNew(false);
        setNewPlaylistName('');
        setSearchQuery('');
        setSelectedPlaylistId(null);
      }
    }
  }, [loading, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-primary" />
            Добавить в плейлист
          </DialogTitle>
          <DialogDescription>
            Добавить «{track.title}» в плейлист
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!creatingNew ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск плейлистов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={loading}
                />
              </div>

              {/* Playlists List */}
              <ScrollArea className="h-[300px] rounded-md border">
                {playlistsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPlaylists.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredPlaylists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => {
                          setSelectedPlaylistId(playlist.id);
                          triggerSelectionHaptic();
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
                          'hover:bg-accent min-h-[44px]',
                          selectedPlaylistId === playlist.id && 'bg-accent'
                        )}
                        disabled={loading}
                      >
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                          {playlist.cover_url ? (
                            <img 
                              src={playlist.cover_url} 
                              alt={playlist.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <ListMusic className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{playlist.title}</p>
                          {playlist.track_count !== undefined && playlist.track_count !== null && (
                            <p className="text-xs text-muted-foreground">
                              {playlist.track_count} {playlist.track_count === 1 ? 'трек' : 
                                playlist.track_count < 5 ? 'трека' : 'треков'}
                            </p>
                          )}
                        </div>
                        {selectedPlaylistId === playlist.id && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {searchQuery ? 'Плейлисты не найдены' : 'У вас пока нет плейлистов'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatingNew(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Создать плейлист
                    </Button>
                  </div>
                )}
              </ScrollArea>

              {/* Create New Playlist Button */}
              {filteredPlaylists.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCreatingNew(true)}
                  className="w-full gap-2 h-11"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  Создать новый плейлист
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Create New Playlist Form */}
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Название плейлиста"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    disabled={loading}
                    autoFocus
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCreatingNew(false)}
                  className="w-full"
                  disabled={loading}
                >
                  Назад к плейлистам
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={creatingNew ? handleCreateNewPlaylist : handleAddToPlaylist}
            disabled={loading || (creatingNew ? !newPlaylistName.trim() : !selectedPlaylistId)}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {creatingNew ? 'Создание...' : 'Добавление...'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {creatingNew ? 'Создать и добавить' : 'Добавить'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
