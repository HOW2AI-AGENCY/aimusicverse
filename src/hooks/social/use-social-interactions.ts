/**
 * useSocialInteractions Hook
 * 
 * Implementation for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T046 - Social interactions with optimistic updates
 * 
 * Consolidates social interaction logic from multiple components:
 * - Track likes/unlikes
 * - Artist follows/unfollows
 * - Playlist likes
 * - Share operations (clipboard, Telegram, Twitter)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Database } from '@/integrations/supabase/types';

type EntityType = 'track' | 'playlist' | 'artist';
type SharePlatform = 'clipboard' | 'telegram' | 'twitter';

interface UseSocialInteractionsParams {
  entityType: EntityType;
  entityId: string;
}

interface UseSocialInteractionsReturn {
  // Like status
  isLiked: boolean;
  likesCount: number;
  toggleLike: () => Promise<void>;
  isLikePending: boolean;
  
  // Follow status (for artists)
  isFollowing: boolean | undefined;
  toggleFollow: () => Promise<void>;
  isFollowPending: boolean;
  
  // Share operations
  share: (platform: SharePlatform) => Promise<void>;
  isSharing: boolean;
  
  // Loading states
  isLoading: boolean;
}

/**
 * Hook for managing social interactions (likes, follows, shares)
 * with optimistic updates and real-time synchronization
 */
