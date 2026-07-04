// useLikeTrack hook - Sprint 011 - Fixed with optimistic updates + P0 analytics fix
// Sprint: likes are now scoped per track VERSION, not per track — liking
// version A no longer shows as liked after switching to version B.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMasterVersion } from "@/hooks/useTrackVersions";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { logger } from "@/lib/logger";
import { trackButtonClick, trackTrackLiked } from "@/services/analytics";
import { trackConversionStage, hasReachedStage } from "@/lib/analytics/deeplink-tracker";

/**
 * @param trackId Track to like.
 * @param initialLiked Skip the initial "is liked" fetch (parent already knows).
 * @param versionId Explicit version to scope the like to. Omit to default to
 *   the track's current active/primary version (the common case: the player
 *   and cards always show — and should like — whatever's currently active).
 */
export function useLikeTrack(trackId: string, initialLiked?: boolean, versionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  // Only resolve the active version when the caller didn't pin an explicit one.
  const { data: masterVersion, isLoading: isResolvingVersion } = useMasterVersion(versionId ? undefined : trackId);
  const resolvedVersionId = versionId ?? masterVersion?.id;

  // Query for like status
  const { data: isLiked, isLoading: isCheckingLike } = useQuery({
    queryKey: ["track-like", resolvedVersionId, user?.id],
    queryFn: async () => {
      if (!user?.id || !resolvedVersionId) return false;
      const { data } = await supabase
        .from("track_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("track_version_id", resolvedVersionId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id && !!resolvedVersionId && initialLiked === undefined,
    initialData: initialLiked,
    staleTime: 30000, // Cache for 30 seconds
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Не авторизован");
      if (!resolvedVersionId) throw new Error("Версия трека не найдена");

      const currentlyLiked = isLiked;

      if (currentlyLiked) {
        const { error } = await supabase
          .from("track_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("track_version_id", resolvedVersionId);
        if (error) throw error;
        return { action: "unlike" as const };
      } else {
        const { error } = await supabase
          .from("track_likes")
          .insert({ user_id: user.id, track_id: trackId, track_version_id: resolvedVersionId });
        if (error) throw error;
        return { action: "like" as const };
      }
    },
    // Optimistic update
    onMutate: async () => {
      haptic.impact("light");

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["track-like", resolvedVersionId, user?.id] });

      // Snapshot the previous value
      const previousLiked = queryClient.getQueryData(["track-like", resolvedVersionId, user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(["track-like", resolvedVersionId, user?.id], !isLiked);

      // Return context with the previous value
      return { previousLiked };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(["track-like", resolvedVersionId, user?.id], context.previousLiked);
      }
      const errMsg =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
            ? ((error as { message?: string }).message ?? JSON.stringify(error))
            : String(error);
      logger.error("Error toggling like", { trackId, versionId: resolvedVersionId, message: errMsg, raw: error });
      toast.error(errMsg.includes("row-level security") ? "Войдите, чтобы лайкать" : "Не удалось обновить лайк");
    },
    onSuccess: (result) => {
      // Invalidate related queries to sync like counts
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["public-content"] });
      queryClient.invalidateQueries({ queryKey: ["home-data"] });
      queryClient.invalidateQueries({ queryKey: ["track-versions", trackId] });

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
      queryClient.invalidateQueries({ queryKey: ["track-like", resolvedVersionId, user?.id] });
    },
  });

  return {
    isLiked: isLiked ?? false,
    isLoading: isCheckingLike || likeMutation.isPending || (!versionId && isResolvingVersion),
    toggleLike: likeMutation.mutate,
  };
}
