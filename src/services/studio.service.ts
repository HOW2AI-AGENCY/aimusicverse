/**
 * Studio Service Layer
 * Business logic for studio operations
 */

import * as studioApi from "@/api/studio.api";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface SectionBounds {
  start: number;
  end: number;
}

export interface DetectedSection {
  label: string;
  type: "intro" | "verse" | "chorus" | "bridge" | "outro" | "instrumental" | "unknown";
  start: number;
  end: number;
  lyrics?: string;
}

export interface ReplacedSection {
  start: number;
  end: number;
  taskId: string;
  createdAt: string;
  audioUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

// ============= Section Detection Business Logic =============

export function inferSectionType(
  position: number,
  total: number,
  duration: number,
  label?: string,
): DetectedSection["type"] {
  // Check label first
  if (label) {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("intro")) return "intro";
    if (lowerLabel.includes("verse")) return "verse";
    if (lowerLabel.includes("chorus") || lowerLabel.includes("hook")) return "chorus";
    if (lowerLabel.includes("bridge")) return "bridge";
    if (lowerLabel.includes("outro") || lowerLabel.includes("end")) return "outro";
    if (lowerLabel.includes("instrumental") || lowerLabel.includes("solo")) return "instrumental";
  }

  // Infer from position
  if (position === 0 && duration < 15) return "intro";
  if (position === total - 1 && duration < 20) return "outro";
  if (position % 2 === 0) return "verse";
  return "chorus";
}

export function getSectionColor(type: DetectedSection["type"]): string {
  const colors: Record<DetectedSection["type"], string> = {
    intro: "hsl(var(--chart-1))",
    verse: "hsl(var(--chart-2))",
    chorus: "hsl(var(--chart-3))",
    bridge: "hsl(var(--chart-4))",
    outro: "hsl(var(--chart-5))",
    instrumental: "hsl(var(--muted-foreground))",
    unknown: "hsl(var(--muted-foreground))",
  };
  return colors[type] || colors.unknown;
}

export function createFallbackSections(duration: number): DetectedSection[] {
  if (duration <= 0) return [];

  const sections: DetectedSection[] = [];

  // Short tracks (< 60s): simple structure
  if (duration < 60) {
    const introDuration = Math.min(10, duration * 0.1);
    const outroDuration = Math.min(10, duration * 0.1);
    const mainDuration = duration - introDuration - outroDuration;

    if (introDuration > 3) {
      sections.push({ label: "Intro", type: "intro", start: 0, end: introDuration });
    }

    sections.push({
      label: "Main",
      type: "verse",
      start: introDuration,
      end: introDuration + mainDuration,
    });

    if (outroDuration > 3) {
      sections.push({
        label: "Outro",
        type: "outro",
        start: duration - outroDuration,
        end: duration,
      });
    }

    return sections;
  }

  // Standard song structure
  const introDuration = Math.min(15, duration * 0.08);
  const outroDuration = Math.min(20, duration * 0.1);
  const bodyDuration = duration - introDuration - outroDuration;

  // Intro
  sections.push({ label: "Intro", type: "intro", start: 0, end: introDuration });

  // Body sections (verse-chorus pattern)
  const sectionDuration = bodyDuration / 4;
  let currentTime = introDuration;

  sections.push({
    label: "Verse 1",
    type: "verse",
    start: currentTime,
    end: currentTime + sectionDuration,
  });
  currentTime += sectionDuration;

  sections.push({
    label: "Chorus",
    type: "chorus",
    start: currentTime,
    end: currentTime + sectionDuration,
  });
  currentTime += sectionDuration;

  sections.push({
    label: "Verse 2",
    type: "verse",
    start: currentTime,
    end: currentTime + sectionDuration,
  });
  currentTime += sectionDuration;

  sections.push({
    label: "Final Chorus",
    type: "chorus",
    start: currentTime,
    end: duration - outroDuration,
  });

  // Outro
  sections.push({
    label: "Outro",
    type: "outro",
    start: duration - outroDuration,
    end: duration,
  });

  return sections;
}

