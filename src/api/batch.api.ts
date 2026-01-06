// @ts-nocheck
/**
 * Batch API Layer
 * Raw Supabase operations for batch stem processing functionality
 *
 * API Reference: specs/031-mobile-studio-v2/contracts/api-contracts.md
 */

import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Type Definitions
// ==========================================

/**
 * Batch transcription request parameters
 */
export interface BatchTranscribeRequest {
  trackId: string;
  stemIds: string[];
  model: 'basic' | 'advanced' | 'instrumental';
}

/**
 * Batch transcription response
 */
export interface BatchTranscribeResponse {
  batchId: string;
  status: 'processing' | 'queued' | 'failed';
  stemsCount: number;
}

/**
 * Batch stem separation request parameters
 */
export interface BatchSeparateRequest {
  trackId: string;
  stemIds: string[];
  mode: 'simple' | 'detailed';
}

/**
 * Batch stem separation response
 */
export interface BatchSeparateResponse {
  batchId: string;
  status: 'processing' | 'queued' | 'failed';
  mode: 'simple' | 'detailed';
}

/**
 * Stem batch status
 */
export interface StemBatchStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed' | 'queued';
  progress: number;
  results: {
    stems: StemBatchResult[];
    summary: StemBatchSummary;
  };
}

/**
 * Individual stem batch result
 */
export interface StemBatchResult {
  stemId: string;
  status: 'success' | 'processing' | 'failed';
  midiUrl?: string;
  progress?: number;
  error?: string;
}

/**
 * Batch processing summary
 */
export interface StemBatchSummary {
  total: number;
  success: number;
  processing: number;
  failed: number;
}

/**
 * Error response from batch operations
 */
export interface BatchError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// ==========================================
// Batch Transcription Operations
// ==========================================

/**
 * Initiate batch transcription for multiple stems
 *
 * @param params - Batch transcription parameters
 * @returns Promise with batch ID and status
 * @throws Error if transcription fails to initiate
 *
 * @example
 * const result = await initiateBatchTranscribe({
 *   trackId: 'uuid',
 *   stemIds: ['stem1', 'stem2'],
 *   model: 'basic'
 * });
 */
export async function initiateBatchTranscribe(
  params: BatchTranscribeRequest
): Promise<BatchTranscribeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('batch-transcribe', {
      body: {
        track_id: params.trackId,
        stem_ids: params.stemIds,
        model: params.model,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.error) {
      throw new Error(data?.message || 'Failed to initiate batch transcription');
    }

    return {
      batchId: data.batch_id,
      status: data.status,
      stemsCount: data.stems_count,
    };
  } catch (err) {
    const error = err as Error;
    throw new Error(`Batch transcription failed: ${error.message}`);
  }
}

// ==========================================
// Batch Stem Separation Operations
// ==========================================

/**
 * Initiate batch stem separation for multiple stems
 *
 * @param params - Batch separation parameters
 * @returns Promise with batch ID and status
 * @throws Error if separation fails to initiate
 *
 * @example
 * const result = await initiateBatchSeparate({
 *   trackId: 'uuid',
 *   stemIds: ['stem1', 'stem2'],
 *   mode: 'detailed'
 * });
 */
export async function initiateBatchSeparate(
  params: BatchSeparateRequest
): Promise<BatchSeparateResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('batch-separate', {
      body: {
        track_id: params.trackId,
        stem_ids: params.stemIds,
        mode: params.mode,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.error) {
      throw new Error(data?.message || 'Failed to initiate batch separation');
    }

    return {
      batchId: data.batch_id,
      status: data.status,
      mode: data.mode,
    };
  } catch (err) {
    const error = err as Error;
    throw new Error(`Batch separation failed: ${error.message}`);
  }
}

// ==========================================
// Batch Status Operations
// ==========================================

/**
 * Get batch processing status and results
 *
 * @param batchId - The batch ID to query
 * @returns Promise with batch status and results
 * @throws Error if batch not found or query fails
 *
 * @example
 * const status = await getBatchStatus('batch-uuid');
 * console.log(status.progress); // 66
 */
export async function getBatchStatus(
  batchId: string
): Promise<StemBatchStatus> {
  try {
    const { data, error } = await supabase
      .from('stem_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error(`Batch ${batchId} not found`);
    }

    // Transform database response to match API contract
    return {
      id: data.id,
      status: data.status,
      progress: data.progress || 0,
      results: {
        stems: data.results?.stems || [],
        summary: data.results?.summary || {
          total: 0,
          success: 0,
          processing: 0,
          failed: 0,
        },
      },
    };
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to get batch status: ${error.message}`);
  }
}

/**
 * Get all batches for a specific track
 *
 * @param trackId - The track ID to query batches for
 * @returns Promise with array of batch statuses
 * @throws Error if query fails
 *
 * @example
 * const batches = await getTrackBatches('track-uuid');
 */
export async function getTrackBatches(
  trackId: string
): Promise<StemBatchStatus[]> {
  try {
    const { data, error } = await supabase
      .from('stem_batches')
      .select('*')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((batch) => ({
      id: batch.id,
      status: batch.status,
      progress: batch.progress || 0,
      results: {
        stems: batch.results?.stems || [],
        summary: batch.results?.summary || {
          total: 0,
          success: 0,
          processing: 0,
          failed: 0,
        },
      },
    }));
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to get track batches: ${error.message}`);
  }
}

// ==========================================
// Realtime Subscriptions
// ==========================================

