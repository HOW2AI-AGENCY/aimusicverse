// useComments hook - Sprint 011
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { showErrorWithRecovery } from '@/lib/errorHandling';
import { logger } from '@/lib/logger';

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  track_id: string;
  parent_id: string | null;
  likes_count: number;
  is_moderated: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string | null;
    photo_url: string | null;
    first_name: string;
  };
  isLiked?: boolean;
  repliesCount?: number;
}

export function useComments(trackId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comments', trackId],
    queryFn: async () => {
      // Get comments
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('track_id', trackId)
        .is('parent_id', null)
        .eq('is_moderated', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!comments) return [];

      // Get user profiles for comments
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, photo_url, first_name')
        .in('user_id', userIds);

      // Get like status for current user
      let likedCommentIds: string[] = [];
      if (user?.id) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', comments.map(c => c.id));
        likedCommentIds = likes?.map(l => l.comment_id) || [];
      }

      // Get reply counts
      const { data: replyCounts } = await supabase
        .from('comments')
        .select('parent_id')
        .in('parent_id', comments.map(c => c.id));

      const replyCountMap = new Map<string, number>();
      replyCounts?.forEach(r => {
        if (r.parent_id) {
          replyCountMap.set(r.parent_id, (replyCountMap.get(r.parent_id) || 0) + 1);
        }
      });

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return comments.map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id),
        isLiked: likedCommentIds.includes(comment.id),
        repliesCount: replyCountMap.get(comment.id) || 0,
      })) as Comment[];
    },
    enabled: !!trackId,
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId, content, parentId }: { trackId: string; content: string; parentId?: string }) => {
      if (!user?.id) throw new Error('Не авторизован');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          track_id: trackId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { trackId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
      toast.success('Комментарий добавлен');
    },
    onError: (error) => {
      logger.error('Error adding comment', error instanceof Error ? error : new Error(String(error)));
      showErrorWithRecovery(error);
    },
  });
}

export function useDeleteComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, trackId }: { commentId: string; trackId: string }) => {
      if (!user?.id) throw new Error('Не авторизован');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { commentId, trackId };
    },
    onSuccess: (_, { trackId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', trackId] });
      toast.success('Комментарий удалён');
    },
    onError: (error) => {
      logger.error('Error deleting comment', error instanceof Error ? error : new Error(String(error)));
      showErrorWithRecovery(error);
    },
  });
}