// ============= Replaced Sections Parsing =============

export async function fetchReplacedSections(trackId: string): Promise<ReplacedSection[]> {
  const [tasksResult, logsResult] = await Promise.all([
    studioApi.fetchReplacedSectionTasks(trackId),
    studioApi.fetchSectionReplacementLogs(trackId),
  ]);

  if (tasksResult.error || logsResult.error) {
    logger.error("Error fetching replaced sections", tasksResult.error || logsResult.error);
    return [];
  }

  const { data: tasks } = tasksResult;
  const { startedLogs, completedLogs } = logsResult;

  const sections: ReplacedSection[] = [];

  for (const task of tasks || []) {
    const matchingStartLog = startedLogs?.find((log) => {
      const metadata = log.metadata as { taskId?: string } | null;
      return metadata?.taskId === task.suno_task_id;
    });

    const startMetadata = matchingStartLog?.metadata as {
      infillStartS?: number;
      infillEndS?: number;
    } | null;

    if (startMetadata?.infillStartS !== undefined && startMetadata?.infillEndS !== undefined) {
      let audioUrl: string | undefined;

      const matchingCompletedLog = completedLogs?.find((log) => {
        const metadata = log.metadata as { taskId?: string } | null;
        return metadata?.taskId === task.suno_task_id;
      });

      audioUrl = (matchingCompletedLog?.track_versions as { audio_url?: string } | null)?.audio_url;

      if (!audioUrl && task.status === "completed" && task.audio_clips) {
        try {
          const clips = typeof task.audio_clips === "string" ? JSON.parse(task.audio_clips) : task.audio_clips;
          audioUrl = clips?.[0]?.source_audio_url || clips?.[0]?.audio_url;
        } catch {
          // Ignore parse errors
        }
      }

      sections.push({
        start: startMetadata.infillStartS,
        end: startMetadata.infillEndS,
        taskId: task.id,
        createdAt: task.created_at || "",
        audioUrl,
        status: task.status as ReplacedSection["status"],
      });
    }
  }

  return sections;
}

// ============= Section Replacement =============

export async function replaceSection(params: {
  trackId: string;
  taskId: string;
  audioId: string;
  section: SectionBounds;
  prompt: string;
  tags?: string[];
  lyrics?: string;
}): Promise<{ taskId: string | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { taskId: null, error: new Error("Not authenticated") };
    }

    const { data, error } = await studioApi.invokeReplaceSection({
      trackId: params.trackId,
      userId: user.id,
      taskId: params.taskId,
      audioId: params.audioId,
      startTime: params.section.start,
      endTime: params.section.end,
      prompt: params.prompt,
      tags: params.tags,
      lyrics: params.lyrics,
    });

    if (error) {
      return { taskId: null, error: new Error(error.message) };
    }

    return { taskId: data?.taskId || null, error: null };
  } catch (err) {
    logger.error("Error in replaceSection", err);
    return { taskId: null, error: err as Error };
  }
}

// ============= Source Track =============

export type SourceTrackMetadata = {
  id: string;
  lyrics: string | null;
  suno_task_id: string | null;
  suno_id: string | null;
};

export async function fetchSourceTrack(trackId: string): Promise<SourceTrackMetadata | null> {
  const { data, error } = await studioApi.fetchSourceTrackForStudio(trackId);
  if (error || !data) return null;
  return data as SourceTrackMetadata;
}

// ============= Stem Transcriptions =============

export type StemMetadata = { id: string; stem_type: string };

export type StemTranscriptionRow = {
  id: string;
  track_id: string;
  stem_id: string | null;
  midi_url?: string | null;
  pdf_url?: string | null;
  gp5_url?: string | null;
  mxml_url?: string | null;
  notes?: unknown;
  notes_count?: number | null;
  bpm?: number | string | null;
  key_detected?: string | null;
  duration_seconds?: number | string | null;
  created_at?: string;
  [key: string]: unknown;
};

