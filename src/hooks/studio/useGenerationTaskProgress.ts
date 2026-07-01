/**
 * useGenerationTaskProgress - Hook that subscribes to realtime updates of a
 * generation task identified by its suno_task_id.
 *
 * Used by StudioPendingTrackRow to drive progress UI for in-flight generations.
 */

import { useEffect, useState } from "react";
import { fetchGenerationTaskBySunoId, subscribeToGenerationTaskBySunoId } from "@/api/studio.api";

export interface GenerationTaskProgress {
  status: string;
  receivedClips: number | null;
  expectedClips: number | null;
}

const INITIAL: GenerationTaskProgress = {
  status: "pending",
  receivedClips: null,
  expectedClips: null,
};

export function useGenerationTaskProgress(taskId: string | null | undefined): GenerationTaskProgress {
  const [progress, setProgress] = useState<GenerationTaskProgress>(INITIAL);

  useEffect(() => {
    if (!taskId) {
      setProgress(INITIAL);
      return;
    }

    let cancelled = false;

    // Initial fetch
    void (async () => {
      const { data } = await fetchGenerationTaskBySunoId(taskId);
      if (cancelled || !data) return;
      setProgress({
        status: data.status,
        receivedClips: data.received_clips ?? null,
        expectedClips: data.expected_clips ?? null,
      });
    })();

    // Realtime subscription
    const sub = subscribeToGenerationTaskBySunoId(taskId, (task) => {
      if (cancelled) return;
      setProgress({
        status: task.status,
        receivedClips: task.received_clips ?? null,
        expectedClips: task.expected_clips ?? null,
      });
    });

    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, [taskId]);

  return progress;
}
