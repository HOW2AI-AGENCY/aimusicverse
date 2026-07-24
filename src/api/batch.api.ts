/**
 * Batch API Layer
 * Raw Supabase operations for batch stem processing functionality.
 *
 * Schema reference: `public.stem_batches` + RPCs `batch_stem_start`,
 * `batch_stem_update_progress`, `batch_stem_cancel`, `batch_stem_get`.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { logger } from "@/lib/logger";

// ==========================================
// Type Definitions
// ==========================================

export type BatchStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface BatchTranscribeRequest {
  trackId: string;
  stemIds: string[];
  model: "basic" | "advanced" | "instrumental";
}

export interface BatchTranscribeResponse {
  batchId: string;
  status: BatchStatus;
  stemsCount: number;
}

export interface BatchSeparateRequest {
  trackId: string;
  stemIds: string[];
  mode: "simple" | "detailed";
}

export interface BatchSeparateResponse {
  batchId: string;
  status: BatchStatus;
  mode: "simple" | "detailed";
}

export interface StemBatchResult {
  stemId: string;
  status: "success" | "processing" | "failed";
  midiUrl?: string;
  progress?: number;
  error?: string;
}

export interface StemBatchSummary {
  total: number;
  success: number;
  processing: number;
  failed: number;
}

export interface StemBatchStatus {
  id: string;
  status: BatchStatus;
  progress: number;
  results: {
    stems: StemBatchResult[];
    summary: StemBatchSummary;
  };
  trackId?: string;
  userId?: string;
  mode?: string | null;
  metadata?: Record<string, unknown>;
}

// ==========================================
// Internal helpers
// ==========================================

interface StemBatchRow {
  id: string;
  status: string;
  progress: number | null;
  results: Json | null;
  metadata: Json | null;
  mode: string | null;
  track_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const EMPTY_SUMMARY: StemBatchSummary = { total: 0, success: 0, processing: 0, failed: 0 };

function toResults(raw: Json | null): StemBatchStatus["results"] {
  const obj = (raw ?? {}) as { stems?: unknown; summary?: unknown };
  const stems = Array.isArray(obj.stems) ? (obj.stems as StemBatchResult[]) : [];
  const summary = (obj.summary as StemBatchSummary | undefined) ?? EMPTY_SUMMARY;
  return { stems, summary };
}

function toMetadata(raw: Json | null): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function mapRow(row: StemBatchRow): StemBatchStatus {
  return {
    id: row.id,
    status: (row.status as BatchStatus) ?? "queued",
    progress: row.progress ?? 0,
    results: toResults(row.results),
    trackId: row.track_id,
    userId: row.user_id,
    mode: row.mode,
    metadata: toMetadata(row.metadata),
  };
}

// ==========================================
// Batch Transcription / Separation Operations
// ==========================================

export async function initiateBatchTranscribe(
  params: BatchTranscribeRequest,
): Promise<BatchTranscribeResponse> {
  const { data, error } = await supabase.functions.invoke("batch-transcribe", {
    body: {
      track_id: params.trackId,
      stem_ids: params.stemIds,
      model: params.model,
    },
  });

  if (error) throw new Error(`Batch transcription failed: ${error.message}`);
  if (!data || (data as { error?: string }).error) {
    throw new Error(
      `Batch transcription failed: ${(data as { message?: string })?.message ?? "unknown error"}`,
    );
  }

  const payload = data as { batch_id: string; status: BatchStatus; stems_count: number };
  return { batchId: payload.batch_id, status: payload.status, stemsCount: payload.stems_count };
}

export async function initiateBatchSeparate(
  params: BatchSeparateRequest,
): Promise<BatchSeparateResponse> {
  const { data, error } = await supabase.functions.invoke("batch-separate", {
    body: {
      track_id: params.trackId,
      stem_ids: params.stemIds,
      mode: params.mode,
    },
  });

  if (error) throw new Error(`Batch separation failed: ${error.message}`);
  if (!data || (data as { error?: string }).error) {
    throw new Error(
      `Batch separation failed: ${(data as { message?: string })?.message ?? "unknown error"}`,
    );
  }

  const payload = data as { batch_id: string; status: BatchStatus; mode: "simple" | "detailed" };
  return { batchId: payload.batch_id, status: payload.status, mode: payload.mode };
}

// ==========================================
// RPC Wrappers — direct access to canonical server-side entry points
// ==========================================

export interface StartStemBatchInput {
  trackId: string;
  mode?: string;
  metadata?: Record<string, unknown>;
}

export async function startStemBatch(input: StartStemBatchInput): Promise<StemBatchStatus> {
  const { data, error } = await supabase.rpc("batch_stem_start", {
    p_track_id: input.trackId,
    p_mode: input.mode,
    p_metadata: (input.metadata ?? {}) as Json,
  });
  if (error) throw new Error(`batch_stem_start failed: ${error.message}`);
  return mapRow(data as unknown as StemBatchRow);
}

export interface UpdateStemBatchProgressInput {
  batchId: string;
  progress: number;
  status?: BatchStatus;
  results?: { stems?: StemBatchResult[]; summary?: StemBatchSummary };
}

export async function updateStemBatchProgress(
  input: UpdateStemBatchProgressInput,
): Promise<StemBatchStatus> {
  const { data, error } = await supabase.rpc("batch_stem_update_progress", {
    p_batch_id: input.batchId,
    p_progress: input.progress,
    p_status: input.status,
    p_results: input.results ? (input.results as unknown as Json) : undefined,
  });
  if (error) throw new Error(`batch_stem_update_progress failed: ${error.message}`);
  return mapRow(data as unknown as StemBatchRow);
}

export async function cancelStemBatch(batchId: string): Promise<StemBatchStatus> {
  const { data, error } = await supabase.rpc("batch_stem_cancel", { p_batch_id: batchId });
  if (error) throw new Error(`batch_stem_cancel failed: ${error.message}`);
  return mapRow(data as unknown as StemBatchRow);
}

export async function getStemBatchViaRpc(batchId: string): Promise<StemBatchStatus> {
  const { data, error } = await supabase.rpc("batch_stem_get", { p_batch_id: batchId });
  if (error) throw new Error(`batch_stem_get failed: ${error.message}`);
  return mapRow(data as unknown as StemBatchRow);
}

// ==========================================
// Direct table reads
// ==========================================

export async function getBatchStatus(batchId: string): Promise<StemBatchStatus> {
  const { data, error } = await supabase
    .from("stem_batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (error) throw new Error(`Failed to get batch status: ${error.message}`);
  if (!data) throw new Error(`Batch ${batchId} not found`);
  return mapRow(data as StemBatchRow);
}

export async function getTrackBatches(trackId: string): Promise<StemBatchStatus[]> {
  const { data, error } = await supabase
    .from("stem_batches")
    .select("*")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to get track batches: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as StemBatchRow));
}

// ==========================================
// Realtime subscription (single batch)
// ==========================================

export function subscribeToBatchUpdates(
  batchId: string,
  callback: (status: StemBatchStatus) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`batch-${batchId}-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "stem_batches", filter: `id=eq.${batchId}` },
      (payload) => {
        try {
          callback(mapRow(payload.new as StemBatchRow));
        } catch (err) {
          logger.warn("subscribeToBatchUpdates: failed to map row", {
            error: err instanceof Error ? err.message : String(err),
          });
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

/**
 * Subscribe to all batches belonging to a specific user (INSERT + UPDATE).
 */