/**
 * Fetch minimal stem metadata (id + stem_type) for a track, filtered by stem type list.
 */
export async function fetchStemsByTypes(trackId: string, stemTypes: string[]): Promise<StemMetadata[]> {
  const { data, error } = await studioApi.fetchTrackStemsByTypes(trackId, stemTypes);
  if (error || !data) return [];
  return (data as StemMetadata[]) ?? [];
}

/**
 * Fetch the most-recent stem transcription for a track (used when no stems exist
 * and we want the main-track transcription).
 */
export async function fetchMainTrackTranscription(trackId: string): Promise<StemTranscriptionRow | null> {
  const { data, error } = await studioApi.fetchStemTranscriptions({ trackId });
  if (error || !data || data.length === 0) return null;
  return data[0] as StemTranscriptionRow;
}

/**
 * Fetch stem transcriptions by stem id list.
 */
export async function fetchTranscriptionsByStemIds(stemIds: string[]): Promise<StemTranscriptionRow[]> {
  if (stemIds.length === 0) return [];
  const { data, error } = await studioApi.fetchStemTranscriptionsByStemIds(stemIds);
  if (error || !data) return [];
  return data as StemTranscriptionRow[];
}

// ============= Studio Notation Panel Transcription Resolution =============

export interface ResolvedTranscription {
  id: string;
  midi_url?: string | null;
  mxml_url?: string | null;
  gp5_url?: string | null;
  pdf_url?: string | null;
  bpm?: number | null;
  key_detected?: string | null;
  time_signature?: string | null;
  notes_count?: number | null;
  notes?: unknown[] | null;
  [key: string]: unknown;
}

export async function fetchVersionTranscription(versionId: string): Promise<ResolvedTranscription | null> {
  const { data, error } = await studioApi.fetchVersionTranscriptionData(versionId);
  if (error || !data) return null;
  const td = data.transcription_data as Record<string, unknown> | null;
  if (!td || typeof td !== "object") return null;
  return td as unknown as ResolvedTranscription;
}

export async function fetchStemTranscriptionForTrackType(
  trackId: string,
  stemType: string,
): Promise<ResolvedTranscription | null> {
  const stem = await studioApi.fetchTrackStemByType(trackId, stemType);
  if (stem.error || !stem.data) return null;
  const trans = await studioApi.fetchLatestStemTranscription((stem.data as { id: string }).id);
  if (trans.error || !trans.data || trans.data.length === 0) return null;
  return trans.data[0] as ResolvedTranscription;
}

export async function fetchLatestTranscriptionForTrackOrStem(
  trackId: string | null | undefined,
  fallbackStemId: string,
): Promise<ResolvedTranscription | null> {
  const filter: { trackId?: string; stemId?: string } = trackId ? { trackId } : { stemId: fallbackStemId };
  const { data, error } = await studioApi.fetchStemTranscriptions(filter);
  if (error || !data || data.length === 0) return null;
  return data[0] as ResolvedTranscription;
}

// ============= MIDI Export =============

export interface ExportMidiParams {
  notes: unknown[];
  bpm: number;
  timeSignature: string;
  trackName: string;
}

export interface ExportMidiResult {
  data: string; // base64-encoded MIDI
  success: boolean;
  error?: string;
}

export async function exportMidi(params: ExportMidiParams): Promise<ExportMidiResult> {
  const { data, error } = await studioApi.invokeExportMidi(params);
  if (error) throw new Error(error.message);
  return (data ?? {}) as ExportMidiResult;
}

// ============= Stem Separation =============

export async function separateStems(
  trackId: string,
  audioId: string,
  audioUrl: string,
  mode: "simple" | "detailed",
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    const { error } = await studioApi.invokeStemSeparation({
      trackId,
      audioId,
      audioUrl,
      mode,
      userId: user.id,
    });

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    logger.error("Error in separateStems", err);
    return { success: false, error: err as Error };
  }
}

