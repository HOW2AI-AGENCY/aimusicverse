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

/**
 * Fetch minimal stems metadata (id + stem_type) for a given track,
 * filtered by the provided stem type list.
 */
export async function fetchTrackStemsByTypes(trackId: string, stemTypes: string[]) {
  const { data, error } = await supabase
    .from("track_stems")
    .select("id, stem_type")
    .eq("track_id", trackId)
    .in("stem_type", stemTypes);

  return { data, error };
}

/**
 * Fetch a single stem by track_id + stem_type.
 */
export async function fetchTrackStemByType(trackId: string, stemType: string) {
  const { data, error } = await supabase
    .from("track_stems")
    .select("id")
    .eq("track_id", trackId)
    .eq("stem_type", stemType)
    .maybeSingle();
  return { data, error };
}

/**
 * Fetch latest transcription for a specific stem id.
 */
export async function fetchLatestStemTranscription(stemId: string) {
  const { data, error } = await supabase
    .from("stem_transcriptions")
    .select("*")
    .eq("stem_id", stemId)
    .order("created_at", { ascending: false })
    .limit(1);
  return { data, error };
}

/**
 * Fetch cached transcription_data on a track_versions row (if any).
 */
export async function fetchVersionTranscriptionData(versionId: string) {
  const { data, error } = await supabase
    .from("track_versions")
    .select("transcription_data")
    .eq("id", versionId)
    .maybeSingle();
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

/**
 * Fetch the slim status of a generation task by its suno_task_id column.
 * Returns null if not found.
 */
export async function fetchGenerationTaskBySunoId(sunoTaskId: string) {
  const { data, error } = await supabase
    .from("generation_tasks")
    .select("status, received_clips, expected_clips")
    .eq("suno_task_id", sunoTaskId)
    .maybeSingle();
  return { data, error };
}

/**
 * Subscribe to realtime updates for a generation task identified by suno_task_id.
 * Returns an object with `unsubscribe()` matching the supabase RealtimeChannel shape.
 */
export function subscribeToGenerationTaskBySunoId(
  sunoTaskId: string,
  callback: (task: { status: string; received_clips: number | null; expected_clips: number | null }) => void,
) {
  const channel = supabase
    .channel(`task-${sunoTaskId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "generation_tasks",
        filter: `suno_task_id=eq.${sunoTaskId}`,
      },
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Edge function return type is heterogeneous; callers narrow via service layer
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

/**
 * Invoke suno-extend edge function (track continuation / intro insertion).
 */
export async function invokeSunoExtend(payload: {
  audioId: string;
  prompt: string;
  continueAt: number;
  model?: string;
}) {
  const { data, error } = await supabase.functions.invoke("suno-extend", { body: payload });
  return { data, error };
}

/**
 * Invoke suno-music-extend edge function (track-aware extension with full custom params).
 */
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

// ============= SFX Generator =============

export async function invokeGenerateSfx(payload: { prompt: string; duration: number }) {
  const { data, error } = await supabase.functions.invoke("generate-sfx", { body: payload });
  return { data, error };
}

// ============= Telegram Notifications =============

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

// ============= Instrumental Generator =============

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

export async function invokeAnalyzeTrackContext(payload: { audioUrl: string; trackId?: string }) {
  const { data, error } = await supabase.functions.invoke("analyze-track-context", { body: payload });
  return { data, error };
}

export async function invokeMusicgenGenerate(payload: { prompt: string; duration: number; model?: string }) {
  const { data, error } = await supabase.functions.invoke("musicgen-generate", { body: payload });
  return { data, error };
}

// ============= Section Replacement History =============

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

/**
 * Invoke suno-remix edge function (generate a remix of an existing track in a new style).
 */
export async function invokeSunoRemix(payload: {
  audioId: string;
  prompt: string;
  style: string;
  title: string;
  instrumental: boolean;
  model?: string;
}) {
  const { data, error } = await supabase.functions.invoke("suno-remix", { body: payload });
  return { data, error };
}

// ============= Add Instrumental / Vocals =============

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

// ============= Upload Cover / Extend (Suno file uploads) =============

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

// ============= MIDI Export =============

export async function invokeExportMidi(payload: {
  notes: unknown[];
  bpm: number;
  timeSignature: string;
  trackName: string;
}) {
  const { data, error } = await supabase.functions.invoke("export-midi", { body: payload });
  return { data, error };
}

// ============= Section Replacement Realtime =============

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
      {
        event: "*",
        schema: "public",
        table: "generation_tasks",
        filter: `track_id=eq.${trackId}`,
      },
      (payload) => {
        const incoming = payload.new as ReplacementTask;
        if (incoming?.generation_mode === "replace_section") {
          callback(incoming);
        }
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// ============= Stem Transcriptions =============

export async function fetchStemTranscriptions(filter: { trackId?: string; stemId?: string }) {
  let query = supabase.from("stem_transcriptions").select("*");
  if (filter.trackId) query = query.eq("track_id", filter.trackId);
  if (filter.stemId) query = query.eq("stem_id", filter.stemId);
  const { data, error } = await query.order("created_at", { ascending: false });
  return { data, error };
}

/**
 * Fetch stem transcriptions by an explicit list of stem ids using `in`.
 */
export async function fetchStemTranscriptionsByStemIds(stemIds: string[]) {
  const { data, error } = await supabase.from("stem_transcriptions").select("*").in("stem_id", stemIds);
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
  params: { userId: string; name: string; sourceTrackId?: string; description?: string } | Record<string, unknown>,
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

/**
 * Subscribe to realtime updates for a generation_tasks row by suno_task_id.
 * Callback receives the full row (including audio_clips) so callers can parse
 * completion payloads. Returns { unsubscribe } to match the supabase shape.
 */
export function subscribeToPendingTaskComplete(
  sunoTaskId: string,
  callback: (row: Record<string, unknown>) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`task-complete-${sunoTaskId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "generation_tasks",
        filter: `suno_task_id=eq.${sunoTaskId}`,
      },
      (payload) => callback(payload.new as Record<string, unknown>),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

/**
 * Subscribe to realtime updates for a studio_projects row by id.
 * Callback receives the full row. Returns { unsubscribe }.
 */
export function subscribeToStudioProject(
  projectId: string,
  callback: (row: Record<string, unknown>) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`studio-project-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "studio_projects",
        filter: `id=eq.${projectId}`,
      },
      (payload) => callback(payload.new as Record<string, unknown>),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// ============= Studio Stem Sync =============

/**
 * Fetch minimal stems (stem_type + audio_url) for a track. Supports AbortSignal.
 */
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

/**
 * Subscribe to realtime INSERT events on track_stems filtered by track_id.
 * Returns { unsubscribe }.
 */
export function subscribeToTrackStemsInsert(
  trackId: string,
  callback: (row: { stem_type: string; audio_url: string | null }) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`studio-stems-${trackId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "track_stems",
        filter: `track_id=eq.${trackId}`,
      },
      (payload) => callback(payload.new as { stem_type: string; audio_url: string | null }),
    )
    .subscribe();
  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// ============= Stem Transcription Lookup =============

/**
 * Fetch the most recent stem_transcription row for a given stem_id (or null).
 */
export async function fetchLatestStemTranscriptionByStemId(stemId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("stem_transcriptions")
    .select("*")
    .eq("stem_id", stemId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Record<string, unknown> | null;
}

/**
 * Fetch the most recent stem_transcription row for a given track_id (or null).
 */
export async function fetchLatestStemTranscriptionByTrackId(trackId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("stem_transcriptions")
    .select("*")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Record<string, unknown> | null;
}

// ============= Transcription Edge Functions =============

export interface ReplicateMidiPayload {
  audioUrl: string;
  trackId?: string;
  stemId?: string;
  model?: string;
}

export interface ReplicateMidiResponse {
  success: boolean;
  error?: string;
  files?: { midi?: string };
  midiUrl?: string | null;
  notes?: unknown[];
  notes_count?: number;
}

export async function invokeReplicateMidiTranscription(
  payload: ReplicateMidiPayload,
): Promise<{ data: ReplicateMidiResponse | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("replicate-midi-transcription", { body: payload });
  return { data: (data as ReplicateMidiResponse | null) ?? null, error: error ? new Error(error.message) : null };
}

export interface KlangioAnalyzePayload {
  audio_url: string;
  mode?: string;
  model?: string;
  outputs?: string[];
  title?: string;
  stem_type?: string;
  user_id?: string;
}

export interface KlangioAnalyzeResponse {
  success: boolean;
  error?: string;
  files?: {
    midi?: string;
    midi_url?: string;
    midi_quant?: string;
    midi_quant_url?: string;
    mxml?: string;
    musicxml?: string;
    musicxml_url?: string;
    pdf?: string;
    pdf_url?: string;
    gp5?: string;
    gp5_url?: string;
  };
  midi_url?: string | null;
  midi_quant_url?: string | null;
  musicxml_url?: string | null;
  pdf_url?: string | null;
  gp5_url?: string | null;
  bpm?: number;
  key_detected?: string;
  key?: string;
  notes?: unknown[];
  notes_count?: number;
}

export async function invokeKlangioAnalyze(
  payload: KlangioAnalyzePayload,
): Promise<{ data: KlangioAnalyzeResponse | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke("klangio-analyze", { body: payload });
  return { data: (data as KlangioAnalyzeResponse | null) ?? null, error: error ? new Error(error.message) : null };
}
