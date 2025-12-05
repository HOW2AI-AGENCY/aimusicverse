import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean;
  track_count: number;
  total_duration: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export function usePlaylists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's playlists
  const { data: playlists, isLoading, error } = useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Playlist[];
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Create playlist
  const createPlaylistMutation = useMutation({
    mutationFn: async (input: { title: string; description?: string; is_public?: boolean }) => {
      if (!user) {
        throw new Error('Необходимо авторизоваться');
      }

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          is_public: input.is_public ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Ошибка базы данных');
      }
      return data as Playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Плейлист создан');
    },
    onError: (error: Error) => {
      console.error('Error creating playlist:', error);
      toast.error(error.message || 'Ошибка создания плейлиста');
    },
  });

  // Update playlist
  const updatePlaylistMutation = useMutation({
    mutationFn: async (input: { id: string; title?: string; description?: string; cover_url?: string; is_public?: boolean }) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Плейлист обновлён');
    },
    onError: (error) => {
      console.error('Error updating playlist:', error);
      toast.error('Ошибка обновления плейлиста');
    },
  });

  // Delete playlist
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Плейлист удалён');
    },
    onError: (error) => {
      console.error('Error deleting playlist:', error);
      toast.error('Ошибка удаления плейлиста');
    },
  });

  // Add track to playlist
  const addTrackMutation = useMutation({
    mutationFn: async (input: { playlistId: string; trackId: string }) => {
      // Get current max position
      const { data: existing } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', input.playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existing?.[0]?.position !== undefined ? existing[0].position + 1 : 0;

      const { data, error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: input.playlistId,
          track_id: input.trackId,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Трек уже в плейлисте');
        }
        throw error;
      }
      return data as PlaylistTrack;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Трек добавлен в плейлист');
    },
    onError: (error: Error) => {
      console.error('Error adding track:', error);
      toast.error(error.message || 'Ошибка добавления трека');
    },
  });

  // Remove track from playlist
  const removeTrackMutation = useMutation({
    mutationFn: async (input: { playlistId: string; trackId: string }) => {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', input.playlistId)
        .eq('track_id', input.trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Трек удалён из плейлиста');
    },
    onError: (error) => {
      console.error('Error removing track:', error);
      toast.error('Ошибка удаления трека');
    },
  });

  // Reorder tracks in playlist
  const reorderTracksMutation = useMutation({
    mutationFn: async (input: { playlistId: string; trackIds: string[] }) => {
      // Update positions for all tracks
      const updates = input.trackIds.map((trackId, index) => 
        supabase
          .from('playlist_tracks')
          .update({ position: index })
          .eq('playlist_id', input.playlistId)
          .eq('track_id', trackId)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks'] });
    },
    onError: (error) => {
      console.error('Error reordering tracks:', error);
      toast.error('Ошибка изменения порядка');
    },
  });

  return {
    playlists: playlists ?? [],
    isLoading,
    error,
    createPlaylist: createPlaylistMutation.mutateAsync,
    updatePlaylist: updatePlaylistMutation.mutateAsync,
    deletePlaylist: deletePlaylistMutation.mutateAsync,
    addTrackToPlaylist: addTrackMutation.mutateAsync,
    removeTrackFromPlaylist: removeTrackMutation.mutateAsync,
    reorderPlaylistTracks: reorderTracksMutation.mutateAsync,
    isCreating: createPlaylistMutation.isPending,
    isAdding: addTrackMutation.isPending,
  };
}

// Hook to get playlist tracks
export function usePlaylistTracks(playlistId: string | null) {
  return useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: async () => {
      if (!playlistId) return [];
      
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select(`
          *,
          track:tracks(*)
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!playlistId,
  });
}
