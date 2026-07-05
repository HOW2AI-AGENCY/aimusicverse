/**
 * Studio Operations Service
 * Version management, activity logging, track operations, mashup/persona
 * Extracted from studio.service.ts — Sprint 051 decomposition
 */

import * as studioApi from "@/api/studio.api";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

// Version Management
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

// Activity Logging
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

// Track Extension
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
    if (error) return { error: new Error(error.message) };
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

// SFX Generation
export async function generateSfx(params: { prompt: string; duration: number }): Promise<string> {
  const { data, error } = await studioApi.invokeGenerateSfx({ prompt: params.prompt, duration: params.duration });
  if (error) throw new Error(error.message);
  if (!data?.success || !data?.audioUrl) throw new Error(data?.error || "Failed to generate SFX");
  return data.audioUrl as string;
}

// Add Instrumental / Vocals
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
    return { trackId: payload?.trackId || payload?.track?.id || null, taskId: payload?.taskId || null, error: null };
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
    return { trackId: payload?.trackId || payload?.track?.id || null, taskId: payload?.taskId || null, error: null };
  } catch (err) {
    logger.error("Error in addVocals", err);
    return { trackId: null, taskId: null, error: err as Error };
  }
}

// Upload Cover / Extend
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

// Mashup / Persona / File Upload (Sprint 052)
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
    if (!payload?.taskId || !payload?.trackId)
      return { data: null, error: new Error("Mashup edge returned no taskId/trackId") };
    return { data: payload as SunoMashupResult, error: null };
  } catch (err) {
    logger.error("Error in sunoMashup", err);
    return { data: null, error: err as Error };
  }
}

export type SunoPersonaParams = { trackId: string; name: string; description?: string; model?: string };
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
    if (!payload?.personaId) return { data: null, error: new Error("Persona edge returned no personaId") };
    return { data: payload, error: null };
  } catch (err) {
    logger.error("Error in sunoPersona", err);
    return { data: null, error: err as Error };
  }
}

export interface SunoFileUploadParams {
  filename: string;
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
    if (!payload?.file_url) return { data: null, error: new Error("File upload edge returned no file_url") };
    return { data: payload, error: null };
  } catch (err) {
    logger.error("Error in sunoFileUpload", err);
    return { data: null, error: err as Error };
  }
}

// Track Remix
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
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) {
    logger.error("Error in remixTrack", err);
    return { error: err as Error };
  }
}
