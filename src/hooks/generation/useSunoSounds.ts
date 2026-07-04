import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateSunoSounds,
  getSunoSoundsStatus,
  type SunoSoundsParams,
  type SunoSoundsStatus,
} from "@/api/sound-effects.api";
import { logger } from "@/lib/logger";

/**
 * Sprint 053-A1: Hook for Suno SFX generation.
 *
 * Pattern (per Sprint 052 retro): every TanStack Query mutation hook MUST
 * have unit tests verifying that the mutation is called with correct params.
 *
 * Flow:
 *   1. `useSunoSounds().generate({ prompt, ... })` calls `suno-sounds` edge
 *      function which forwards to Suno `/api/v1/sound/generate`.
 *   2. Edge returns `{ taskId }`; we start polling for status.
 *   3. `useSunoSoundsStatus(taskId)` polls `suno-sounds-status` until terminal state.
 */

const POLL_INTERVAL_MS = 2500;

export function useSunoSoundsMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: Omit<SunoSoundsParams, "userId">) => {
      if (!user?.id) throw new Error("User not authenticated");
      return generateSunoSounds({ ...params, userId: user.id });
    },
    onSuccess: (data) => {
      logger.info("Suno SFX generation started", { taskId: data.taskId });
      queryClient.invalidateQueries({ queryKey: ["suno-sfx-status", data.taskId] });
    },
    onError: (error: Error) => {
      logger.error("Suno SFX mutation error", { error: error.message });
    },
  });
}

export function useSunoSoundsStatus(taskId: string | null) {
  return useQuery<SunoSoundsStatus>({
    queryKey: ["suno-sfx-status", taskId],
    queryFn: () => {
      if (!taskId) throw new Error("taskId is required");
      return getSunoSoundsStatus(taskId);
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "completed" || data?.status === "failed") return false;
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

export function useSunoSounds() {
  const mutation = useSunoSoundsMutation();
  const taskId = mutation.data?.taskId ?? null;
  const statusQuery = useSunoSoundsStatus(taskId);

  return {
    generate: mutation.mutateAsync,
    isGenerating: mutation.isPending || statusQuery.data?.status === "processing",
    sfx: statusQuery.data,
    error: mutation.error ?? statusQuery.error,
    reset: mutation.reset,
  };
}