// ============= Version Management =============

export async function switchToVersion(
  trackId: string,
  versionId: string,
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await studioApi.setPrimaryVersion(trackId, versionId);

  if (error) {
    logger.error("Error switching version", error);
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, error: null };
}

// ============= Activity Logging =============

export async function logStudioActivity(
  trackId: string,
  activityType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await studioApi.logTrackActivity({
      trackId,
      userId: user.id,
      changeType: activityType,
      changedBy: "studio",
      metadata,
    });
  } catch (err) {
    logger.warn("Failed to log studio activity", { error: err });
  }
}

// ============= Track Extension =============

export async function extendTrack(params: {
  audioId: string;
  prompt: string;
  continueAt: number;
  model?: string;
}): Promise<{ error: Error | null }> {
  try {
    const { error } = await studioApi.invokeSunoExtend({
      audioId: params.audioId,
      prompt: params.prompt,
      continueAt: params.continueAt,
      model: params.model ?? "chirp-v4",
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    logger.error("Error in extendTrack", err);
    return { error: err as Error };
  }
}

export interface ExtendMusicParams {
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
}

export async function extendMusic(params: ExtendMusicParams): Promise<{ data: unknown; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeSunoMusicExtend({
      sourceTrackId: params.sourceTrackId,
      defaultParamFlag: params.defaultParamFlag,
      continueAt: params.continueAt,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      model: params.model,
      negativeTags: params.negativeTags,
      vocalGender: params.vocalGender,
      styleWeight: params.styleWeight,
      weirdnessConstraint: params.weirdnessConstraint,
      audioWeight: params.audioWeight,
      projectId: params.projectId,
    });
    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err) {
    logger.error("Error in extendMusic", err);
    return { data: null, error: err as Error };
  }
}

// ============= SFX Generation =============

export async function generateSfx(params: { prompt: string; duration: number }): Promise<string> {
  const { data, error } = await studioApi.invokeGenerateSfx({
    prompt: params.prompt,
    duration: params.duration,
  });
  if (error) throw new Error(error.message);
  if (!data?.success || !data?.audioUrl) {
    throw new Error(data?.error || "Failed to generate SFX");
  }
  return data.audioUrl as string;
}

// ============= Add Instrumental / Vocals =============

export interface AddInstrumentalParams {
  trackId?: string;
  audioUrl?: string | null;
  style: string;
  title?: string;
  negativeTags?: string;
  audioWeight?: number;
  styleWeight?: number;
  weirdnessConstraint?: number;
  model?: string;
}

export async function addInstrumental(
  params: AddInstrumentalParams,
): Promise<{ trackId: string | null; taskId: string | null; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeAddInstrumental({
      track_id: params.trackId,
      audio_url: params.audioUrl,
      style: params.style,
      title: params.title,
      negative_tags: params.negativeTags,
      audio_weight: params.audioWeight,
      style_weight: params.styleWeight,
      weirdness_constraint: params.weirdnessConstraint,
      model: params.model,
      action: "add_instrumental",
    });
    if (error) return { trackId: null, taskId: null, error: new Error(error.message) };
    const payload = data as { trackId?: string; taskId?: string; track?: { id?: string } } | null;
    return {
      trackId: payload?.trackId || payload?.track?.id || null,
      taskId: payload?.taskId || null,
      error: null,
    };
  } catch (err) {
    logger.error("Error in addInstrumental", err);
    return { trackId: null, taskId: null, error: err as Error };
  }
}

export interface AddVocalsParams {
  trackId: string;
  audioUrl?: string | null;
  style?: string;
  title?: string;
  negativeTags?: string;
  audioWeight?: number;
  styleWeight?: number;
  weirdnessConstraint?: number;
  model?: string;
  prompt?: string;
  customMode?: boolean;
  projectId?: string | null;
  vocalGender?: string;
}