export function subscribeToUserBatches(
  userId: string,
  callback: (status: StemBatchStatus, event: "INSERT" | "UPDATE") => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`user-batches-${userId}-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "stem_batches", filter: `user_id=eq.${userId}` },
      (payload) => callback(mapRow(payload.new as StemBatchRow), "INSERT"),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "stem_batches", filter: `user_id=eq.${userId}` },
      (payload) => callback(mapRow(payload.new as StemBatchRow), "UPDATE"),
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// ==========================================
// Batch Management
// ==========================================

export async function cancelBatch(batchId: string): Promise<void> {
  const { error } = await supabase
    .from("stem_batches")
    .update({ status: "cancelled" })
    .eq("id", batchId)
    .eq("status", "processing");

  if (error) throw new Error(`Failed to cancel batch: ${error.message}`);
}

export async function retryBatch(batchId: string): Promise<string> {
  const { data: originalBatch, error: fetchError } = await supabase
    .from("stem_batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (fetchError || !originalBatch) {
    throw new Error(`Failed to retry batch: ${fetchError?.message ?? "batch not found"}`);
  }

  const metadata = toMetadata((originalBatch as StemBatchRow).metadata);
  const batchType = metadata.batch_type as string | undefined;
  const stemIds = (metadata.stem_ids as string[] | undefined) ?? [];

  if (batchType === "transcribe") {
    const result = await initiateBatchTranscribe({
      trackId: (originalBatch as StemBatchRow).track_id,
      stemIds,
      model: (metadata.model as BatchTranscribeRequest["model"]) ?? "basic",
    });
    return result.batchId;
  }

  if (batchType === "separate") {
    const result = await initiateBatchSeparate({
      trackId: (originalBatch as StemBatchRow).track_id,
      stemIds,
      mode: (metadata.mode as "simple" | "detailed") ?? "simple",
    });
    return result.batchId;
  }

  throw new Error(`Failed to retry batch: unknown batch type "${batchType ?? "null"}"`);
}

export async function deleteBatch(batchId: string): Promise<void> {
  const { error } = await supabase.from("stem_batches").delete().eq("id", batchId);
  if (error) throw new Error(`Failed to delete batch: ${error.message}`);
}

// ==========================================
// Batch Statistics
// ==========================================

export async function getUserBatchStats(userId: string): Promise<{
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  processingBatches: number;
  avgProcessingTime: number;
}> {
  const { data, error } = await supabase
    .from("stem_batches")
    .select("id, status, created_at, updated_at")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to get user batch stats: ${error.message}`);

  const batches = (data ?? []) as Array<Pick<StemBatchRow, "id" | "status" | "created_at" | "updated_at">>;
  const completed = batches.filter((b) => b.status === "completed");
  const failed = batches.filter((b) => b.status === "failed");
  const processing = batches.filter((b) => b.status === "processing");

  let totalTime = 0;
  for (const batch of completed) {
    if (batch.updated_at && batch.created_at) {
      totalTime += new Date(batch.updated_at).getTime() - new Date(batch.created_at).getTime();
    }
  }
  const avgTime = completed.length > 0 ? totalTime / completed.length / 1000 : 0;

  return {
    totalBatches: batches.length,
    completedBatches: completed.length,
    failedBatches: failed.length,
    processingBatches: processing.length,
    avgProcessingTime: Math.round(avgTime),
  };
}

export async function getActiveUserBatches(userId: string): Promise<StemBatchStatus[]> {
  const { data, error } = await supabase
    .from("stem_batches")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to get active batches: ${error.message}`);
  return (data ?? []).map((row) => mapRow(row as StemBatchRow));
}
