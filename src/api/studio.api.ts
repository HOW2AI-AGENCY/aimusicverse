/**
 * Studio API Layer
 * Raw Supabase operations for studio functionality
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TrackVersion = Tables<"track_versions">;
export type TrackStem = Tables<"track_stems">;
export type GuitarRecording = Tables<"guitar_recordings">;
export type GenerationTask = Tables<"generation_tasks">;
export type TrackChangeLog = Tables<"track_change_log">;

// ============= Track Versions =============

export async function fetchTrackVersions(trackId: string) {
  const { data, error } = await supabase
    .from("track_versions")
    .select("*")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function setPrimaryVersion(trackId: string, versionId: string) {
  // First, unset all primary versions for this track
  await supabase.from("track_versions").update({ is_primary: false }).eq("track_id", trackId);

  // Set the new primary version
  const { data, error } = await supabase
    .from("track_versions")
    .update({ is_primary: true })
    .eq("id", versionId)
    .select()
    .single();

  // Update track's audio_url to match the new primary version
  if (data?.audio_url) {
    await supabase.from("tracks").update({ audio_url: data.audio_url }).eq("id", trackId);
  }

  return { data, error };
}

// ============= Track Stems =============

export async function fetchTrackStems(trackId: string) {
  const { data, error } = await supabase
    .from("track_stems")
    .select("*")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false });

  return { data, error };
}

// ============= Source Track Query =============

export async function fetchSourceTrackForStudio(trackId: string) {
  const { data, error } = await supabase
    .from("tracks")
    .select("id, lyrics, suno_task_id, suno_id")
    .eq("id", trackId)
    .maybeSingle();
  return { data, error };
}

// ============= Stem Separation =============

export async function invokeStemSeparation(params: {
  trackId: string;
  audioId: string;
  audioUrl: string;
  mode: "simple" | "detailed";
  userId: string;
}) {
  const { data, error } = await supabase.functions.invoke("suno-separate-vocals", {
    body: params,
  });

  return { data, error };
}

// ============= Section Replacement Generation =============

export async function invokeReplaceSection(params: {
  trackId: string;
  userId: string;
  taskId: string;
  audioId: string;
  startTime: number;
  endTime: number;
  prompt: string;
  tags?: string[];
  lyrics?: string;
}) {
  const { data, error } = await supabase.functions.invoke("suno-replace-section", {
    body: params,
  });

  return { data, error };
}

// ============= Replaced Sections (via generation_tasks) =============

export async function fetchReplacedSectionTasks(trackId: string) {
  const { data, error } = await supabase
    .from("generation_tasks")
    .select(
      `
      id,
      suno_task_id,
      status,
      prompt,
      created_at,
      completed_at,
      audio_clips
    `,
    )
    .eq("track_id", trackId)
    .eq("generation_mode", "replace_section")
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function fetchSectionReplacementLogs(trackId: string) {
  const [startedLogs, completedLogs] = await Promise.all([
    supabase
      .from("track_change_log")
      .select("id, created_at, metadata")
      .eq("track_id", trackId)
      .eq("change_type", "replace_section_started")
      .order("created_at", { ascending: false }),
    supabase
      .from("track_change_log")
      .select(
        `
        id,
        metadata,
        version_id,
        track_versions (
          audio_url
        )
      `,
      )
      .eq("track_id", trackId)
      .eq("change_type", "replace_section_completed")
      .order("created_at", { ascending: false }),
  ]);

  return {
    startedLogs: startedLogs.data,
    completedLogs: completedLogs.data,
    error: startedLogs.error || completedLogs.error,
  };
}

// ============= Guitar Analysis =============

export async function fetchGuitarAnalysis(trackId: string) {
  const { data, error } = await supabase.from("guitar_recordings").select("*").eq("track_id", trackId).maybeSingle();

  return { data, error };
}

// ============= Generation Tasks =============

export async function fetchGenerationTask(taskId: string) {
  const { data, error } = await supabase.from("generation_tasks").select("*").eq("id", taskId).single();

  return { data, error };
}

export function subscribeToGenerationTask(taskId: string, callback: (task: GenerationTask) => void) {
  return supabase
    .channel(`generation-task-${taskId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "generation_tasks",
        filter: `id=eq.${taskId}`,
      },
      (payload) => callback(payload.new as GenerationTask),
    )
    .subscribe();
}

// ============= Track Change Log =============

export async function logTrackActivity(params: {
  trackId: string;
  userId: string;
  changeType: string;
  changedBy: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("track_change_log").insert([
    {
      track_id: params.trackId,
      user_id: params.userId,
      change_type: params.changeType,
      changed_by: params.changedBy,
      field_name: params.fieldName,
      old_value: params.oldValue,
      new_value: params.newValue,
      metadata: params.metadata as unknown as import("@/integrations/supabase/types").Json,
    },
  ]);

  return { error };
}

/**
 * Invoke merge-stems edge function
 */
export async function invokeMergeStems(payload: Record<string, unknown>): Promise<{ data: any; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("merge-stems", { body: payload });
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Insert a track_change_log row directly (used by enhanced studio logger).
 */
export async function insertTrackChangeLog(params: {
  trackId: string;
  userId: string;
  changeType: string;
  changedBy: string;
  newValue?: string;
  versionId?: string;
}): Promise<void> {
  const { error } = await supabase.from("track_change_log").insert({
    track_id: params.trackId,
    user_id: params.userId,
    change_type: params.changeType,
    changed_by: params.changedBy,
    new_value: params.newValue,
    version_id: params.versionId,
  });
  if (error) throw new Error(error.message);
}

// ============= Stem Transcriptions =============

export async function fetchStemTranscriptions(filter: { trackId?: string; stemId?: string }) {
  let query = supabase.from("stem_transcriptions").select("*");
  if (filter.trackId) query = query.eq("track_id", filter.trackId);
  if (filter.stemId) query = query.eq("stem_id", filter.stemId);
  const { data, error } = await query.order("created_at", { ascending: false });
  return { data, error };
}

// ============= Track Version RPC =============

export async function ensureTrackVersion(params: {
  trackId: string;
  audioUrl: string;
  label?: string;
  versionType?: string;
}) {
  const { data, error } = await supabase.rpc("ensure_track_version", {
    p_track_id: params.trackId,
    p_audio_url: params.audioUrl,
    p_label: params.label,
    p_version_type: params.versionType,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

// ============= Studio Projects =============

export async function fetchStudioProject(id: string) {
  const { data, error } = await supabase.from("studio_projects").select("*").eq("id", id).single();
  return { data, error };
}

export async function createStudioProject(
  params:
    | { userId: string; name: string; sourceTrackId?: string; description?: string }
    | Record<string, unknown>,
) {
  // Normalize legacy shape to row shape
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
