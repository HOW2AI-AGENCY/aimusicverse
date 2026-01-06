/**
 * Recordings API Layer
 * MusicLab Recording API for Mobile Studio V2
 * Handles recording sessions, chord detection, and audio analysis
 *
 * @see specs/031-mobile-studio-v2/contracts/api-contracts.md (MusicLab Recording API section)
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// ============= Type Definitions =============

/**
 * Recording type enum
 */
export type RecordingType = 'vocal' | 'guitar' | 'other';

/**
 * Recording session metadata
 */
export interface RecordingMetadata {
  device?: string;
  sampleRate?: number;
  bitDepth?: number;
  channels?: number;
  [key: string]: any;
}

/**
 * Request payload for starting a recording session
 */
export interface StartRecordingRequest {
  recordingType: RecordingType;
  trackId?: string;
}

/**
 * Response from starting a recording session
 */
export interface StartRecordingResponse {
  sessionId: string;
  uploadUrl: string;
  uploadHeaders: {
    Authorization: string;
    'Content-Type': string;
  };
  maxDuration: number;
}

/**
 * Request payload for completing a recording session
 */
export interface CompleteRecordingRequest {
  duration: number;
  fileSize: number;
  metadata?: RecordingMetadata;
}

/**
 * Recording data returned after completion
 */
export interface RecordingData {
  id: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
}

/**
 * Response from completing a recording session
 */
export interface CompleteRecordingResponse {
  recording: RecordingData;
}

/**
 * Chord detection response for triggering analysis
 */
export interface ChordDetectionTriggerResponse {
  analysisId: string;
  status: 'processing' | 'pending' | 'queued';
  estimatedTime: number;
}

/**
 * Individual chord data point
 */
export interface ChordData {
  time: number;
  chord: string;
  duration: number;
  confidence: number;
}

/**
 * Chord detection result data
 */
export interface ChordDetectionData {
  id: string;
  status: 'completed' | 'processing' | 'failed';
  chords: ChordData[];
  confidence: number;
  key?: string;
}

/**
 * Chord detection results response
 */
export interface ChordDetectionResultsResponse extends ChordDetectionData {}

/**
 * Error response structure
 */
export interface ApiError {
  error: string;
  message: string;
  details?: any;
  requestId?: string;
}

// ============= API Functions =============

/**
 * Start a new recording session
 *
 * Initializes a recording session and returns a presigned upload URL for the audio file.
 * The upload URL includes authorization headers and has a limited validity period.
 *
 * @param params - Recording parameters
 * @param params.recordingType - Type of recording (vocal, guitar, other)
 * @param params.trackId - Optional track ID to associate with the recording
 *
 * @returns Promise resolving to session info with upload URL
 * @throws {ApiError} If recording type is invalid or user exceeds rate limit
 *
 * @example
 * ```typescript
 * const { sessionId, uploadUrl, uploadHeaders } = await startRecording({
 *   recordingType: 'vocal',
 *   trackId: 'track-uuid'
 * });
 *
 * // Upload audio file
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   headers: uploadHeaders,
 *   body: audioBlob
 * });
 * ```
 */
export async function startRecording(
  params: StartRecordingRequest
): Promise<{ data: StartRecordingResponse | null; error: ApiError | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('musiclab-recording-start', {
      body: params,
    });

    if (error) {
      return {
        data: null,
        error: {
          error: 'FUNCTION_ERROR',
          message: error.message || 'Failed to start recording session',
          details: error,
        },
      };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        error: 'NETWORK_ERROR',
        message: 'Network error while starting recording session',
        details: err,
      },
    };
  }
}

/**
 * Complete a recording session after upload
 *
 * Finalizes a recording session after the audio file has been uploaded.
 * Creates a recording record in the database with metadata and returns the finalized recording.
 *
 * @param sessionId - The session ID from startRecording
 * @param params - Completion parameters
 * @param params.duration - Recording duration in seconds
 * @param params.fileSize - File size in bytes
 * @param params.metadata - Optional recording metadata (device, sample rate, etc.)
 *
 * @returns Promise resolving to completed recording data
 * @throws {ApiError} If session not found, invalid duration, or file size mismatch
 *
 * @example
 * ```typescript
 * const { recording } = await completeRecording('session-uuid', {
 *   duration: 125.5,
 *   fileSize: 2048576,
 *   metadata: {
 *     device: 'iPhone 14 Pro',
 *     sampleRate: 44100
 *   }
 * });
 * ```
 */
export async function completeRecording(
  sessionId: string,
  params: CompleteRecordingRequest
): Promise<{ data: CompleteRecordingResponse | null; error: ApiError | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('musiclab-recording-complete', {
      body: {
        sessionId,
        ...params,
      },
    });

    if (error) {
      return {
        data: null,
        error: {
          error: 'FUNCTION_ERROR',
          message: error.message || 'Failed to complete recording session',
          details: error,
        },
      };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        error: 'NETWORK_ERROR',
        message: 'Network error while completing recording session',
        details: err,
      },
    };
  }
}

/**
 * Trigger chord detection for a recording
 *
 * Initiates asynchronous chord detection analysis on a recording.
 * Returns an analysis ID that can be used to poll for results.
 *
 * @param recordingId - The recording ID to analyze
 *
 * @returns Promise resolving to analysis status and ID
 * @throws {ApiError} If recording not found, analysis already in progress, or rate limit exceeded
 *
 * @example
 * ```typescript
 * const { analysisId, estimatedTime } = await triggerChordDetection('recording-uuid');
 *
 * // Poll for results
 * const checkResults = async () => {
 *   const results = await getChordResults('recording-uuid');
 *   if (results.status === 'completed') {
 *     console.log(results.chords);
 *   } else if (results.status === 'processing') {
 *     setTimeout(checkResults, 2000);
 *   }
 * };
 * setTimeout(checkResults, estimatedTime * 1000);
 * ```
 */
