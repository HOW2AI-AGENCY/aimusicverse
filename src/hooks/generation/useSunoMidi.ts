import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { generateSunoMidi, getSunoMidiStatus, type SunoMidiParams, type SunoMidiStatus } from "@/api/midi-suno.api";
import { logger } from "@/lib/logger";

/**
 * Sprint 053-A3: Hook for Suno MIDI generation.
 *
 * Pattern (proven by Sprint 053-A1 SFX pilot):
 *   1. useMutation initiates generation → returns { taskId }
 *   2. useQuery polls suno-midi-details every 5000ms (midi is the slowest task type
 *      per the suno-details dispatcher BACKOFF_MS_BY_TYPE)
 *   3. refetchInterval returns false once status hits SUCCESS or FAILED
 *
 * Composition: `useSunoMidiTranscription` (Studio integration hook) wraps this
 * with a 60s timeout + graceful fallback to `useReplicateMidiTranscription`.
 *
 * Tests required: 5 unit tests (Sprint 052 retro requirement).
 */

const POLL_INTERVAL_MS = 5000;

export function useSunoMidiMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: Omit<SunoMidiParams, "userId">) => {
      if (!user?.id) throw new Error("User not authenticated");
      return generateSunoMidi({ ...params, userId: user.id });
    },
    onSuccess: (data) => {
      logger.info("Suno MIDI generation started", { taskId: data.taskId });
      queryClient.invalidateQueries({ queryKey: ["suno-midi-status", data.taskId] });
    },
    onError: (error: Error) => {
      logger.error("Suno MIDI mutation error", { error: error.message });
    },
  });
}

export function useSunoMidiStatus(taskId: string | null) {
  return useQuery<SunoMidiStatus>({
    queryKey: ["suno-midi-status", taskId],
    queryFn: () => {
      if (!taskId) throw new Error("taskId is required");
      return getSunoMidiStatus(taskId);
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "SUCCESS" || data?.status === "FAILED") return false;
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

export function useSunoMidi() {
  const mutation = useSunoMidiMutation();
  const taskId = mutation.data?.taskId ?? null;
  const statusQuery = useSunoMidiStatus(taskId);

  return {
    generate: mutation.mutateAsync,
    isGenerating: mutation.isPending || statusQuery.data?.status === "PROCESSING",
    midi: statusQuery.data,
    error: mutation.error ?? statusQuery.error,
    reset: mutation.reset,
  };
}
