/**
 * useStudioRealtime - Subscribe to realtime updates for a studio project:
 *   1. generation_tasks UPDATE per pending task (filter suno_task_id)
 *   2. studio_projects UPDATE for the current project
 *
 * Used by StudioShell to react to pending generation completions and project changes.
 *
 * Returns the subscription teardown so the caller can clean up. The hook itself
 * subscribes/unsubscribes based on project changes.
 */

import { useEffect, useRef } from "react";
import {
  subscribeToPendingTaskComplete,
  subscribeToStudioProject,
} from "@/services/studio.service";
import { logger } from "@/lib/logger";
import type { StudioTrack } from "@/stores/useUnifiedStudioStore";

export interface PendingTask {
  trackId: string;
  taskId: string;
}

export interface StudioRealtimeCallbacks {
  onTaskCompleted: (params: {
    trackId: string;
    taskId: string;
    versions: { label: string; audioUrl: string; duration: number }[];
  }) => void;
  onTaskFailed: (params: { trackId: string; taskId: string }) => void;
  onProjectTracksUpdated: (newTracks: StudioTrack[]) => void;
}

interface UseStudioRealtimeParams {
  projectId: string | null | undefined;
  pendingTasks: PendingTask[];
  pendingTrackIds: Set<string>;
  isMountedRef: React.MutableRefObject<boolean>;
  callbacks: StudioRealtimeCallbacks;
  loadProject?: (id: string) => Promise<void> | void;
}

export function useStudioRealtime(params: UseStudioRealtimeParams): void {
  const { projectId, pendingTasks, pendingTrackIds, isMountedRef, callbacks, loadProject } = params;

  // Keep latest callbacks in a ref to avoid resubscribing on every render.
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const loadProjectRef = useRef(loadProject);
  loadProjectRef.current = loadProject;

  useEffect(() => {
    if (!projectId) return;
    if (pendingTasks.length === 0) return;

    logger.info("Subscribing to pending tasks", { count: pendingTasks.length });

    const taskSubs = pendingTasks.map(({ trackId, taskId }) =>
      subscribeToPendingTaskComplete(taskId, (newData) => {
        if (!isMountedRef.current) return;
        if (newData.status === "completed" && newData.audio_clips) {
          try {
            const clips =
              typeof newData.audio_clips === "string" ? JSON.parse(newData.audio_clips) : newData.audio_clips;
            if (Array.isArray(clips) && clips.length > 0) {
              const versions = (clips as Array<Record<string, unknown>>).map(
                (clip: Record<string, unknown>, idx: number) => ({
                  label: String.fromCharCode(65 + idx),
                  audioUrl: clip.audio_url as string,
                  duration: (clip.duration_seconds as number) || 180,
                }),
              );
              cbRef.current.onTaskCompleted({ trackId, taskId, versions });
            }
          } catch (err) {
            logger.error("Failed to parse audio clips", err);
          }
        } else if (newData.status === "failed") {
          cbRef.current.onTaskFailed({ trackId, taskId });
        }
      }),
    );

    const projectSub = subscribeToStudioProject(projectId, (newData) => {
      if (!isMountedRef.current) return;
      const newTracks = newData?.tracks as StudioTrack[] | undefined;
      if (newTracks) {
        const resolvedTracks = newTracks.filter((t) => t.status === "ready" && pendingTrackIds.has(t.id));
        if (resolvedTracks.length > 0 && loadProjectRef.current) {
          void loadProjectRef.current(projectId);
        }
        cbRef.current.onProjectTracksUpdated(newTracks);
      }
    });

    return () => {
      taskSubs.forEach((sub) => sub.unsubscribe());
      projectSub.unsubscribe();
    };
  }, [projectId, pendingTasks, pendingTrackIds, isMountedRef]);
}