export async function addVocals(
  params: AddVocalsParams,
): Promise<{ trackId: string | null; taskId: string | null; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeAddVocals({
      track_id: params.trackId,
      audio_url: params.audioUrl,
      style: params.style,
      title: params.title,
      negative_tags: params.negativeTags,
      audio_weight: params.audioWeight,
      style_weight: params.styleWeight,
      weirdness_constraint: params.weirdnessConstraint,
      model: params.model,
      prompt: params.prompt,
      custom_mode: params.customMode,
      project_id: params.projectId,
      vocal_gender: params.vocalGender,
      action: "add_vocals",
    });
    if (error) return { trackId: null, taskId: null, error: new Error(error.message) };
    const payload = data as { trackId?: string; taskId?: string; track?: { id?: string } } | null;
    const newTrackId = payload?.trackId || payload?.track?.id || null;
    const taskId = payload?.taskId || null;
    return { trackId: newTrackId, taskId, error: null };
  } catch (err) {
    logger.error("Error in addVocals", err);
    return { trackId: null, taskId: null, error: err as Error };
  }
}

// ============= Upload Cover / Extend =============

export interface SunoUploadParams {
  audioFile: studioApi.SunoUploadAudioFile;
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
}

export interface SunoUploadExtendParams extends SunoUploadParams {
  continueAt: number;
}

export async function sunoUploadCover(params: SunoUploadParams): Promise<{ data: unknown; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeSunoUploadCover({
      audioFile: params.audioFile,
      audioDuration: params.audioDuration,
      model: params.model,
      customMode: params.customMode,
      instrumental: params.instrumental,
      style: params.style,
      title: params.title,
      prompt: params.prompt,
      negativeTags: params.negativeTags,
      vocalGender: params.vocalGender,
      projectId: params.projectId,
    });
    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err) {
    logger.error("Error in sunoUploadCover", err);
    return { data: null, error: err as Error };
  }
}

export async function sunoUploadExtend(
  params: SunoUploadExtendParams,
): Promise<{ data: unknown; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeSunoUploadExtend({
      audioFile: params.audioFile,
      audioDuration: params.audioDuration,
      model: params.model,
      customMode: params.customMode,
      instrumental: params.instrumental,
      style: params.style,
      title: params.title,
      prompt: params.prompt,
      continueAt: params.continueAt,
      negativeTags: params.negativeTags,
      vocalGender: params.vocalGender,
      projectId: params.projectId,
    });
    if (error) return { data: null, error: new Error(error.message) };
    return { data, error: null };
  } catch (err) {
    logger.error("Error in sunoUploadExtend", err);
    return { data: null, error: err as Error };
  }
}

// ============= Sprint 052 — Suno Mashup / Persona / File Upload =============

// type alias (не interface): даёт implicit index signature для payload-сигнатуры studioApi.invokeSunoMashup
export type SunoMashupParams = {
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
};

export interface SunoMashupResult {
  taskId: string;
  trackId: string;
}

export async function sunoMashup(
  params: SunoMashupParams,
): Promise<{ data: SunoMashupResult | null; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeSunoMashup(params);
    if (error) return { data: null, error: new Error(error.message) };
    const payload = data as { taskId?: string; trackId?: string } | null;
    if (!payload?.taskId || !payload?.trackId) {
      return { data: null, error: new Error("Mashup edge returned no taskId/trackId") };
    }
    return { data: payload as SunoMashupResult, error: null };
  } catch (err) {
    logger.error("Error in sunoMashup", err);
    return { data: null, error: err as Error };
  }
}

// type alias (не interface): даёт implicit index signature для payload-сигнатуры studioApi.invokeSunoPersona
export type SunoPersonaParams = {
  trackId: string;
  name: string;
  description?: string;
  model?: string;
};

