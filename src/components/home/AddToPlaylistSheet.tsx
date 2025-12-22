import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Music2, ListMusic, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';

interface AddToPlaylistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle?: string;
}

export function AddToPlaylistSheet({ open, onOpenChange, trackId, trackTitle }: AddToPlaylistSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch user playlists
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['user-playlists-for-add', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('playlists')
        .select('id, title, track_count, cover_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Check which playlists already contain this track
  const { data: trackInPlaylists } = useQuery({
    queryKey: ['track-in-playlists', trackId, user?.id],
    queryFn: async () => {
      if (!user?.id || !trackId) return [];
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select('playlist_id')
        .eq('track_id', trackId);
      if (error) throw error;
      return data?.map(pt => pt.playlist_id) || [];
    },
    enabled: !!user?.id && !!trackId && open,
  });

  // Add to playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const isInPlaylist = trackInPlaylists?.includes(playlistId);
      
      if (isInPlaylist) {
        // Remove from playlist
        const { error } = await supabase
          .from('playlist_tracks')
          .delete()
          .eq('playlist_id', playlistId)
          .eq('track_id', trackId);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Get max position
        const { data: maxPos } = await supabase
          .from('playlist_tracks')
          .select('position')
          .eq('playlist_id', playlistId)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nextPosition = (maxPos?.position || 0) + 1;
        
        const { error } = await supabase
          .from('playlist_tracks')
          .insert({ playlist_id: playlistId, track_id: trackId, position: nextPosition });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['track-in-playlists', trackId] });
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks'] });
      toast.success(result.action === 'added' ? 'Добавлено в плейлист' : 'Удалено из плейлиста');
    },
    onError: () => {
      toast.error('Не удалось обновить плейлист');
    },
  });

  // Create new playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .insert({ user_id: user.id, title })
        .select('id')
        .single();
      
      if (playlistError) throw playlistError;
      
      // Add track to new playlist
      const { error: trackError } = await supabase
        .from('playlist_tracks')
        .insert({ playlist_id: playlist.id, track_id: trackId, position: 1 });
      
      if (trackError) throw trackError;
      
      return playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-playlists'] });
      queryClient.invalidateQueries({ queryKey: ['track-in-playlists', trackId] });
      toast.success('Плейлист создан и трек добавлен');
      setNewPlaylistName('');
      setIsCreating(false);
    },
    onError: () => {
      toast.error('Не удалось создать плейлист');
    },
  });

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylistMutation.mutate(newPlaylistName.trim());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            Добавить в плейлист
          </SheetTitle>
          {trackTitle && (
            <p className="text-sm text-muted-foreground truncate">
              {trackTitle}
            </p>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6" style={{ height: 'calc(100% - 120px)' }}>
          {/* Create new playlist */}
          {isCreating ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-xl bg-muted/50 border border-border/50"
            >
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Название плейлиста"
                className="mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                  className="flex-1"
                >
                  {createPlaylistMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Создать'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Отмена
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setIsCreating(true)}
              className={cn(
                "w-full mb-4 p-3 rounded-xl border-2 border-dashed border-primary/30",
                "flex items-center gap-3 text-left hover:border-primary/50 hover:bg-primary/5",
                "transition-all duration-200"
              )}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Создать плейлист</p>
                <p className="text-xs text-muted-foreground">Новый плейлист с этим треком</p>
              </div>
            </motion.button>
          )}

          {/* Existing playlists */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="space-y-2">
              {playlists.map((playlist, index) => {
                const isInPlaylist = trackInPlaylists?.includes(playlist.id);
                return (
                  <motion.button
                    key={playlist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => addToPlaylistMutation.mutate(playlist.id)}
                    disabled={addToPlaylistMutation.isPending}
                    className={cn(
                      "w-full p-3 rounded-xl flex items-center gap-3 text-left",
                      "border transition-all duration-200",
                      isInPlaylist
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card/50 border-border/50 hover:border-primary/30"
                    )}
                  >
                    {/* Playlist cover */}
                    <div className="w-12 h-12 rounded-lg bg-muted/50 overflow-hidden flex items-center justify-center">
                      {playlist.cover_url ? (
                        <img src={playlist.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music2 className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{playlist.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {playlist.track_count || 0} треков
                      </p>
                    </div>

                    {/* Status indicator */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isInPlaylist ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {addToPlaylistMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isInPlaylist ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Music2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">У вас пока нет плейлистов</p>
              <p className="text-xs text-muted-foreground/70">Создайте первый плейлист</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
