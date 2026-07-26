/**
 * useStemRealtime — Unified realtime subscription for stem separation.
 *
 * Replaces the duplicate subscriptions in:
 *   - useStemSeparationRealtime (progress tracking)
 *   - useStudioStemSync        (stem sync to Zustand store)
 *
 * Subscribes ONCE to stem_separation_tasks + track_stems INSERT.
 */

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useUnifiedStudioStore, TrackType, TRACK_COLORS } from "@/stores/useUnifiedStudioStore";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface SeparationProgress {
  taskId: string;
  status: "processing" | "completed" | "failed";
  mode: "simple" | "detailed";
  completedAt?: string;
  expectedStems: number;
  receivedStems: number;
}

interface SeparationTaskRow {
  id: string;
  status: string;
  mode: "simple" | "detailed";
}

interface StemRow {
  stem_type: string;
  audio_url: string | null;
}

export function useStemRealtime(trackId: string | null) {
  const queryClient = useQueryClient();
  const { success, error: hapticError } = useHapticFeedback();
  const [activeTask, setActiveTask] = useState<SeparationProgress | null>(null);
  const { addTrack, addClip } = useUnifiedStudioStore();

  const addStemToProject = useCallback(
    (stem: StemRow) => {
      if (!stem?.audio_url || !stem?.stem_type) return;

      const currentProject = useUnifiedStudioStore.getState().project;
      if (!currentProject) return;

      const alreadyExists = currentProject.tracks.some(
        (t) => (t.audioUrl || t.clips?.[0]?.audioUrl) === stem.audio_url,
      );
      if (alreadyExists) return;

      const type = stemTypeToTrackType(stem.stem_type);
      const name = stemTypeToLabel(stem.stem_type);

      const newTrackId = addTrack({
        name,
        type,
        audioUrl: stem.audio_url,
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        color: TRACK_COLORS[type] || TRACK_COLORS.other,
        status: "ready" as const,
      });

      addClip(newTrackId, {
        audioUrl: stem.audio_url,
        name,
        startTime: 0,
        duration: currentProject.durationSeconds || 180,
        trimStart: 0,
        trimEnd: 0,
        fadeIn: 0,
        fadeOut: 0,
      });
    },
    [addTrack, addClip],
  );

  const clearTask = useCallback(() => {
    setActiveTask(null);
  }, []);

  useEffect(() => {
    if (!trackId) return;

    // Fetch any active separation task on mount
    const fetchInitialData = async () => {
      const { data: taskData } = await supabase
        .from("stem_separation_tasks")
        .select("*")
        .eq("track_id", trackId)
        .eq("status", "processing")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (taskData) {
        const expectedStems = taskData.mode === "detailed" ? 6 : 2;
        const { count } = await supabase
          .from("track_stems")
          .select("*", { count: "exact", head: true })
          .eq("track_id", trackId);

        setActiveTask({
          taskId: taskData.id,
          status: "processing",
          mode: taskData.mode as "simple" | "detailed",
          expectedStems,
          receivedStems: count || 0,
        });
      }

      // Fetch existing stems and add to store
      const { data: existingStems } = await supabase
        .from("track_stems")
        .select("stem_type, audio_url")
        .eq("track_id", trackId);

      if (existingStems) {
        existingStems
          .filter((s): s is StemRow & { audio_url: string } => !!s.audio_url)
          .forEach((s) => addStemToProject(s));
      }
    };

    fetchInitialData();

    // CHANNEL 1: stem_separation_tasks updates
    const taskChannel = supabase
      .channel(`stem-realtime-task-${trackId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stem_separation_tasks",
          filter: `track_id=eq.${trackId}`,
        },
        async (payload) => {
          const task = (payload.new ?? null) as SeparationTaskRow | null;
          if (!task) return;

          if (payload.eventType === "INSERT") {
            const expectedStems = task.mode === "detailed" ? 6 : 2;
            setActiveTask({
              taskId: task.id,
              status: "processing",
              mode: task.mode,
              expectedStems,
              receivedStems: 0,
            });
          } else if (payload.eventType === "UPDATE") {
            if (task.status === "completed") {
              success();
              toast.success("Стемы готовы!", {
                description:
                  task.mode === "detailed"
                    ? "Аудио разделено на 6+ дорожек"
                    : "Аудио разделено на вокал и инструментал",
              });

              queryClient.invalidateQueries({ queryKey: ["track-stems", trackId] });
              queryClient.invalidateQueries({ queryKey: ["tracks"] });

              setActiveTask((prev) => (prev ? { ...prev, status: "completed" } : null));
              setTimeout(clearTask, 3000);
            } else if (task.status === "failed") {
              hapticError();
              toast.error("Ошибка разделения", {
                description: "Не удалось разделить аудио на стемы",
              });

              setActiveTask((prev) => (prev ? { ...prev, status: "failed" } : null));
              setTimeout(clearTask, 3000);
            }
          }
        },
      )
      .subscribe();

    // CHANNEL 2: track_stems INSERT — both progress AND add to store
    const stemsChannel = supabase
      .channel(`stem-realtime-stems-${trackId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "track_stems",
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          const stem = payload.new as StemRow | null;
          if (!stem) return;

          // Update progress counter
          setActiveTask((prev) => {
            if (!prev) return null;
            return { ...prev, receivedStems: prev.receivedStems + 1 };
          });

          // Add stem to DAW store
          addStemToProject(stem);

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ["track-stems", trackId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(stemsChannel);
    };
  }, [trackId, queryClient, success, hapticError, clearTask, addStemToProject]);

  const progress = activeTask
    ? Math.min(100, Math.round((activeTask.receivedStems / activeTask.expectedStems) * 100))
    : 0;

  return {
    activeTask,
    progress,
    isProcessing: activeTask?.status === "processing",
    isCompleted: activeTask?.status === "completed",
    isFailed: activeTask?.status === "failed",
    clearTask,
  };
}

function stemTypeToTrackType(stemType: string): TrackType {
  const t = stemType.toLowerCase();
  if (t === "vocals" || t === "vocal") return "vocal";
  if (t === "instrumental") return "instrumental";
  if (t === "drums") return "drums";
  if (t === "bass") return "bass";
  return "other";
}

function stemTypeToLabel(stemType: string): string {
  const t = stemType.toLowerCase();
  if (t === "vocals" || t === "vocal") return "Вокал";
  if (t === "instrumental") return "Инструментал";
  if (t === "drums") return "Ударные";
  if (t === "bass") return "Бас";
  return "Другое";
}