export async function triggerChordDetection(
  recordingId: string
): Promise<{ data: ChordDetectionTriggerResponse | null; error: ApiError | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('musiclab-chord-detect', {
      body: {
        recordingId,
      },
    });

    if (error) {
      return {
        data: null,
        error: {
          error: 'FUNCTION_ERROR',
          message: error.message || 'Failed to trigger chord detection',
          details: error,
        },
      };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        error: 'NETWORK_ERROR',
        message: 'Network error while triggering chord detection',
        details: err,
      },
    };
  }
}

/**
 * Get chord detection results for a recording
 *
 * Retrieves the chord detection analysis results for a recording.
 * Returns completed chords, processing status, or error details.
 *
 * @param recordingId - The recording ID to get results for
 *
 * @returns Promise resolving to chord detection results
 * @throws {ApiError} If recording not found or analysis not initiated
 *
 * @example
 * ```typescript
 * const results = await getChordResults('recording-uuid');
 *
 * if (results.status === 'completed') {
 *   console.log('Detected key:', results.key);
 *   console.log('Overall confidence:', results.confidence);
 *
 *   results.chords.forEach(chord => {
 *     console.log(`At ${chord}s: ${chord.chord} (${chord.duration}s)`);
 *   });
 * }
 * ```
 */
export async function getChordResults(
  recordingId: string
): Promise<{ data: ChordDetectionResultsResponse | null; error: ApiError | null }> {
  try {
    // Try to get results from database first (via Edge Function)
    const { data, error } = await supabase.functions.invoke('musiclab-chord-results', {
      body: {
        recordingId,
      },
    });

    if (error) {
      return {
        data: null,
        error: {
          error: 'FUNCTION_ERROR',
          message: error.message || 'Failed to get chord results',
          details: error,
        },
      };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        error: 'NETWORK_ERROR',
        message: 'Network error while getting chord results',
        details: err,
      },
    };
  }
}

// ============= Direct Database Operations =============
// These will be used once the recording_sessions and chord_detection_results tables are added

/**
 * Recording session row from database (for future use)
 *
 * NOTE: This type will be available after database migration adds recording_sessions table
 * For now, we work with Edge Functions only
 */
/*
export interface RecordingSessionRow {
  id: string;
  user_id: string;
  track_id: string | null;
  recording_type: RecordingType;
  audio_url: string;
  duration: number;
  file_size: number;
  sample_rate: number;
  bit_depth: number;
  channels: number;
  metadata: RecordingMetadata | null;
  created_at: string;
}
*/

/**
 * Chord detection result row from database (for future use)
 *
 * NOTE: This type will be available after database migration adds chord_detection_results table
 * For now, we work with Edge Functions only
 */
/*
export interface ChordDetectionResultRow {
  id: string;
  track_id: string;
  recording_id: string | null;
  user_id: string;
  analysis_id: string;
  chords: ChordData[];
  confidence: number;
  created_at: string;
}
*/

/**
 * Fetch all recording sessions for a user (direct DB operation)
 *
 * NOTE: This function will be implemented after recording_sessions table migration
 *
 * @param userId - User ID to fetch recordings for
 * @param trackId - Optional track ID to filter by
 *
 * @example
 * ```typescript
 * // Future implementation
 * const { data, error } = await fetchRecordingSessions('user-uuid', 'track-uuid');
 * ```
 */
/*
export async function fetchRecordingSessions(
  userId: string,
  trackId?: string
): Promise<{ data: RecordingSessionRow[] | null; error: Error | null }> {
  let query = supabase
    .from('recording_sessions')
    .select('*')
    .eq('user_id', userId);

  if (trackId) {
    query = query.eq('track_id', trackId);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  return { data, error };
}
*/

/**
 * Delete a recording session (direct DB operation)
 *
 * NOTE: This function will be implemented after recording_sessions table migration
 *
 * @param sessionId - Recording session ID to delete
 *
 * @example
 * ```typescript
 * // Future implementation
 * const { error } = await deleteRecordingSession('session-uuid');
 * ```
 */
/*
export async function deleteRecordingSession(
  sessionId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('recording_sessions')
    .delete()
    .eq('id', sessionId);

  return { error };
}
*/

// ============= Utility Functions =============

/**
 * Check if a recording has completed chord analysis
 *
 * @param results - Chord detection results
 * @returns True if analysis is complete
 */
export function isChordAnalysisComplete(
  results: ChordDetectionResultsResponse | null
): results is ChordDetectionResultsResponse {
  return results !== null && results.status === 'completed';
}

/**
 * Format chord data for display
 *
 * @param chord - Chord data point
 * @returns Formatted string (e.g., "0:00 - C (2.5s)")
 */
export function formatChordForDisplay(chord: ChordData): string {
  const minutes = Math.floor(chord.time / 60);
  const seconds = Math.floor(chord.time % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  return `${timeStr} - ${chord.chord} (${chord.duration.toFixed(1)}s)`;
}

/**
 * Calculate total duration from chord data
 *
 * @param chords - Array of chord data points
 * @returns Total duration in seconds
 */
export function calculateTotalDuration(chords: ChordData[]): number {
  if (chords.length === 0) return 0;
  const lastChord = chords[chords.length - 1];
  return lastChord.time + lastChord.duration;
}