/**
 * Subscribe to batch progress updates via Supabase Realtime
 *
 * @param batchId - The batch ID to monitor
 * @param callback - Function called when batch status updates
 * @returns Subscription object (call .unsubscribe() to cleanup)
 *
 * @example
 * const subscription = subscribeToBatchUpdates('batch-uuid', (status) => {
 *   console.log('Progress:', status.progress);
 * });
 * // Later: subscription.unsubscribe();
 */
export function subscribeToBatchUpdates(
  batchId: string,
  callback: (status: StemBatchStatus) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`batch-${batchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stem_batches',
        filter: `id=eq.${batchId}`,
      },
      (payload) => {
        const newStatus = payload.new as unknown as {
          id: string;
          status: string;
          progress: number;
          results: {
            stems: StemBatchResult[];
            summary: StemBatchSummary;
          };
        };

        callback({
          id: newStatus.id,
          status: newStatus.status as StemBatchStatus['status'],
          progress: newStatus.progress || 0,
          results: newStatus.results,
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ==========================================
// Batch Management Operations
// ==========================================

/**
 * Cancel an ongoing batch operation
 *
 * @param batchId - The batch ID to cancel
 * @returns Promise that resolves when cancelled
 * @throws Error if cancellation fails
 *
 * @example
 * await cancelBatch('batch-uuid');
 */
export async function cancelBatch(batchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('stem_batches')
      .update({ status: 'cancelled' })
      .eq('id', batchId)
      .eq('status', 'processing'); // Only allow cancelling if still processing

    if (error) {
      throw new Error(error.message);
    }
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to cancel batch: ${error.message}`);
  }
}

/**
 * Retry a failed batch operation
 *
 * @param batchId - The batch ID to retry
 * @returns Promise with new batch ID
 * @throws Error if retry fails
 *
 * @example
 * const newBatch = await retryBatch('batch-uuid');
 */
export async function retryBatch(batchId: string): Promise<string> {
  try {
    // First, get the original batch details
    const { data: originalBatch, error: fetchError } = await supabase
      .from('stem_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (fetchError || !originalBatch) {
      throw new Error(fetchError?.message || 'Batch not found');
    }

    // Invoke the appropriate batch function based on batch type
    const batchType = originalBatch.metadata?.batch_type;

    if (batchType === 'transcribe') {
      const result = await initiateBatchTranscribe({
        trackId: originalBatch.track_id,
        stemIds: originalBatch.metadata.stem_ids || [],
        model: originalBatch.metadata.model || 'basic',
      });
      return result.batchId;
    } else if (batchType === 'separate') {
      const result = await initiateBatchSeparate({
        trackId: originalBatch.track_id,
        stemIds: originalBatch.metadata.stem_ids || [],
        mode: originalBatch.metadata.mode || 'simple',
      });
      return result.batchId;
    } else {
      throw new Error(`Unknown batch type: ${batchType}`);
    }
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to retry batch: ${error.message}`);
  }
}

/**
 * Delete a batch record
 *
 * @param batchId - The batch ID to delete
 * @returns Promise that resolves when deleted
 * @throws Error if deletion fails
 *
 * @example
 * await deleteBatch('batch-uuid');
 */
export async function deleteBatch(batchId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('stem_batches')
      .delete()
      .eq('id', batchId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to delete batch: ${error.message}`);
  }
}

// ==========================================
// Batch Statistics & Analytics
// ==========================================

/**
 * Get batch statistics for a user
 *
 * @param userId - The user ID to get stats for
 * @returns Promise with batch statistics
 * @throws Error if query fails
 *
 * @example
 * const stats = await getUserBatchStats('user-uuid');
 * console.log(stats.totalBatches);
 */
export async function getUserBatchStats(userId: string): Promise<{
  totalBatches: number;
  completedBatches: number;
  failedBatches: number;
  processingBatches: number;
  avgProcessingTime: number;
}> {
  try {
    const { data, error } = await supabase
      .from('stem_batches')
      .select('id, status, created_at, completed_at')
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    const batches = data || [];
    const completed = batches.filter((b) => b.status === 'completed');
    const failed = batches.filter((b) => b.status === 'failed');
    const processing = batches.filter((b) => b.status === 'processing');

    // Calculate average processing time (in seconds)
    let totalTime = 0;
    completed.forEach((batch) => {
      if (batch.completed_at && batch.created_at) {
        totalTime +=
          new Date(batch.completed_at).getTime() -
          new Date(batch.created_at).getTime();
      }
    });
    const avgTime = completed.length > 0 ? totalTime / completed.length / 1000 : 0;

    return {
      totalBatches: batches.length,
      completedBatches: completed.length,
      failedBatches: failed.length,
      processingBatches: processing.length,
      avgProcessingTime: Math.round(avgTime),
    };
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to get user batch stats: ${error.message}`);
  }
}

/**
 * Get all active batches for a user
 *
 * @param userId - The user ID to query
 * @returns Promise with array of active batch statuses
 * @throws Error if query fails
 *
 * @example
 * const active = await getActiveUserBatches('user-uuid');
 */
export async function getActiveUserBatches(
  userId: string
): Promise<StemBatchStatus[]> {
  try {
    const { data, error } = await supabase
      .from('stem_batches')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['queued', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((batch) => ({
      id: batch.id,
      status: batch.status,
      progress: batch.progress || 0,
      results: {
        stems: batch.results?.stems || [],
        summary: batch.results?.summary || {
          total: 0,
          success: 0,
          processing: 0,
          failed: 0,
        },
      },
    }));
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to get active batches: ${error.message}`);
  }
}