export interface SunoPersonaResult {
  personaId: string;
  sunoTaskId: string | null;
  sunoPersonaId: string | null;
  status: "pending" | "ready" | "failed";
}

export async function sunoPersona(
  params: SunoPersonaParams,
): Promise<{ data: SunoPersonaResult | null; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeSunoPersona(params);
    if (error) return { data: null, error: new Error(error.message) };
    const payload = data as SunoPersonaResult | null;
    if (!payload?.personaId) {
      return { data: null, error: new Error("Persona edge returned no personaId") };
    }
    return { data: payload, error: null };
  } catch (err) {
    logger.error("Error in sunoPersona", err);
    return { data: null, error: err as Error };
  }
}

export interface SunoFileUploadParams {
  filename: string;
  /** Raw audio bytes as a base64 string (with or without data: URL prefix). */
  fileBase64: string;
  contentType?: string;
}

export interface SunoFileUploadResult {
  file_url: string;
  expires_in_days: number;
}

export async function sunoFileUpload(
  params: SunoFileUploadParams,
): Promise<{ data: SunoFileUploadResult | null; error: Error | null }> {
  try {
    const { data, error } = await studioApi.invokeSunoFileUpload({
      action: "base64",
      filename: params.filename,
      fileBase64: params.fileBase64,
      contentType: params.contentType ?? "audio/mpeg",
    });
    if (error) return { data: null, error: new Error(error.message) };
    const payload = data as SunoFileUploadResult | null;
    if (!payload?.file_url) {
      return { data: null, error: new Error("File upload edge returned no file_url") };
    }
    return { data: payload, error: null };
  } catch (err) {
    logger.error("Error in sunoFileUpload", err);
    return { data: null, error: err as Error };
  }
}

// ============= Telegram Notifications (from midi/notes card) =============

export interface TelegramDocumentSharePayload {
  chat_id: string | number;
  document_url: string;
  document_type: string;
  filename: string;
  track_title?: string;
  [key: string]: unknown;
}

export async function sendTelegramDocumentShare(
  payload: TelegramDocumentSharePayload,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await studioApi.invokeSendTelegramNotification({
      type: "document_share",
      ...payload,
    });
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) {
    logger.error("Error in sendTelegramDocumentShare", err);
    return { error: err as Error };
  }
}

// ============= Track Context Analysis =============

export type TrackContextAnalysis = studioApi.TrackContextAnalysis;

export async function analyzeTrackContext(audioUrl: string, trackId?: string): Promise<TrackContextAnalysis> {
  const { data, error } = await studioApi.invokeAnalyzeTrackContext({ audioUrl, trackId });
  if (error) throw new Error(error.message);
  return (data ?? {}) as TrackContextAnalysis;
}

// ============= MusicGen Instrumental Generation =============

export interface InstrumentalGenerationResult {
  audioUrl?: string;
}

export async function generateInstrumental(params: {
  prompt: string;
  duration: number;
  model?: string;
}): Promise<InstrumentalGenerationResult> {
  const { data, error } = await studioApi.invokeMusicgenGenerate({
    prompt: params.prompt,
    duration: params.duration,
    model: params.model ?? "melody",
  });
  if (error) throw new Error(error.message);
  return (data ?? {}) as InstrumentalGenerationResult;
}

// ============= Section Replacement History =============

export interface SectionReplacementHistoryEntry {
  id: string;
  startTime: number;
  endTime: number;
  replacedAt: Date;
  versionId?: string;
  label: string;
}

export async function fetchSectionReplacementsHistory(trackId: string): Promise<SectionReplacementHistoryEntry[]> {
  const rows = await studioApi.fetchSectionReplacementsHistory(trackId);
  const locale = "ru-RU";

  return rows.map((row) => {
    const metadata = (row.metadata ?? {}) as { start?: number; end?: number };
    const createdAt = row.created_at ? new Date(row.created_at) : new Date();
    return {
      id: row.id,
      startTime: typeof metadata.start === "number" ? metadata.start : 0,
      endTime: typeof metadata.end === "number" ? metadata.end : 0,
      replacedAt: createdAt,
      versionId: row.version_id ?? undefined,
      label: `Замена ${createdAt.toLocaleDateString(locale, { day: "numeric", month: "short" })}`,
    };
  });
}

