/**
 * Playlists Hook
 * React hooks wrapping playlists API/service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import * as playlistsApi from '@/api/playlists.api';
import * as playlistsService from '@/services/playlists.service';

// Interfaces for backward compatibility (matching old usePlaylists types)
export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_public: boolean | null;
  track_count: number | null;
  total_duration: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string | null;
}

export function usePlaylists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's playlists
  const { data: playlists, isLoading, error } = useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return playlistsApi.fetchUserPlaylists(user.id);
    },
    enabled: !!user,
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Create playlist
  const createPlaylistMutation = useMutation({
    mutationFn: async (input: { title: string; description?: string; is_public?: boolean }) => {
      if (!user) throw new Error('Необходимо авторизоваться');
      return playlistsService.createPlaylist(
        user.id,
        input.title,
        input.description,
        input.is_public
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Плейлист создан');
    },
    onError: (error: Error) => {
      logger.error('Error creating playlist', error);
      toast.error(error.message || 'Ошибка создания плейлиста');
    },
  });

  // Update playlist
  const updatePlaylistMutation = useMutation({
    mutationFn: async (input: { 
      id: string; 
      title?: string; 
      description?: string; 
      cover_url?: string; 
      is_public?: boolean 
    }) => {
      const { id, ...updates } = input;
      return playlistsApi.updatePlaylist(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Плейлист обновлён');
    },
    onError: (error) => {
      logger.error('Error updating playlist', error);
      toast.error('Ошибка обновления плейлиста');
    },
  });

  // Delete playlist
  const deletePlaylistMutation = useMutation({
    mutationFn: playlistsApi.deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Плейлист удалён');
    },
    onError: (error) => {
      logger.error('Error deleting playlist', error);
      toast.error('Ошибка удаления плейлиста');
    },
  });

  // Add track to playlist
  const addTrackMutation = useMutation({
    mutationFn: async (input: { playlistId: string; trackId: string }) => {
      return playlistsService.addTrackToPlaylist(input.playlistId, input.trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Трек добавлен в плейлист');
    },
    onError: (error: Error) => {
      logger.error('Error adding track to playlist', error);
      if (error.message.includes('duplicate') || error.message.includes('23505')) {
        toast.error('Трек уже в плейлисте');
      } else {
        toast.error(error.message || 'Ошибка добавления трека');
      }
    },
  });

  // Remove track from playlist
  const removeTrackMutation = useMutation({
    mutationFn: async (input: { playlistId: string; trackId: string }) => {
      return playlistsApi.removeTrackFromPlaylist(input.playlistId, input.trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Трек удалён из плейлиста');
    },
    onError: (error) => {
      logger.error('Error removing track from playlist', error);
      toast.error('Ошибка удаления трека');
    },
  });

  // Reorder tracks in playlist
  const reorderTracksMutation = useMutation({
    mutationFn: async (input: { playlistId: string; trackIds: string[] }) => {
      return playlistsApi.reorderPlaylistTracks(input.playlistId, input.trackIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks'] });
    },
    onError: (error) => {
      logger.error('Error reordering tracks', error);
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
      return playlistsApi.fetchPlaylistTracksWithDetails(playlistId);
    },
    enabled: !!playlistId,
  });
}
