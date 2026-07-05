/**
 * Studio Realtime API
 * All realtime subscriptions, replacement tasks, studio projects
 * Extracted from studio.api.ts — Sprint 051 decomposition
 */

import { supabase } from "@/integrations/supabase/client";

// Replacement Tasks
export interface ReplacementTask {
  id: string;
  status: string;
  created_at: string;
  error_message?: string | null;
  generation_mode?: string;
}

export async function fetchReplacementTasks(trackId: string): Promise<ReplacementTask[]> {
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("id, status, created_at, error_message, generation_mode")
    .eq("track_id", trackId)
    .eq("generation_mode", "replace_section")
    .in("status", ["pending", "processing", "completed", "failed"])
    .order("created_at", { ascending: false })
    .limit(5);
  if (error || !data) return [];
  return data as ReplacementTask[];
}

export function subscribeToReplacementTasks(
  trackId: string,
  callback: (task: ReplacementTask) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`replacement-tasks-${trackId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "generation_tasks", filter: `track_id=eq.${trackId}` },
      (payload) => {
        const incoming = payload.new as ReplacementTask;
        if (incoming?.generation_mode === "replace_section") callback(incoming);
      },
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// Pending Task Complete
export function subscribeToPendingTaskComplete(
  sunoTaskId: string,
  callback: (row: Record<string, unknown>) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`task-complete-${sunoTaskId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "generation_tasks", filter: `suno_task_id=eq.${sunoTaskId}` },
      (payload) => callback(payload.new as Record<string, unknown>),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// Studio Projects
export async function fetchStudioProject(id: string) {
  const { data, error } = await supabase.from("studio_projects").select("*").eq("id", id).single();
  return { data, error };
}

export async function createStudioProject(
  params: { userId: string; name: string; sourceTrackId?: string; description?: string } | Record<string, unknown>,
) {
  const row =
    "userId" in params
      ? {
          user_id: (params as { userId: string }).userId,
          name: (params as { name: string }).name,
          source_track_id: (params as { sourceTrackId?: string }).sourceTrackId ?? null,
          description: (params as { description?: string }).description ?? null,
        }
      : (params as Record<string, unknown>);
  const { data, error } = await supabase
    .from("studio_projects")
    .insert(row as never)
    .select()
    .single();
  return { data, error };
}

export async function updateStudioProject(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("studio_projects")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteStudioProject(id: string) {
  const { error } = await supabase.from("studio_projects").delete().eq("id", id);
  return { error };
}

export function subscribeToStudioProject(
  projectId: string,
  callback: (row: Record<string, unknown>) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`studio-project-${projectId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "studio_projects", filter: `id=eq.${projectId}` },
      (payload) => callback(payload.new as Record<string, unknown>),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// Studio Stem Sync
export async function fetchTrackStemsMinimal(
  trackId: string,
  signal?: AbortSignal,
): Promise<Array<{ stem_type: string; audio_url: string | null }>> {
  let query = supabase.from("track_stems").select("stem_type, audio_url").eq("track_id", trackId);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Array<{ stem_type: string; audio_url: string | null }>;
}

export function subscribeToTrackStemsInsert(
  trackId: string,
  callback: (row: { stem_type: string; audio_url: string | null }) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`studio-stems-${trackId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "track_stems", filter: `track_id=eq.${trackId}` },
      (payload) => callback(payload.new as { stem_type: string; audio_url: string | null }),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}
