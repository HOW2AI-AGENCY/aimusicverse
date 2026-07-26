import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
type SeparationMode = "simple" | "detailed";

/**
 * Minimal track shape required for stem separation. Full `Track` objects
 * satisfy this structurally, so callers with narrowed studio objects don't
 * need casts. The mutation reads audio_url/suno_id for validation and
 * suno_task_id for the edge function payload.
 */
export interface SeparableTrack {
  id: string;
  audio_url: string | null;
  suno_id?: string | null;
  suno_task_id?: string | null;
}

interface SeparationParams {
  track: SeparableTrack;
  mode: SeparationMode;
}

export const useStemSeparation = () => {
  const [separatingTrackId, setSeparatingTrackId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const separateMutation = useMutation({
    mutationFn: async ({ track, mode }: SeparationParams) => {
      if (!track.audio_url || !track.suno_id) {
        throw new Error("Недостаточно данных для разделения");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const { data, error } = await supabase.functions.invoke("suno-separate-vocals", {
        body: {
          taskId: track.suno_task_id, // Edge function expects suno_task_id, not track.id
          audioId: track.suno_id,
          mode,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onMutate: ({ track }) => {
      setSeparatingTrackId(track.id);
    },
    onSuccess: (data, { mode, track }) => {
      if (!data?.separationTaskId) {
        toast.error("Ошибка: API не вернул ID задачи разделения", {
          description: "Попробуйте ещё раз позже",
        });
        setSeparatingTrackId(null);
        return;
      }
      toast.success(mode === "simple" ? "Разделение на 2 стема запущено" : "Разделение на 6+ стемов запущено", {
        description: "Процесс займёт 1-3 минуты",
      });
      // Keep separatingTrackId set — realtime hook tracks the async progress
    },
    onError: (error: Error) => {
      logger.error("Error separating stems", error);
      toast.error("Ошибка при разделении стемов", {
        description: error.message,
      });
      setSeparatingTrackId(null);
    },
    onSettled: () => {
      // Don't clear separatingTrackId here! The separation is async (1-3 min).
      // The realtime hook (useStemSeparationRealtime) tracks actual progress.
      // Only invalidate queries to refresh stem data
      queryClient.invalidateQueries({ queryKey: ["track-stems"] });
      queryClient.invalidateQueries({ queryKey: ["stem-separation-tasks"] });
    },
  });

  const separate = useCallback(
    (track: SeparableTrack, mode: SeparationMode) => {
      return separateMutation.mutateAsync({ track, mode });
    },
    [separateMutation],
  );

  const canSeparate = useCallback((track: SeparableTrack) => {
    return !!track.suno_id && !!track.audio_url;
  }, []);

  return {
    separate,
    canSeparate,
    isSeparating: separateMutation.isPending,
    separatingTrackId,
    isTrackSeparating: (trackId: string) => separatingTrackId === trackId,
    clearSeparatingState: () => setSeparatingTrackId(null),
  };
};
