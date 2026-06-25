// useLikeTrack hook - Sprint 011 - Fixed with optimistic updates + P0 analytics fix
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { logger } from "@/lib/logger";
import { trackButtonClick, trackTrackLiked } from "@/services/analytics";
import { trackConversionStage, hasReachedStage } from "@/lib/analytics/deeplink-tracker";

export function useLikeTrack(trackId: string, initialLiked?: boolean) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  // Query for like status
  const { data: isLiked, isLoading: isCheckingLike } = useQuery({
    queryKey: ["track-like", trackId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("track_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("track_id", trackId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!trackId && initialLiked === undefined,
    initialData: initialLiked,
    staleTime: 30000, // Cache for 30 seconds
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Не авторизован");

      const currentlyLiked = isLiked;

      if (currentlyLiked) {
        const { error } = await supabase.from("track_likes").delete().eq("user_id", user.id).eq("track_id", trackId);
        if (error) throw error;
        return { action: "unlike" as const };
      } else {
        const { error } = await supabase.from("track_likes").insert({ user_id: user.id, track_id: trackId });
        if (error) throw error;
        return { action: "like" as const };
      }
    },
    // Optimistic update
    onMutate: async () => {
      haptic.impact("light");

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["track-like", trackId, user?.id] });

      // Snapshot the previous value
      const previousLiked = queryClient.getQueryData(["track-like", trackId, user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(["track-like", trackId, user?.id], !isLiked);

      // Return context with the previous value
      return { previousLiked };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(["track-like", trackId, user?.id], context.previousLiked);
      }
      logger.error("Error toggling like", error instanceof Error ? error : new Error(String(error)));
      toast.error("Не удалось обновить лайк");
    },
    onSuccess: (result) => {
      // Invalidate related queries to sync like counts
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["public-content"] });
      queryClient.invalidateQueries({ queryKey: ["home-data"] });

      // P0 Fix: Track proper track_liked event for analytics
      trackTrackLiked(trackId, result.action, {
        source: "library",
      }).catch(() => {});

      // Also track as button click for backwards compatibility
      trackButtonClick(result.action === "like" ? "track_like" : "track_unlike", {
        track_id: trackId,
      }).catch(() => {});

      // Track first action conversion if this is user's first like
      if (result.action === "like" && !hasReachedStage("first_action")) {
        trackConversionStage("first_action", {
          action_type: "like",
          track_id: trackId,
        }).catch(() => {});
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ["track-like", trackId, user?.id] });
    },
  });

  return {
    isLiked: isLiked ?? false,
    isLoading: isCheckingLike || likeMutation.isPending,
    toggleLike: likeMutation.mutate,
  };
}
