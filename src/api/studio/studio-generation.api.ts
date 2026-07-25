/**
 * Studio Generation API
 * Generation tasks, section replacement, mashup/persona, SFX, instrumental
 * Extracted from studio.api.ts — Sprint 051 decomposition
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type GenerationTask = Tables<"generation_tasks">;
export type TrackChangeLog = Tables<"track_change_log">;

// Generation Tasks
export async function fetchGenerationTask(taskId: string) {
  const { data, error } = await supabase.from("generation_tasks").select("*").eq("id", taskId).single();
  return { data, error };
}

export function subscribeToGenerationTask(taskId: string, callback: (task: GenerationTask) => void) {
  return supabase
    .channel(`generation-task-${taskId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "generation_tasks", filter: `id=eq.${taskId}` },
      (payload) => callback(payload.new as GenerationTask),
    )
    .subscribe();
}

export async function fetchGenerationTaskBySunoId(sunoTaskId: string) {
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("status, received_clips, expected_clips")
    .eq("suno_task_id", sunoTaskId)
    .maybeSingle();
  return { data, error };
}

export function subscribeToGenerationTaskBySunoId(
  sunoTaskId: string,
  callback: (task: { status: string; received_clips: number | null; expected_clips: number | null }) => void,
) {
  const channel = supabase
    .channel(`task-${sunoTaskId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "generation_tasks", filter: `suno_task_id=eq.${sunoTaskId}` },
      (payload) =>
        callback(payload.new as { status: string; received_clips: number | null; expected_clips: number | null }),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// Section Replacement
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
  const { data, error } = await supabase.functions.invoke("suno-replace-section", { body: params });
  return { data, error };
}

export async function fetchReplacedSectionTasks(trackId: string) {
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("id, suno_task_id, status, prompt, created_at, completed_at, audio_clips")
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
      .select("id, metadata, version_id, track_versions (audio_url)")
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

export interface SectionReplacementLog {
  id: string;
  change_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  version_id: string | null;
}

export async function fetchSectionReplacementsHistory(trackId: string): Promise<SectionReplacementLog[]> {
  const { data, error } = await supabase
    .from("track_change_log")
    .select("id, change_type, metadata, created_at, version_id")
    .eq("track_id", trackId)
    .eq("change_type", "section_replacement")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error || !data) return [];
  return data as SectionReplacementLog[];
}

// Track Change Log
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

export type MergeStemsResponse = { audioUrl: string };

export async function invokeMergeStems(
  payload: Record<string, unknown>,
): Promise<{ data: MergeStemsResponse | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke<MergeStemsResponse>("merge-stems", {
    body: payload,
  });
  return { data: data ?? null, error: error ? new Error(error.message) : null };
}

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

// Suno Operations
export async function invokeSunoExtend(payload: {
  audioId: string;
  prompt: string;
  continueAt: number;
  model?: string;
}) {
  const { data, error } = await supabase.functions.invoke("suno-extend", { body: payload });
  return { data, error };
}

export async function invokeSunoMusicExtend(payload: {
  sourceTrackId: string;
  defaultParamFlag?: boolean;
  continueAt?: number;
  prompt?: string;
  style?: string;
  title?: string;
  model?: string;
  negativeTags?: string;
  vocalGender?: string;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  projectId?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-music-extend", { body: payload });
  return { data, error };
}

export async function invokeGenerateSfx(payload: { prompt: string; duration: number }) {
  const { data, error } = await supabase.functions.invoke("generate-sfx", { body: payload });
  return { data, error };
}

export async function invokeAnalyzeTrackContext(payload: { audioUrl: string; trackId?: string }) {
  const { data, error } = await supabase.functions.invoke("analyze-track-context", { body: payload });
  return { data, error };
}

export interface TrackContextAnalysis {
  bpm?: number;
  key?: string;
  scale?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  suggestedInstruments?: string[];
  style_description?: string;
}

export async function invokeMusicgenGenerate(payload: { prompt: string; duration: number; model?: string }) {
  const { data, error } = await supabase.functions.invoke("musicgen-generate", { body: payload });
  return { data, error };
}

export async function invokeSunoRemix(payload: {
  audioId: string;
  /** Direct audio URL of the active version — preferred reference source. */
  audioUrl?: string | null;
  prompt: string;
  style: string;
  title: string;
  instrumental: boolean;
  model?: string;
  audioWeight?: number;
  negativeTags?: string;
  vocalGender?: string;
  styleWeight?: number;
  weirdnessConstraint?: number;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-remix", { body: payload });
  return { data, error };
}

export async function invokeAddInstrumental(payload: {
  track_id?: string;
  audio_url?: string | null;
  style: string;
  title?: string;
  negative_tags?: string;
  audio_weight?: number;
  style_weight?: number;
  weirdness_constraint?: number;
  model?: string;
  action?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-add-instrumental", { body: payload });
  return { data, error };
}

export async function invokeAddVocals(payload: {
  track_id: string;
  audio_url?: string | null;
  style?: string;
  title?: string;
  negative_tags?: string;
  audio_weight?: number;
  style_weight?: number;
  action?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-add-vocals", { body: payload });
  return { data, error };
}

// Upload Cover / Extend
export interface SunoUploadAudioFile {
  name: string;
  type: string;
  data: string | ArrayBuffer | null;
}

export async function invokeSunoUploadCover(payload: {
  audioFile: SunoUploadAudioFile;
  audioDuration: number;
  model?: string;
  customMode?: boolean;
  instrumental?: boolean;
  style?: string;
  title?: string;
  prompt?: string;
  negativeTags?: string;
  vocalGender?: string;
  projectId?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-upload-cover", { body: payload });
  return { data, error };
}

export async function invokeSunoUploadExtend(payload: {
  audioFile: SunoUploadAudioFile;
  audioDuration: number;
  model?: string;
  customMode?: boolean;
  instrumental?: boolean;
  style?: string;
  title?: string;
  prompt?: string;
  continueAt: number;
  negativeTags?: string;
  vocalGender?: string;
  projectId?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-upload-extend", { body: payload });
  return { data, error };
}

// Mashup / Persona / File Upload (Sprint 052)
export async function invokeSunoMashup(payload: {
  trackAId: string;
  trackBId: string;
  customMode: boolean;
  instrumental?: boolean;
  prompt?: string;
  style?: string;
  title?: string;
  model?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  projectId?: string;
  studioProjectId?: string;
  openInStudio?: boolean;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-mashup", { body: payload });
  return { data, error };
}

export async function invokeSunoPersona(payload: {
  trackId: string;
  name: string;
  description?: string;
  model?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-persona", { body: payload });
  return { data, error };
}

export async function invokeSunoFileUpload(payload: {
  action: "base64" | "url";
  filename?: string;
  fileBase64?: string;
  fileUrl?: string;
  contentType?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("suno-file-upload", { body: payload });
  return { data, error };
}

// Telegram Notifications
export async function invokeSendTelegramNotification(payload: {
  type: string;
  chat_id: string | number;
  document_url?: string;
  document_type?: string;
  filename?: string;
  track_title?: string;
  [key: string]: unknown;
}) {
  const { data, error } = await supabase.functions.invoke("send-telegram-notification", { body: payload });
  return { data, error };
}
