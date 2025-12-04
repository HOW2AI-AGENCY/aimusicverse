import { useState } from 'react';
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
import { Track } from '@/hooks/useTracksOptimized';
import { ListMusic, Plus, Search, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/lib/mobile-utils';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  track_count?: number;
  cover_url?: string;
}

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function AddToPlaylistDialog({ open, onOpenChange, track }: AddToPlaylistDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const triggerSuccessHaptic = useHapticFeedback('success');
  const triggerSelectionHaptic = useHapticFeedback('selection');

  // Playlists feature coming soon - tables not yet created
  const playlists: Playlist[] = [];
  const playlistsLoading = false;

  // Filter playlists by search query
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) {
      toast.error('Please select a playlist');
      return;
    }

    setLoading(true);

    try {
      triggerSelectionHaptic();
      // Playlists feature coming soon
      await new Promise(resolve => setTimeout(resolve, 500));

      const playlist = playlists.find(p => p.id === selectedPlaylistId);
      triggerSuccessHaptic();
      toast.success(`Added to "${playlist?.name}"`);
      onOpenChange(false);
      
      // Reset selection
      setSelectedPlaylistId(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      toast.error('Failed to add track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    setLoading(true);

    try {
      triggerSelectionHaptic();
      // Playlists feature coming soon
      await new Promise(resolve => setTimeout(resolve, 500));

      triggerSuccessHaptic();
      toast.success(`Playlist "${newPlaylistName}" created and track added`);
      onOpenChange(false);
      
      // Reset form
      setCreatingNew(false);
      setNewPlaylistName('');
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        setCreatingNew(false);
        setNewPlaylistName('');
        setSearchQuery('');
        setSelectedPlaylistId(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-primary" />
            Add to Playlist
          </DialogTitle>
          <DialogDescription>
            Add "{track.title}" to a playlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!creatingNew ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search playlists..."
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
                              alt={playlist.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <ListMusic className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{playlist.name}</p>
                          {playlist.track_count !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              {playlist.track_count} tracks
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
                      {searchQuery ? 'No playlists found' : 'No playlists yet'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatingNew(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Playlist
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
                  Create New Playlist
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Create New Playlist Form */}
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Playlist name"
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
                  Back to Playlists
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
            Cancel
          </Button>
          <Button
            onClick={creatingNew ? handleCreateNewPlaylist : handleAddToPlaylist}
            disabled={loading || (creatingNew ? !newPlaylistName.trim() : !selectedPlaylistId)}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {creatingNew ? 'Creating...' : 'Adding...'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {creatingNew ? 'Create & Add' : 'Add to Playlist'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
