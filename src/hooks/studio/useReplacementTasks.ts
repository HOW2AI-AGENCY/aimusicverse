/**
 * useReplacementTasks - Subscribes to active section-replacement generation tasks.
 *
 * Returns a list of tasks (most recent first) for a given track, kept in sync
 * with the realtime generation_tasks table.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  fetchReplacementTasksForTrack,
  subscribeToReplacementTasks,
  type ReplacementTaskSummary,
} from "@/services/studio.service";
import { queryKeys } from "@/lib/queryKeys";

const MAX_TASKS = 5;

export function useReplacementTasks(trackId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.studio.replacedSections(trackId);

  const query = useQuery<ReplacementTaskSummary[]>({
    queryKey,
    queryFn: () => fetchReplacementTasksForTrack(trackId),
    staleTime: 30_000,
    enabled: Boolean(trackId),
  });

  useEffect(() => {
    if (!trackId) return undefined;
    const subscription = subscribeToReplacementTasks(trackId, (task) => {
      queryClient.setQueryData<ReplacementTaskSummary[]>(queryKey, (prev) => {
        const list = prev ?? [];
        const existing = list.find((t) => t.id === task.id);
        if (existing) {
          return list.map((t) => (t.id === task.id ? task : t));
        }
        return [task, ...list].slice(0, MAX_TASKS);
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [trackId, queryClient, queryKey]);

  return query;
}