// ============= Track Replacement Realtime =============

export interface ReplacementTaskSummary {
  id: string;
  status: string;
  created_at: string;
  error_message?: string | null;
}

export async function fetchReplacementTasksForTrack(trackId: string): Promise<ReplacementTaskSummary[]> {
  const tasks = await studioApi.fetchReplacementTasks(trackId);
  return tasks.map((t) => ({
    id: t.id,
    status: t.status,
    created_at: t.created_at,
    error_message: t.error_message ?? null,
  }));
}

export type ReplacementSubscription = ReturnType<typeof studioApi.subscribeToReplacementTasks>;

export function subscribeToReplacementTasks(
  trackId: string,
  callback: (task: ReplacementTaskSummary) => void,
): ReplacementSubscription {
  return studioApi.subscribeToReplacementTasks(trackId, (task) => {
    callback({
      id: task.id,
      status: task.status,
      created_at: task.created_at,
      error_message: task.error_message ?? null,
    });
  });
}

// ============= Track Remix =============

export async function remixTrack(params: {
  audioId: string;
  prompt: string;
  style: string;
  title: string;
  instrumental: boolean;
  model?: string;
}): Promise<{ error: Error | null }> {
  try {
    const { error } = await studioApi.invokeSunoRemix({
      audioId: params.audioId,
      prompt: params.prompt,
      style: params.style,
      title: params.title,
      instrumental: params.instrumental,
      model: params.model ?? "chirp-v4",
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    logger.error("Error in remixTrack", err);
    return { error: err as Error };
  }
}

// ============= Realtime Subscriptions (Pass 3 — service-layer routing) =============

/**
 * Subscribe to realtime completion events for a generation_tasks row, identified
 * by its suno_task_id. Returns an object exposing `unsubscribe()` so callers can
 * tear down the underlying realtime channel.
 */
export function subscribeToPendingTaskComplete(
  sunoTaskId: string,
  callback: (row: Record<string, unknown>) => void,
): { unsubscribe: () => void } {
  return studioApi.subscribeToPendingTaskComplete(sunoTaskId, callback);
}

/**
 * Subscribe to realtime UPDATE events for a studio_projects row. Returns an
 * object exposing `unsubscribe()` matching the supabase RealtimeChannel shape.
 */
export function subscribeToStudioProject(
  projectId: string,
  callback: (row: Record<string, unknown>) => void,
): { unsubscribe: () => void } {
  return studioApi.subscribeToStudioProject(projectId, callback);
}

/**
 * Subscribe to realtime UPDATE events for a generation_tasks row identified by
 * its suno_task_id. Returns an object exposing `unsubscribe()`.
 */
export function subscribeToGenerationTaskBySunoId(
  sunoTaskId: string,
  callback: (task: { status: string; received_clips: number | null; expected_clips: number | null }) => void,
): { unsubscribe: () => void } {
  return studioApi.subscribeToGenerationTaskBySunoId(sunoTaskId, callback);
}

// ============= Generation Task Lookup (Pass 3 — service-layer routing) =============

export interface GenerationTaskProgressRow {
  status: string;
  received_clips: number | null;
  expected_clips: number | null;
}

/**
 * Fetch the slim status of a generation task by its suno_task_id column.
 * Preserves the `{ data, error }` shape from the api layer so callers can
 * distinguish missing rows from errors.
 */
export async function fetchGenerationTaskBySunoId(
  sunoTaskId: string,
): Promise<{ data: GenerationTaskProgressRow | null; error: unknown }> {
  return studioApi.fetchGenerationTaskBySunoId(sunoTaskId);
}

// ============= Studio Stem Sync (Pass 3 — service-layer routing) =============

/**
 * Fetch minimal stem rows (stem_type + audio_url) for a track. Supports an
 * AbortSignal so callers can cancel in-flight requests on unmount.
 */
export async function fetchTrackStemsMinimal(
  trackId: string,
  signal?: AbortSignal,
): Promise<Array<{ stem_type: string; audio_url: string | null }>> {
  return studioApi.fetchTrackStemsMinimal(trackId, signal);
}

/**
 * Subscribe to realtime INSERT events on track_stems filtered by track_id.
 * Returns `{ unsubscribe }`.
 */
export function subscribeToTrackStemsInsert(
  trackId: string,
  callback: (row: { stem_type: string; audio_url: string | null }) => void,
): { unsubscribe: () => void } {
  return studioApi.subscribeToTrackStemsInsert(trackId, callback);
}

// ============= Stem Resolution (Pass 3 — service-layer routing) =============

export interface TrackStemRow {
  id: string;
  stem_type: string;
  [key: string]: unknown;
}

/**
 * Fetch all stems for a track ordered by creation time (newest first).
 * Returns an empty array when no stems exist or the query errors.
 */
export async function fetchTrackStems(trackId: string): Promise<TrackStemRow[]> {
  const { data, error } = await studioApi.fetchTrackStems(trackId);
  if (error || !data) return [];
  return data as TrackStemRow[];
}

// ============= Transcription Lookups (Pass 3 — service-layer routing) =============

/**
 * Fetch the most recent stem_transcription row for a given stem_id (or null).
 */
export async function fetchLatestStemTranscriptionByStemId(stemId: string): Promise<Record<string, unknown> | null> {
  return studioApi.fetchLatestStemTranscriptionByStemId(stemId);
}

/**
 * Fetch the most recent stem_transcription row for a given track_id (or null).
 */
export async function fetchLatestStemTranscriptionByTrackId(trackId: string): Promise<Record<string, unknown> | null> {
  return studioApi.fetchLatestStemTranscriptionByTrackId(trackId);
}

// ============= Transcription Edge Function Invocations (Pass 3) =============

/**
 * Invoke the Replicate MIDI transcription edge function (Basic Pitch model).
 * Returns the raw response shape so the caller can normalize downstream.
 */
export async function invokeReplicateMidiTranscription(
  payload: studioApi.ReplicateMidiPayload,
): Promise<{ data: studioApi.ReplicateMidiResponse | null; error: Error | null }> {
  return studioApi.invokeReplicateMidiTranscription(payload);
}

/**
 * Invoke the Klangio transcription edge function. Returns the raw response
 * shape so the caller can normalize the file URLs downstream.
 */
export async function invokeKlangioAnalyze(
  payload: studioApi.KlangioAnalyzePayload,
): Promise<{ data: studioApi.KlangioAnalyzeResponse | null; error: Error | null }> {
  return studioApi.invokeKlangioAnalyze(payload);
}

// ============= Validation =============

export function validateSectionBounds(
  section: SectionBounds,
  duration: number,
  maxSectionDuration?: number,
): { valid: boolean; error?: string } {
  if (section.start < 0) {
    return { valid: false, error: "Start time cannot be negative" };
  }

  if (section.end > duration) {
    return { valid: false, error: "End time exceeds track duration" };
  }

  if (section.start >= section.end) {
    return { valid: false, error: "Start time must be before end time" };
  }

  const sectionDuration = section.end - section.start;

  if (sectionDuration < 5) {
    return { valid: false, error: "Section must be at least 5 seconds" };
  }

  if (maxSectionDuration && sectionDuration > maxSectionDuration) {
    return { valid: false, error: `Section cannot exceed ${Math.round(maxSectionDuration)} seconds` };
  }

  return { valid: true };
}