export function useSocialInteractions({
  entityType,
  entityId,
}: UseSocialInteractionsParams): UseSocialInteractionsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  // Determine the correct table based on entity type
  const likeTable = entityType === 'track' 
    ? 'track_likes' 
    : entityType === 'playlist' 
    ? 'playlist_likes' 
    : null;

  // Query for like status
  const {
    data: likeData,
    isLoading: isLoadingLike,
  } = useQuery({
    queryKey: ['like-status', entityType, entityId, user?.id],
    queryFn: async () => {
      if (!user?.id || !likeTable) return { isLiked: false, count: 0 };

      // Check if user has liked this entity
      const { data: likeRecord } = await supabase
        .from(likeTable as any)
        .select('id')
        .eq(`${entityType}_id`, entityId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Get total likes count
      const { count } = await supabase
        .from(likeTable as any)
        .select('*', { count: 'exact', head: true })
        .eq(`${entityType}_id`, entityId);

      return {
        isLiked: !!likeRecord,
        count: count || 0,
      };
    },
    enabled: !!user?.id && !!entityId && !!likeTable,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for follow status (artists only)
  const {
    data: followData,
    isLoading: isLoadingFollow,
  } = useQuery({
    queryKey: ['follow-status', entityId, user?.id],
    queryFn: async () => {
      if (!user?.id || entityType !== 'artist') return false;

      const { data } = await supabase
        .from('artist_follows')
        .select('id')
        .eq('artist_id', entityId)
        .eq('user_id', user.id)
        .maybeSingle();

      return !!data;
    },
    enabled: !!user?.id && !!entityId && entityType === 'artist',
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !likeTable) throw new Error('User not authenticated');

      const isCurrentlyLiked = likeData?.isLiked ?? false;

      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from(likeTable as any)
          .delete()
          .eq(`${entityType}_id`, entityId)
          .eq('user_id', user.id);

        if (error) throw error;
        return { action: 'unlike' as const };
      } else {
        // Like
        const { error } = await supabase
          .from(likeTable as any)
          .insert({
            [`${entityType}_id`]: entityId,
            user_id: user.id,
          });

        if (error) throw error;
        return { action: 'like' as const };
      }
    },
    onMutate: async () => {
      // Haptic feedback
      haptic.impact('light');

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['like-status', entityType, entityId, user?.id],
      });

      // Snapshot previous value
      const previousLikeData = queryClient.getQueryData([
        'like-status',
        entityType,
        entityId,
        user?.id,
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ['like-status', entityType, entityId, user?.id],
        (old: any) => {
          const isCurrentlyLiked = old?.isLiked ?? false;
          return {
            isLiked: !isCurrentlyLiked,
            count: old?.count + (isCurrentlyLiked ? -1 : 1),
          };
        }
      );

      return { previousLikeData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousLikeData) {
        queryClient.setQueryData(
          ['like-status', entityType, entityId, user?.id],
          context.previousLikeData
        );
      }

      logger.error('Error toggling like', error instanceof Error ? error : new Error(String(error)));
      toast.error('Не удалось изменить статус лайка');
      haptic.notification('error');
    },
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['like-status', entityType, entityId],
      });
      queryClient.invalidateQueries({
        queryKey: [entityType, entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-likes'],
      });

      haptic.notification('success');
    },
  });

  // Toggle follow mutation (artists only)
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || entityType !== 'artist') {
        throw new Error('Invalid operation');
      }

      const isCurrentlyFollowing = followData ?? false;

      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('artist_follows')
          .delete()
          .eq('artist_id', entityId)
          .eq('user_id', user.id);

        if (error) throw error;
        return { action: 'unfollow' as const };
      } else {
        // Follow
        const { error } = await supabase
          .from('artist_follows')
          .insert({
            artist_id: entityId,
            user_id: user.id,
          });

        if (error) throw error;
        return { action: 'follow' as const };
      }
    },
    onMutate: async () => {
      haptic.impact('light');

      await queryClient.cancelQueries({
        queryKey: ['follow-status', entityId, user?.id],
      });

      const previousFollowData = queryClient.getQueryData([
        'follow-status',
        entityId,
        user?.id,
      ]);

      queryClient.setQueryData(
        ['follow-status', entityId, user?.id],
        (old: boolean | undefined) => !old
      );

      return { previousFollowData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousFollowData !== undefined) {
        queryClient.setQueryData(
          ['follow-status', entityId, user?.id],
          context.previousFollowData
        );
      }

      logger.error('Error toggling follow', error instanceof Error ? error : new Error(String(error)));
      toast.error('Не удалось изменить статус подписки');
      haptic.notification('error');
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['follow-status', entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['artist', entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-follows'],
      });

      toast.success(
        result.action === 'follow' ? 'Вы подписались' : 'Вы отписались'
      );
      haptic.notification('success');
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (platform: SharePlatform) => {
      // Get entity details
      const { data: entity } = await supabase
        .from(entityType === 'track' ? 'tracks' : 'playlists')
        .select('title, audio_url, image_url')
        .eq('id', entityId)
        .single();

      if (!entity) throw new Error(`${entityType} not found`);

      const shareUrl = `${window.location.origin}/${entityType}/${entityId}`;
      const shareText = entity.title;

      switch (platform) {
        case 'clipboard':
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Ссылка скопирована в буфер обмена');
          break;

        case 'telegram':
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openTelegramLink(
              `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
            );
          } else {
            // Fallback to web share API
            if (navigator.share) {
              await navigator.share({
                title: shareText,
                url: shareUrl,
              });
            } else {
              throw new Error('Sharing not supported');
            }
          }
          break;

        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
            '_blank',
            'noopener,noreferrer'
          );
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Track analytics
      await supabase.from('analytics').insert({
        event_type: 'share',
        entity_type: entityType,
        entity_id: entityId,
        platform,
        user_id: user?.id,
      });

      return { platform };
    },
    onMutate: () => {
      haptic.impact('medium');
    },
    onError: (error) => {
      logger.error('Error sharing', error instanceof Error ? error : new Error(String(error)));
      toast.error('Не удалось поделиться');
      haptic.notification('error');
    },
    onSuccess: (result) => {
      if (result.platform !== 'clipboard') {
        toast.success('Успешно поделились!');
      }
      haptic.notification('success');
    },
  });

  return {
    // Like state
    isLiked: likeData?.isLiked ?? false,
    likesCount: likeData?.count ?? 0,
    toggleLike: () => likeMutation.mutateAsync(),
    isLikePending: likeMutation.isPending,

    // Follow state (only for artists)
    isFollowing: entityType === 'artist' ? followData : undefined,
    toggleFollow: () => followMutation.mutateAsync(),
    isFollowPending: followMutation.isPending,

    // Share
    share: (platform: SharePlatform) => shareMutation.mutateAsync(platform),
    isSharing: shareMutation.isPending,

    // Loading
    isLoading: isLoadingLike || isLoadingFollow,
  };
}
