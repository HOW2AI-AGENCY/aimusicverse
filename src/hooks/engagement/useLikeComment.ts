// useLikeComment hook - Sprint 011 - Enhanced with optimistic updates
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { logger } from "@/lib/logger";

interface LikeCommentParams {
  commentId: string;
  trackId: string;
  isCurrentlyLiked: boolean;
}

interface CommentData {
  id: string;
  likes_count: number;
  user_has_liked?: boolean;
  [key: string]: unknown;
}

export function useLikeComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  return useMutation({
    mutationFn: async ({ commentId, isCurrentlyLiked }: LikeCommentParams) => {
      if (!user?.id) throw new Error("Не авторизован");

      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("comment_id", commentId);
        if (error) throw error;
        return { action: "unlike" as const, commentId };
      } else {
        const { error } = await supabase.from("comment_likes").insert({ user_id: user.id, comment_id: commentId });
        if (error) throw error;
        return { action: "like" as const, commentId };
      }
    },
    // Optimistic update for instant feedback
    onMutate: async ({ commentId, trackId, isCurrentlyLiked }) => {
      haptic.impact("light");

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["comments", trackId] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<CommentData[]>(["comments", trackId]);

      // Optimistically update the comment's like count and status
      if (previousComments) {
        const updatedComments = previousComments.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes_count: isCurrentlyLiked
                ? Math.max(0, (comment.likes_count || 0) - 1)
                : (comment.likes_count || 0) + 1,
              user_has_liked: !isCurrentlyLiked,
            };
          }
          return comment;
        });
        queryClient.setQueryData(["comments", trackId], updatedComments);
      }

      // Return context with the previous value for rollback
      return { previousComments, trackId };
    },
    onError: (error, { trackId }, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", trackId], context.previousComments);
      }
      logger.error("Error toggling comment like", error instanceof Error ? error : new Error(String(error)));
      toast.error("Не удалось обновить лайк");
    },
    onSuccess: (_, { trackId }) => {
      // Background sync - invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["comments", trackId] });
    },
    onSettled: (_, __, { trackId }) => {
      // Always refetch after mutation settles for consistency
      queryClient.invalidateQueries({ queryKey: ["comments", trackId] });
    },
  });
}
