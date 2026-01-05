/**
 * useTrackActions Hook
 *
 * Per contracts/useTrackActions.contract.ts:
 * - Track operations with optimistic updates
 * - Like, unlike, share, delete actions
 * - Add/remove from playlist
 * - Remix and download actions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { HapticFeedback } from '@twa-dev/sdk';
import type { UseTrackActionsParams, UseTrackActionsReturn, SharePlatform } from '@/hooks/types/track';

/**
 * Like a track
 */
async function likeTrack(trackId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase.from('track_likes').insert({
    track_id: trackId,
    user_id: user.id,
  });

  if (error) throw error;
}

/**
 * Unlike a track
 */
async function unlikeTrack(trackId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('track_likes')
    .delete()
    .eq('track_id', trackId)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Share a track
 */
async function shareTrack(trackId: string, platform: SharePlatform): Promise<void> {
  const { data: track } = await supabase
    .from('tracks')
    .select('title, audio_url, image_url')
    .eq('id', trackId)
    .single();

  if (!track) throw new Error('Track not found');

  const shareUrl = `${window.location.origin}/track/${trackId}`;

  if (platform === 'clipboard') {
    await navigator.clipboard.writeText(shareUrl);
  } else if (platform === 'telegram') {
    // Telegram WebApp SDK share
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(track.title)}`
      );
    }
  } else if (platform === 'twitter') {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(track.title)}`,
      '_blank'
    );
  }

  // Track share analytics
  await supabase.from('analytics').insert({
    event_type: 'share',
    track_id: trackId,
    platform,
  });
}

/**
 * Delete a track
 */
async function deleteTrackFromDb(trackId: string): Promise<void> {
  const { error } = await supabase.from('tracks').delete().eq('id', trackId);

  if (error) throw error;
}

/**
 * Add track to playlist
 */
async function addToPlaylist(trackId: string, playlistId: string): Promise<void> {
  const { error } = await supabase.from('playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
  });

  if (error) throw error;
}

/**
 * Remove track from playlist
 */
async function removeFromPlaylist(trackId: string, playlistId: string): Promise<void> {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (error) throw error;
}

/**
 * Remix a track
 */
async function remixTrack(trackId: string): Promise<void> {
  // This would call the generation service
  logger.info('Remixing track', { trackId });
  // Implementation depends on generation API
}

/**
 * Download a track
 */
async function downloadTrack(trackId: string): Promise<void> {
  const { data: track } = await supabase
    .from('tracks')
    .select('audio_url, title')
    .eq('id', trackId)
    .single();

  if (!track || !track.audio_url) throw new Error('Track not found');

  // Download file
  const response = await fetch(track.audio_url);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${track.title}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Hook for track actions with optimistic updates
 *
 * @example
 * ```tsx
 * const { likeTrack, shareTrack, deleteTrack, isPending } = useTrackActions({
 *   trackId: track.id,
 *   enableOptimistic: true,
 * });
 * ```
 */
export function useTrackActions(params: UseTrackActionsParams): UseTrackActionsReturn {
  const queryClient = useQueryClient();
  const { trackId, enableOptimistic } = params;

  // Provide haptic feedback
  const hapticFeedback = (type: 'light' | 'medium' | 'error' | 'success') => {
    try {
      if (type === 'light') HapticFeedback.impactOccurred('light');
      else if (type === 'medium') HapticFeedback.impactOccurred('medium');
      else if (type === 'error') HapticFeedback.notificationOccurred('error');
      else if (type === 'success') HapticFeedback.notificationOccurred('success');
    } catch (error) {
      // Haptic feedback not available (desktop)
    }
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      await likeTrack(trackId);
    },
    onMutate: async () => {
      hapticFeedback('light');

      // Optimistic update
      if (enableOptimistic) {
        await queryClient.cancelQueries({ queryKey: ['tracks'] });
        // Update cache
      }
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track', trackId] });
    },
    onError: (error) => {
      logger.error('Failed to like track', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      await unlikeTrack(trackId);
    },
    onMutate: async () => {
      hapticFeedback('light');

      if (enableOptimistic) {
        await queryClient.cancelQueries({ queryKey: ['tracks'] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track', trackId] });
    },
    onError: (error) => {
      logger.error('Failed to unlike track', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (platform: SharePlatform) => {
      await shareTrack(trackId, platform);
    },
    onSuccess: () => {
      hapticFeedback('success');
    },
    onError: (error) => {
      logger.error('Failed to share track', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteTrackFromDb(trackId);
    },
    onSuccess: () => {
      hapticFeedback('success');
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
    },
    onError: (error) => {
      logger.error('Failed to delete track', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Add to playlist mutation
  const addToPlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      await addToPlaylist(trackId, playlistId);
    },
    onSuccess: () => {
      hapticFeedback('success');
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: (error) => {
      logger.error('Failed to add to playlist', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Remove from playlist mutation
  const removeFromPlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      await removeFromPlaylist(trackId, playlistId);
    },
    onSuccess: () => {
      hapticFeedback('success');
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: (error) => {
      logger.error('Failed to remove from playlist', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Remix mutation
  const remixMutation = useMutation({
    mutationFn: async () => {
      await remixTrack(trackId);
    },
    onSuccess: () => {
      hapticFeedback('success');
    },
    onError: (error) => {
      logger.error('Failed to remix track', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      await downloadTrack(trackId);
    },
    onSuccess: () => {
      hapticFeedback('success');
    },
    onError: (error) => {
      logger.error('Failed to download track', { error, trackId });
      hapticFeedback('error');
    },
  });

  // Check if any mutation is pending
  const isPending =
    likeMutation.isPending ||
    unlikeMutation.isPending ||
    shareMutation.isPending ||
    deleteMutation.isPending ||
    addToPlaylistMutation.isPending ||
    removeFromPlaylistMutation.isPending ||
    remixMutation.isPending ||
    downloadMutation.isPending;

  return {
    likeTrack: () => likeMutation.mutate(),
    unlikeTrack: () => unlikeMutation.mutate(),
    shareTrack: (platform) => shareMutation.mutate(platform),
    deleteTrack: () => deleteMutation.mutate(),
    addToPlaylist: (playlistId) => addToPlaylistMutation.mutate(playlistId),
    removeFromPlaylist: (playlistId) => removeFromPlaylistMutation.mutate(playlistId),
    remixTrack: () => remixMutation.mutate(),
    downloadTrack: () => downloadMutation.mutate(),
    isPending,
    error:
      likeMutation.error ||
      unlikeMutation.error ||
      shareMutation.error ||
      deleteMutation.error ||
      addToPlaylistMutation.error ||
      removeFromPlaylistMutation.error ||
      remixMutation.error ||
      downloadMutation.error ||
      null,
  };
}
