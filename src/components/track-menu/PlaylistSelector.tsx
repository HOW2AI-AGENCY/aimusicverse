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
import { hapticImpact, hapticNotification } from '@/lib/haptic';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  track_count?: number;
  cover_url?: string;
}

interface PlaylistSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function PlaylistSelector({ open, onOpenChange, track }: PlaylistSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with actual playlists hook when implemented
  // Example: const { data: playlists, isLoading: playlistsLoading } = usePlaylists();
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
      hapticImpact('light');

      // TODO: Implement actual add to playlist API call
      // await addTrackToPlaylist({
      //   playlistId: selectedPlaylistId,
      //   trackId: track.id,
      // });

      const playlist = playlists.find(p => p.id === selectedPlaylistId);
      hapticNotification('success');
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

  const handleCreatePlaylist = () => {
    // TODO: Open create playlist dialog
    toast.info('Create playlist feature coming soon');
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        setSelectedPlaylistId(null);
        setSearchQuery('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-primary" />
            Add to Playlist
          </DialogTitle>
          <DialogDescription>
            Select a playlist to add "{track.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
          <ScrollArea className="h-[300px] pr-4">
            {playlistsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ListMusic className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No playlists found' : 'No playlists yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a playlist to organize your favorite tracks
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                      'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary',
                      selectedPlaylistId === playlist.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      'h-12 w-12 rounded-md flex items-center justify-center flex-shrink-0',
                      selectedPlaylistId === playlist.id 
                        ? 'bg-primary text-primary-foreground' 
                        : playlist.cover_url 
                          ? 'bg-transparent' 
                          : 'bg-muted'
                    )}>
                      {playlist.cover_url ? (
                        <img 
                          src={playlist.cover_url} 
                          alt={playlist.name}
                          className="h-full w-full object-cover rounded-md"
                        />
                      ) : selectedPlaylistId === playlist.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <ListMusic className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">{playlist.name}</p>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {playlist.description}
                        </p>
                      )}
                      {playlist.track_count !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {playlist.track_count} track{playlist.track_count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Create New Playlist Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleCreatePlaylist}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            Create New Playlist
          </Button>
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
            onClick={handleAddToPlaylist}
            disabled={loading || !selectedPlaylistId}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to Playlist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
