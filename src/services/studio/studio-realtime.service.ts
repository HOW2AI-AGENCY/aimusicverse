/**
 * Studio Realtime Service
 * Telegram notifications, generation tasks, realtime subscriptions, transcription, validation
 * Extracted from studio.service.ts — Sprint 051 decomposition
 */

import * as studioApi from "@/api/studio.api";
import { logger } from "@/lib/logger";

// Telegram Notifications
export interface TelegramDocumentSharePayload {
  chat_id: string | number; document_url: string; document_type: string; filename: string; track_title?: string;
  [key: string]: unknown;
}

export async function sendTelegramDocumentShare(payload: TelegramDocumentSharePayload): Promise<{ error: Error | null }> {
  try {
    const { error } = await studioApi.invokeSendTelegramNotification({ type: "document_share", ...payload });
    if (error) return { error: new Error(error.message) };
    return { error: null };
  } catch (err) { logger.error("Error in sendTelegramDocumentShare", err); return { error: err as Error }; }
}

// Track Context Analysis
export type TrackContextAnalysis = studioApi.TrackContextAnalysis;

export async function analyzeTrackContext(audioUrl: string, trackId?: string): Promise<TrackContextAnalysis> {
  const { data, error } = await studioApi.invokeAnalyzeTrackContext({ audioUrl, trackId });
  if (error) throw new Error(error.message);
  return (data ?? {}) as TrackContextAnalysis;
}

// MusicGen Instrumental Generation
export interface InstrumentalGenerationResult { audioUrl?: string; }

export async function generateInstrumental(params: { prompt: string; duration: number; model?: string }): Promise<InstrumentalGenerationResult> {
  const { data, error } = await studioApi.invokeMusicgenGenerate({ prompt: params.prompt, duration: params.duration, model: params.model ?? "melody" });
  if (error) throw new Error(error.message);
  return (data ?? {}) as InstrumentalGenerationResult;
}

// Section Replacement History
export interface SectionReplacementHistoryEntry { id: string; startTime: number; endTime: number; replacedAt: Date; versionId?: string; label: string; }

export async function fetchSectionReplacementsHistory(trackId: string): Promise<SectionReplacementHistoryEntry[]> {
  const rows = await studioApi.fetchSectionReplacementsHistory(trackId);
  const locale = "ru-RU";
  return rows.map((row) => {
    const metadata = (row.metadata ?? {}) as { start?: number; end?: number };
    const createdAt = row.created_at ? new Date(row.created_at) : new Date();
    return { id: row.id, startTime: typeof metadata.start === "number" ? metadata.start : 0, endTime: typeof metadata.end === "number" ? metadata.end : 0, replacedAt: createdAt, versionId: row.version_id ?? undefined, label: `Замена ${createdAt.toLocaleDateString(locale, { day: "numeric", month: "short" })}` };
  });
}

// Track Replacement Realtime
export interface ReplacementTaskSummary { id: string; status: string; created_at: string; error_message?: string | null; }

export async function fetchReplacementTasksForTrack(trackId: string): Promise<ReplacementTaskSummary[]> {
  const tasks = await studioApi.fetchReplacementTasks(trackId);
  return tasks.map((t) => ({ id: t.id, status: t.status, created_at: t.created_at, error_message: t.error_message ?? null }));
}

export type ReplacementSubscription = ReturnType<typeof studioApi.subscribeToReplacementTasks>;

export function subscribeToReplacementTasks(trackId: string, callback: (task: ReplacementTaskSummary) => void): ReplacementSubscription {
  return studioApi.subscribeToReplacementTasks(trackId, (task) => { callback({ id: task.id, status: task.status, created_at: task.created_at, error_message: task.error_message ?? null }); });
}

// Realtime Subscriptions
export function subscribeToPendingTaskComplete(sunoTaskId: string, callback: (row: Record<string, unknown>) => void): { unsubscribe: () => void } {
  return studioApi.subscribeToPendingTaskComplete(sunoTaskId, callback);
}

export function subscribeToStudioProject(projectId: string, callback: (row: Record<string, unknown>) => void): { unsubscribe: () => void } {
  return studioApi.subscribeToStudioProject(projectId, callback);
}

export function subscribeToGenerationTaskBySunoId(sunoTaskId: string, callback: (task: { status: string; received_clips: number | null; expected_clips: number | null }) => void): { unsubscribe: () => void } {
  return studioApi.subscribeToGenerationTaskBySunoId(sunoTaskId, callback);
}

// Generation Task Lookup
export interface GenerationTaskProgressRow { status: string; received_clips: number | null; expected_clips: number | null; }

export async function fetchGenerationTaskBySunoId(sunoTaskId: string): Promise<{ data: GenerationTaskProgressRow | null; error: unknown }> {
  return studioApi.fetchGenerationTaskBySunoId(sunoTaskId);
}

// Studio Stem Sync
export async function fetchTrackStemsMinimal(trackId: string, signal?: AbortSignal): Promise<Array<{ stem_type: string; audio_url: string | null }>> {
  return studioApi.fetchTrackStemsMinimal(trackId, signal);
}

export function subscribeToTrackStemsInsert(trackId: string, callback: (row: { stem_type: string; audio_url: string | null }) => void): { unsubscribe: () => void } {
  return studioApi.subscribeToTrackStemsInsert(trackId, callback);
}

// Stem Resolution
export interface TrackStemRow { id: string; stem_type: string; [key: string]: unknown; }

export async function fetchTrackStems(trackId: string): Promise<TrackStemRow[]> {
  const { data, error } = await studioApi.fetchTrackStems(trackId);
  if (error || !data) return [];
  return data as TrackStemRow[];
}

// Transcription Lookups
export async function fetchLatestStemTranscriptionByStemId(stemId: string): Promise<Record<string, unknown> | null> {
  return studioApi.fetchLatestStemTranscriptionByStemId(stemId);
}

export async function fetchLatestStemTranscriptionByTrackId(trackId: string): Promise<Record<string, unknown> | null> {
  return studioApi.fetchLatestStemTranscriptionByTrackId(trackId);
}

// Transcription Edge Function Invocations
export async function invokeReplicateMidiTranscription(payload: studioApi.ReplicateMidiPayload): Promise<{ data: studioApi.ReplicateMidiResponse | null; error: Error | null }> {
  return studioApi.invokeReplicateMidiTranscription(payload);
}

export async function invokeKlangioAnalyze(payload: studioApi.KlangioAnalyzePayload): Promise<{ data: studioApi.KlangioAnalyzeResponse | null; error: Error | null }> {
  return studioApi.invokeKlangioAnalyze(payload);
}
